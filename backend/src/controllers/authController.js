const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { uploadToS3, deleteFromS3Url } = require('../services/s3Service');
const { applyReferral } = require('./referralController');
const { notifyAdmins } = require('../services/notificationService');
const { logger } = require('../config/logger');
const { createSession } = require('../services/authSessionService');

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
      'INSERT INTO users (name, email, phone, password_hash, coins) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, password_hash, 0]
    );

    // Apply referral bonus if code provided
    if (referral_code) {
      await applyReferral(conn, result.insertId, referral_code.toUpperCase());
    }

    await conn.commit();

    // Fetch actual coin balance (may have referral bonus)
    const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ?', [result.insertId]);

    notifyAdmins('New user registered', `${name} just created an account.`, 'user', '/admin/users');

    const token = signToken({ id: result.insertId, email, role: 'user' });
    await createSession(res, { id: result.insertId, name, email, phone, photo_url: null, coins: user.coins, role: 'user' });
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: result.insertId, name, email, phone, photo_url: null, coins: user.coins, role: 'user' },
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
      'SELECT id, name, email, phone, photo_url, password_hash, coins, role FROM users WHERE email = ?',
      [email]
    );
    if (rows.length > 0) {
      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

      const token = signToken(user);
      const { password_hash, ...safeUser } = user;
      await createSession(res, safeUser);
      return res.json({ token, user: { ...safeUser, photo_url: safeUser.photo_url || null } });
    }

    // Fallback: check staff table (admins/moderators) by username or email
    const [[staff]] = await pool.query(
      'SELECT id, username, phone, role, executive_role, password_hash FROM staff WHERE (username = ? OR (email IS NOT NULL AND email = ?)) AND is_active = 1 LIMIT 1',
      [email, email]
    );
    if (!staff) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: staff.id, username: staff.username, phone: staff.phone, role: staff.role, is_staff: true, executive_role: staff.executive_role || null },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    await createSession(res, { id: staff.id, name: staff.username, username: staff.username, email: staff.email || staff.username, phone: staff.phone, role: staff.role, is_staff: true, executive_role: staff.executive_role || null });

    return res.json({
      token,
      role: staff.role,
      user: { id: staff.id, name: staff.username, email: staff.username, phone: staff.phone, role: staff.role, executive_role: staff.executive_role || null },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const isStaff = req.user.is_staff === true;
    const table = isStaff ? 'staff' : 'users';
    let query;
    if (isStaff) {
      query = 'SELECT id, username as name, COALESCE(email, username) as email, phone, NULL AS photo_url, role, executive_role, created_at FROM staff WHERE id = ?';
    } else {
      query = 'SELECT id, name, email, phone, photo_url, coins, role, referral_code, created_at FROM users WHERE id = ?';
    }
    const [rows] = await pool.query(query, [req.user.id]);
    if (rows.length === 0) return res.status(401).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  const { name, phone } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id, name, phone, photo_url FROM users WHERE id = ?', [req.user.id]);
    if (!existing) return res.status(404).json({ message: 'User not found' });

    let photoUrl = existing.photo_url;
    let uploadedNewPhoto = false;
    if (req.file) {
      const { url } = await uploadToS3(req.file);
      photoUrl = url;
      uploadedNewPhoto = true;
    }

    await pool.query(
      'UPDATE users SET name = ?, phone = ?, photo_url = ? WHERE id = ?',
      [name ? String(name).trim() : existing.name, phone ? String(phone).trim() : existing.phone, photoUrl, req.user.id]
    );

    const [[updated]] = await pool.query('SELECT id, name, email, phone, photo_url, coins, role, referral_code, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json({ message: 'Profile updated', user: updated });

    if (uploadedNewPhoto && existing.photo_url) {
      await deleteFromS3Url(existing.photo_url);
    }
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.summary = async (req, res) => {
  try {
    if (req.user.is_staff) {
      return res.json({
        stats: { total: 0, active: 0, expired: 0, sold: 0, views: 0, coins: 0 },
        recentListings: [],
      });
    }
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) AS sold,
              SUM(CASE WHEN status = 'expired' OR (status = 'active' AND expires_at <= NOW()) THEN 1 ELSE 0 END) AS expired,
              COALESCE(SUM(views), 0) AS views
       FROM listings WHERE user_id = ? AND status != 'deleted'`,
      [req.user.id]
    );
    const [[me]] = await pool.query('SELECT coins FROM users WHERE id = ?', [req.user.id]);
    const [recentListings] = await pool.query(
      `SELECT l.id, l.title, l.price, l.currency, l.location, l.status, l.views, l.expires_at, l.created_at,
              c.name AS category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       WHERE l.user_id = ? AND l.status != 'deleted'
       ORDER BY l.created_at DESC LIMIT 5`,
      [req.user.id]
    );
    return res.json({
      stats: {
        total: Number(stats.total) || 0,
        active: Number(stats.active) || 0,
        expired: Number(stats.expired) || 0,
        sold: Number(stats.sold) || 0,
        views: Number(stats.views) || 0,
        coins: Number(me?.coins) || 0,
      },
      recentListings,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.applyPromo = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Promo code required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[promo]] = await conn.query(
      'SELECT * FROM promo_codes WHERE code = ? AND (expires_at IS NULL OR expires_at > NOW()) AND uses < max_uses FOR UPDATE',
      [code.toUpperCase()]
    );
    if (!promo) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid or expired promo code' });
    }
    await conn.query('UPDATE users SET coins = coins + ? WHERE id = ?', [promo.discount_coins, req.user.id]);
    await conn.query('UPDATE promo_codes SET uses = uses + 1 WHERE id = ?', [promo.id]);
    await conn.query(
      "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'purchase', ?)",
      [req.user.id, promo.discount_coins, `promo_${promo.code}`]
    );
    await conn.commit();
    return res.json({ message: `${promo.discount_coins} coins added!`, coins: promo.discount_coins });
  } catch (err) {
    await conn.rollback();
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
