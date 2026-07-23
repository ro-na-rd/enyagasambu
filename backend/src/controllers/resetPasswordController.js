const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [email]);
    const [[staff]] = await pool.query(
      "SELECT id, username AS name, email FROM staff WHERE email = ? OR username = ? LIMIT 1",
      [email, email]
    );

    const account = users[0] || staff;
    if (!account) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );

    return res.json({
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[forgotPassword]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const [[row]] = await pool.query(
      'SELECT id, email, expires_at FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW() LIMIT 1',
      [token]
    );
    if (!row) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hash = await bcrypt.hash(password, 12);

    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [row.email]);
    if (users.length > 0) {
      await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, row.email]);
    } else {
      const [staff] = await pool.query('SELECT id FROM staff WHERE email = ? OR username = ? LIMIT 1', [row.email, row.email]);
      if (staff.length > 0) {
        await pool.query('UPDATE staff SET password_hash = ? WHERE id = ?', [hash, staff[0].id]);
      }
    }

    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id]);

    return res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error('[resetPassword]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
