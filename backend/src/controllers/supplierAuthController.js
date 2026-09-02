const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logger } = require('../config/logger');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

exports.register = async (req, res) => {
  const { name, email, phone, password, business_name, business_phone, business_location } = req.body;

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
      [name, email, phone || null, password_hash, 0, 'supplier']
    );

    await conn.query(
      `INSERT INTO supplier_profiles (user_id, business_name, business_phone, business_location)
       VALUES (?, ?, ?, ?)`,
      [result.insertId, business_name || null, business_phone || phone || null, business_location || null]
    );

    await conn.commit();

    const token = signToken({ id: result.insertId, email, role: 'supplier' });
    return res.status(201).json({
      message: 'Supplier account created successfully',
      token,
      user: { id: result.insertId, name, email, phone, coins: 0, role: 'supplier' },
    });
  } catch (err) {
    await conn.rollback();
    logger.error(err);
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
      [email, 'supplier']
    );
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid email or password' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;
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
