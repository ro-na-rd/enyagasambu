const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendSms } = require('../services/smsService');

const OTP_TTL_MINUTES = 10;

function normalizePhone(phone) {
  return phone.replace(/\s+/g, '');
}

function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function signSessionToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: 'seller' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

exports.requestOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  const normalizedPhone = normalizePhone(phone);
  const conn = await pool.getConnection();

  try {
    const [[existingUser]] = await conn.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [normalizedPhone]);
    let userId;

    if (!existingUser) {
      const password_hash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
      const name = `Seller ${normalizedPhone.slice(-4)}`;
      const [result] = await conn.query(
        'INSERT INTO users (name, email, phone, password_hash, role, coins) VALUES (?, NULL, ?, ?, ?, 0)',
        [name, normalizedPhone, password_hash, 'seller']
      );
      userId = result.insertId;
    } else {
      userId = existingUser.id;
      if (existingUser.role !== 'seller' && existingUser.role !== 'admin') {
        await conn.query('UPDATE users SET role = ? WHERE id = ?', ['seller', existingUser.id]);
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await conn.query(
      'INSERT INTO seller_otps (user_id, phone, code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, normalizedPhone, code, expiresAt]
    );

    await sendSms(normalizedPhone, `Your NMO seller OTP is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);
    return res.json({ message: `OTP sent to ${normalizedPhone}` });
  } catch (err) {
    console.error('[Seller OTP error]', err);
    return res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  } finally {
    conn.release();
  }
};

exports.verifyOtp = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ message: 'Phone and code are required' });

  const normalizedPhone = normalizePhone(phone);
  const conn = await pool.getConnection();

  try {
    const [[otpRow]] = await conn.query(
      `SELECT o.id, u.id AS user_id, u.phone, u.role
       FROM seller_otps o
       JOIN users u ON u.id = o.user_id
       WHERE o.phone = ? AND o.code = ? AND o.used = 0 AND o.expires_at > NOW()
       ORDER BY o.created_at DESC LIMIT 1`,
      [normalizedPhone, code]
    );

    if (!otpRow) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await conn.query('UPDATE seller_otps SET used = 1 WHERE id = ?', [otpRow.id]);

    const [[user]] = await conn.query('SELECT id, phone, role FROM users WHERE id = ?', [otpRow.user_id]);
    const token = await signSessionToken(user);
    return res.json({ token, user: { id: user.id, phone: user.phone, role: 'seller' } });
  } catch (err) {
    console.error('[Seller verify OTP error]', err);
    return res.status(500).json({ message: 'Verification failed' });
  } finally {
    conn.release();
  }
};