const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendSms } = require('../services/smsService');

const OTP_TTL_MINUTES = 10;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('[Admin login attempt]', email);
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

  try {
    const [[staff]] = await pool.query(
      'SELECT * FROM staff WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    if (!staff) {
      console.log('[Admin login] staff not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) {
      console.log('[Admin login] wrong password for:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: staff.id, email: staff.email, phone: staff.phone, role: staff.role, is_staff: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      role: staff.role,
      user: { id: staff.id, name: staff.username, email: staff.email, phone: staff.phone, role: staff.role },
    });
  } catch (err) {
    console.error('[Admin login error]', err);
    return res.status(500).json({ message: 'Login failed' });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

  try {
    const [[otpRow]] = await pool.query(
      `SELECT o.id, s.id AS staff_id, s.phone, s.role
       FROM staff_otps o
       JOIN staff s ON s.id = o.staff_id
       WHERE s.email = ? AND o.code = ? AND o.used = 0 AND o.expires_at > NOW()
       ORDER BY o.created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!otpRow) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE staff_otps SET used = 1 WHERE id = ?', [otpRow.id]);
    await pool.query('UPDATE staff SET last_login = NOW() WHERE id = ?', [otpRow.staff_id]);

    const [[staffInfo]] = await pool.query('SELECT username, email, phone, role FROM staff WHERE id = ?', [otpRow.staff_id]);

    const token = jwt.sign(
      { id: otpRow.staff_id, email: staffInfo?.email, phone: otpRow.phone, role: otpRow.role, is_staff: true },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token, role: otpRow.role, user: { id: otpRow.staff_id, name: staffInfo?.username || 'Admin', email: staffInfo?.email, phone: otpRow.phone, role: otpRow.role } });
  } catch (err) {
    console.error('[Admin verify OTP error]', err);
    return res.status(500).json({ message: 'Verification failed' });
  }
};

exports.me = async (req, res) => {
  try {
    const [[staff]] = await pool.query(
      'SELECT id, username AS name, email, phone, role FROM staff WHERE id = ? AND is_active = 1',
      [req.user.id]
    );
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    return res.json({ user: staff });
  } catch (err) {
    console.error('[Admin me error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};