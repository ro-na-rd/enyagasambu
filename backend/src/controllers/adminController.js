const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ activeListings }]] = await pool.query("SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active' AND expires_at > NOW()");
    const [[{ totalListings }]] = await pool.query("SELECT COUNT(*) AS totalListings FROM listings WHERE status != 'deleted'");
    const [[{ totalUnlocks }]] = await pool.query('SELECT COUNT(*) AS totalUnlocks FROM contact_unlocks');
    const [[{ coinsEarned }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsEarned FROM coin_transactions WHERE type = 'connect_fee'");
    const [[{ coinsFromListings }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsFromListings FROM coin_transactions WHERE type = 'listing_fee'");
    const [[{ coinsFromBoosts }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsFromBoosts FROM coin_transactions WHERE type = 'boost_fee'");

    const [recentUsers] = await pool.query(
      'SELECT id, name, email, coins, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const [recentListings] = await pool.query(
      `SELECT l.id, l.title, l.status, l.created_at, u.name AS seller_name
       FROM listings l JOIN users u ON l.user_id = u.id
       WHERE l.status != 'deleted' ORDER BY l.created_at DESC LIMIT 5`
    );

    return res.json({
      stats: { totalUsers, activeListings, totalListings, totalUnlocks, coinsEarned, coinsFromListings, coinsFromBoosts },
      recentUsers,
      recentListings,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  const { page = 1, search } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = '1=1';
  const params = [];
  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  try {
    const [users] = await pool.query(
      `SELECT id, name, email, phone, coins, role, is_verified, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params);
    return res.json({ users, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot change your own role' });
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.grantCoins = async (req, res) => {
  const { id } = req.params;
  const { coins, reason } = req.body;
  if (!coins || isNaN(coins)) return res.status(400).json({ message: 'Invalid coin amount' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE users SET coins = coins + ? WHERE id = ?', [parseInt(coins), id]);
    await conn.query(
      "INSERT INTO coin_transactions (user_id, amount, type, reference) VALUES (?, ?, 'purchase', ?)",
      [id, parseInt(coins), reason || 'admin_grant']
    );
    await conn.commit();
    return res.json({ message: `${coins} coins granted` });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getAdminListings = async (req, res) => {
  const { page = 1, search, status } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = "l.status != 'deleted'";
  const params = [];
  if (search) { where += ' AND l.title LIKE ?'; params.push(`%${search}%`); }
  if (status) { where += ' AND l.status = ?'; params.push(status); }
  try {
    const [listings] = await pool.query(
      `SELECT l.id, l.title, l.status, l.listing_type, l.is_featured, l.expires_at, l.created_at,
              u.name AS seller_name, c.name AS category_name
       FROM listings l JOIN users u ON l.user_id = u.id JOIN categories c ON l.category_id = c.id
       WHERE ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l WHERE ${where}`, params
    );
    return res.json({ listings, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE listings SET status = 'deleted' WHERE id = ?", [id]);
    return res.json({ message: 'Listing removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createPromo = async (req, res) => {
  const { code, discount_coins, max_uses, expires_at } = req.body;
  if (!code || !discount_coins) return res.status(400).json({ message: 'code and discount_coins required' });
  try {
    await pool.query(
      'INSERT INTO promo_codes (code, discount_coins, max_uses, expires_at) VALUES (?, ?, ?, ?)',
      [code.toUpperCase(), parseInt(discount_coins), max_uses || 100, expires_at || null]
    );
    return res.status(201).json({ message: 'Promo code created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Code already exists' });
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getPromos = async (req, res) => {
  try {
    const [promos] = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    return res.json({ promos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
