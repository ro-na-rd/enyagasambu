const pool = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalSellers }]] = await pool.query("SELECT COUNT(*) AS totalSellers FROM users WHERE role = 'seller'");
    const [[{ totalBrokers }]] = await pool.query("SELECT COUNT(*) AS totalBrokers FROM users WHERE role = 'broker'");
    const [[{ totalAmbassadors }]] = await pool.query("SELECT COUNT(*) AS totalAmbassadors FROM users WHERE role = 'ambassador'");
    const [[{ activeListings }]] = await pool.query("SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active' AND expires_at > NOW()");
    const [[{ disabledListings }]] = await pool.query("SELECT COUNT(*) AS disabledListings FROM listings WHERE status = 'disabled'");
    const [[{ totalListings }]] = await pool.query("SELECT COUNT(*) AS totalListings FROM listings WHERE status != 'deleted'");
    const [[{ totalUnlocks }]] = await pool.query('SELECT COUNT(*) AS totalUnlocks FROM contact_unlocks');
    const [[{ coinsEarned }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsEarned FROM coin_transactions WHERE type = 'connect_fee'");
    const [[{ coinsFromListings }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsFromListings FROM coin_transactions WHERE type = 'listing_fee'");
    const [[{ coinsFromBoosts }]] = await pool.query("SELECT COALESCE(SUM(ABS(amount)), 0) AS coinsFromBoosts FROM coin_transactions WHERE type = 'boost_fee'");
    const [[{ pendingBrokerCerts }]] = await pool.query("SELECT COUNT(*) AS pendingBrokerCerts FROM broker_certificates WHERE status IN ('pending','paid')");
    const [[{ pendingAmbassadorCerts }]] = await pool.query("SELECT COUNT(*) AS pendingAmbassadorCerts FROM ambassador_certificates WHERE status IN ('pending','paid')");

    const [recentUsers] = await pool.query(
      'SELECT id, name, email, coins, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const [recentListings] = await pool.query(
      `SELECT l.id, l.title, l.status, l.created_at, u.name AS seller_name
       FROM listings l JOIN users u ON l.user_id = u.id
       WHERE l.status != 'deleted' ORDER BY l.created_at DESC LIMIT 5`
    );

    return res.json({
      stats: { totalUsers, totalSellers, totalBrokers, totalAmbassadors, activeListings, disabledListings, totalListings, totalUnlocks, coinsEarned, coinsFromListings, coinsFromBoosts, pendingBrokerCerts, pendingAmbassadorCerts },
      recentUsers,
      recentListings,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  const { page = 1, search, role: roleFilter } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = '1=1';
  const params = [];
  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (roleFilter) {
    where += ' AND role = ?';
    params.push(roleFilter);
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
  if (!['user', 'seller', 'admin', 'broker', 'ambassador'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
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

exports.toggleListingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['active', 'disabled', 'sold', 'expired'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    await pool.query('UPDATE listings SET status = ? WHERE id = ?', [status, id]);
    return res.json({ message: `Listing status changed to ${status}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getParticipants = async (req, res) => {
  const { period = 'all' } = req.query;
  let dateFilter = '';
  if (period === 'daily') dateFilter = "AND created_at >= CURDATE()";
  else if (period === 'weekly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)";
  else if (period === 'monthly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
  else if (period === 'yearly') dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";

  try {
    const [[{ sellers }]] = await pool.query(`SELECT COUNT(*) AS sellers FROM users WHERE role = 'seller' ${dateFilter}`);
    const [[{ buyers }]] = await pool.query(`SELECT COUNT(*) AS buyers FROM users WHERE role = 'user' ${dateFilter}`);
    const [[{ brokers }]] = await pool.query(`SELECT COUNT(*) AS brokers FROM users WHERE role = 'broker' ${dateFilter}`);
    const [[{ ambassadors }]] = await pool.query(`SELECT COUNT(*) AS ambassadors FROM users WHERE role = 'ambassador' ${dateFilter}`);
    const [[{ totalActiveListings }]] = await pool.query("SELECT COUNT(*) AS totalActiveListings FROM listings WHERE status = 'active' AND expires_at > NOW()");
    const [[{ completedDeals }]] = await pool.query("SELECT COUNT(*) AS completedDeals FROM coin_transactions WHERE type = 'connect_fee'");

    return res.json({ sellers, buyers, brokers, ambassadors, totalActiveListings, completedDeals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRevenueChart = async (req, res) => {
  const { period = 'monthly' } = req.query;
  try {
    let format = '%Y-%m';
    let groupBy = '1 MONTH';
    let limit = 12;
    if (period === 'weekly') { format = '%x-W%v'; groupBy = '1 WEEK'; limit = 12; }
    if (period === 'daily') { format = '%Y-%m-%d'; groupBy = '1 DAY'; limit = 30; }
    if (period === 'yearly') { format = '%Y'; groupBy = '1 YEAR'; limit = 5; }

    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '${format}') AS label,
              SUM(ABS(amount)) AS value
       FROM coin_transactions
       WHERE type IN ('connect_fee','listing_fee','boost_fee')
       GROUP BY label ORDER BY label DESC LIMIT ?`,
      [limit]
    );
    return res.json({ chart: rows.reverse() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createListing = async (req, res) => {
  const { title, description, price, category_id, location, listing_type } = req.body;
  if (!title || !category_id) return res.status(400).json({ message: 'Title and category are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, location, listing_type, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 30 DAY))`,
      [req.user.id, category_id, title, description || null, price || null, location || null, listing_type || 'sell']
    );
    return res.status(201).json({ message: 'Listing created', id: result.insertId });
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

exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    if (req.user.is_staff) {
      await pool.query('UPDATE staff SET username = ?, phone = ? WHERE id = ?', [email || name, phone || null, req.user.id]);
    } else {
      await pool.query('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?', [name, email, phone, req.user.id]);
    }
    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
