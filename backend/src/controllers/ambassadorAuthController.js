const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { applyReferral } = require('./referralController');

const WELCOME_COINS = 100;

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

exports.register = async (req, res) => {
  const { name, email, phone, password, referral_code } = req.body;

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
      'INSERT INTO users (name, email, phone, password_hash, coins, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone || null, password_hash, WELCOME_COINS, 'ambassador']
    );

    await conn.query(
      "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'purchase', ?)",
      [result.insertId, WELCOME_COINS, 'welcome_bonus']
    );

    if (referral_code) {
      await applyReferral(conn, result.insertId, referral_code.toUpperCase());
    }

    await conn.commit();

    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [result.insertId]);

    const token = signToken({ id: result.insertId, email, role: 'ambassador' });
    return res.status(201).json({
      message: 'Ambassador account created successfully',
      token,
      user: { id: result.insertId, name, email, phone, coins: user.coins, role: 'ambassador' },
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, password_hash, coins, role FROM users WHERE email = ? AND role = ?',
      [email, 'ambassador']
    );
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, coins, role, referral_code, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
