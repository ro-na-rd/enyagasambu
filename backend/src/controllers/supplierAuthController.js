const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendEmail } = require('../services/emailService');
const { logger } = require('../config/logger');
const { createSession } = require('../services/authSessionService');

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

async function createEmailOtp(conn, userId) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await conn.query('UPDATE supplier_email_otps SET verified = 1 WHERE user_id = ? AND verified = 0', [userId]);
  await conn.query(
    'INSERT INTO supplier_email_otps (user_id, code, expires_at) VALUES (?, ?, ?)',
    [userId, code, expiresAt]
  );
  return code;
}

async function sendVerificationEmail(email, businessName, code) {
  return sendEmail(
    email,
    'Verify your supplier account - E-Nyagasambu',
    `<div style="max-width:520px;margin:32px auto;padding:32px;font-family:Arial,sans-serif;color:#172033;background:#fff;border:1px solid #e5e7eb;border-radius:16px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#E85D04">E-Nyagasambu Supplier</p>
      <h1 style="margin:0 0 12px;font-size:24px">Verify your email address</h1>
      <p style="margin:0 0 20px;line-height:1.6;color:#4b5563">Hello ${escapeHtml(businessName)}, use this code to activate your supplier account.</p>
      <div style="padding:18px;text-align:center;background:#fff7ed;border-radius:12px;font-size:30px;font-weight:800;letter-spacing:.3em;color:#0f1e42">${code}</div>
      <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b7280">This code expires in ${OTP_TTL_MINUTES} minutes. Do not share it with anyone.</p>
    </div>`
  );
}

exports.register = async (req, res) => {
  const { email, password, business_name } = req.body;
  const businessName = business_name.trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await conn.query(
      'INSERT INTO users (name, email, password_hash, coins, role, is_verified) VALUES (?, ?, ?, ?, ?, 0)',
      [businessName, email, password_hash, 0, 'supplier']
    );

    await conn.query(
      'INSERT INTO supplier_profiles (user_id, business_name) VALUES (?, ?)',
      [result.insertId, businessName]
    );

    const code = await createEmailOtp(conn, result.insertId);

    await conn.commit();

    try {
      await sendVerificationEmail(email, businessName, code);
    } catch (emailError) {
      logger.error('[Supplier email verification send error]', emailError);
      return res.status(201).json({
        message: 'Account created, but the verification email could not be sent. Please resend the code.',
        requires_email_verification: true,
        email,
        email_delivery_failed: true,
      });
    }

    return res.status(201).json({
      message: 'Verification code sent to your email address',
      requires_email_verification: true,
      email,
    });
  } catch (err) {
    await conn.rollback();
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.query(
      "SELECT id, name, email, phone, coins, role, is_verified FROM users WHERE email = ? AND role = 'supplier' FOR UPDATE",
      [email]
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: 'Supplier account not found' });
    }
    if (user.is_verified) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const [[otp]] = await conn.query(
      `SELECT id, attempts FROM supplier_email_otps
       WHERE user_id = ? AND code = ? AND verified = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [user.id, code]
    );
    if (!otp) {
      const [[lastOtp]] = await conn.query(
        'SELECT id, attempts FROM supplier_email_otps WHERE user_id = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1 FOR UPDATE',
        [user.id]
      );
      if (lastOtp) {
        const attempts = Number(lastOtp.attempts) + 1;
        await conn.query('UPDATE supplier_email_otps SET attempts = ? WHERE id = ?', [attempts, lastOtp.id]);
        if (attempts >= MAX_OTP_ATTEMPTS) {
          await conn.commit();
          return res.status(429).json({ message: 'Too many incorrect codes. Request a new code.' });
        }
        await conn.commit();
        return res.status(400).json({ message: 'Invalid or expired verification code' });
      }
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    await conn.query('UPDATE supplier_email_otps SET verified = 1 WHERE id = ?', [otp.id]);
    await conn.query('UPDATE users SET is_verified = 1 WHERE id = ?', [user.id]);
    await conn.commit();
    const verifiedUser = { ...user, is_verified: true };
    await createSession(res, verifiedUser);
    return res.json({
      message: 'Email verified successfully',
      token: signToken(verifiedUser),
      user: verifiedUser,
    });
  } catch (err) {
    await conn.rollback();
    logger.error('[Supplier email verification error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.query(
      "SELECT id, name, email, is_verified FROM users WHERE email = ? AND role = 'supplier' FOR UPDATE",
      [email]
    );
    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: 'Supplier account not found' });
    }
    if (user.is_verified) {
      await conn.rollback();
      return res.status(400).json({ message: 'Email is already verified' });
    }
    const code = await createEmailOtp(conn, user.id);
    await conn.commit();
    await sendVerificationEmail(user.email, user.name, code);
    return res.json({ message: 'A new verification code has been sent' });
  } catch (err) {
    await conn.rollback();
    logger.error('[Supplier verification resend error]', err);
    return res.status(500).json({ message: 'Failed to send verification code' });
  } finally {
    conn.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, password_hash, coins, role, is_verified FROM users WHERE email = ? AND role = ?',
      [email, 'supplier']
    );
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.is_verified) return res.status(403).json({ message: 'Verify your email before signing in', requires_email_verification: true });

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    await createSession(res, safeUser);
    return res.json({ token, user: safeUser });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.coins, u.role, u.referral_code, u.created_at,
              sp.business_name, sp.business_phone, sp.business_location, sp.description, sp.verified
       FROM users u
       LEFT JOIN supplier_profiles sp ON sp.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  const { name, phone, business_name, business_phone, business_location, description } = req.body;
  try {
    await pool.query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?', [name, phone, req.user.id]);
    await pool.query(
      `UPDATE supplier_profiles SET
         business_name = COALESCE(?, business_name),
         business_phone = COALESCE(?, business_phone),
         business_location = COALESCE(?, business_location),
         description = COALESCE(?, description)
       WHERE user_id = ?`,
      [business_name, business_phone, business_location, description, req.user.id]
    );
    return res.json({ message: 'Profile updated' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
