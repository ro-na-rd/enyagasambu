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
      `SELECT id, name, email, phone, coins, role, is_verified, can_post_free, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params);
    return res.json({ users, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleFreePosting = async (req, res) => {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query('SELECT can_post_free FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const newVal = user.can_post_free ? 0 : 1;
    await pool.query('UPDATE users SET can_post_free = ? WHERE id = ?', [newVal, id]);
    return res.json({ can_post_free: !!newVal, message: newVal ? 'User can now post for free' : 'Free posting removed' });
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
    const [[{ sellers }]] = await pool.query(`SELECT COUNT(DISTINCT user_id) AS sellers FROM listings WHERE status != 'deleted' ${dateFilter.replace('created_at', 'created_at')}`);
    const [[{ buyers }]] = await pool.query(`SELECT COUNT(DISTINCT buyer_id) AS buyers FROM contact_unlocks WHERE buyer_id IS NOT NULL ${dateFilter.replace('created_at', 'unlocked_at')}`);
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
  const { search } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (search) {
      where += ' AND code LIKE ?';
      params.push(`%${search}%`);
    }
    const [promos] = await pool.query(
      `SELECT *,
        CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN 'expired'
             WHEN uses >= max_uses THEN 'depleted'
             ELSE 'active' END AS status
       FROM promo_codes WHERE ${where} ORDER BY created_at DESC`, params
    );
    return res.json({ promos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePromo = async (req, res) => {
  const { id } = req.params;
  const { code, discount_coins, max_uses, expires_at } = req.body;
  try {
    const fields = [];
    const params = [];
    if (code !== undefined) { fields.push('code = ?'); params.push(code.toUpperCase()); }
    if (discount_coins !== undefined) { fields.push('discount_coins = ?'); params.push(parseInt(discount_coins)); }
    if (max_uses !== undefined) { fields.push('max_uses = ?'); params.push(parseInt(max_uses)); }
    if (expires_at !== undefined) { fields.push('expires_at = ?'); params.push(expires_at || null); }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    params.push(id);
    const [result] = await pool.query(`UPDATE promo_codes SET ${fields.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Promo not found' });
    return res.json({ message: 'Promo updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Code already exists' });
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePromo = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM promo_codes WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Promo not found' });
    return res.json({ message: 'Promo deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getConnects = async (req, res) => {
  const { page = 1, search, status, type, date_from, date_to, sale_status } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;

  try {
    // 1. Coin-based unlocks from contact_unlocks
    let whereCu = '1=1';
    const paramsCu = [];
    if (search) {
      whereCu += ' AND (bu.name LIKE ? OR bu.phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsCu.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereCu += ' AND (cu.expires_at IS NULL OR cu.expires_at > NOW())';
    if (status === 'expired') whereCu += ' AND cu.expires_at IS NOT NULL AND cu.expires_at <= NOW()';
    if (sale_status) { whereCu += ' AND cu.sale_status = ?'; paramsCu.push(sale_status); }
    if (date_from) { whereCu += ' AND cu.unlocked_at >= ?'; paramsCu.push(date_from); }
    if (date_to) { whereCu += ' AND cu.unlocked_at <= ?'; paramsCu.push(date_to + ' 23:59:59'); }
    if (type && type !== 'coin') whereCu += ' AND 0=1';

    const [coinUnlocks] = await pool.query(
      `SELECT cu.id, cu.buyer_id, cu.listing_id, cu.buyer_phone, cu.expires_at, cu.unlocked_at,
              cu.sale_status,
              'coin' AS connect_type,
              CASE WHEN cu.expires_at IS NULL THEN 'permanent'
                   WHEN cu.expires_at > NOW() THEN 'active'
                   ELSE 'expired' END AS status,
              bu.name AS buyer_name, bu.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status,
              l.listing_type
       FROM contact_unlocks cu
       LEFT JOIN users bu ON cu.buyer_id = bu.id
       JOIN listings l ON cu.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCu}
       ORDER BY cu.unlocked_at DESC LIMIT ? OFFSET ?`,
      [...paramsCu, limit, offset]
    );

    const [[{ totalCu }]] = await pool.query(
      `SELECT COUNT(*) AS totalCu FROM contact_unlocks cu
       LEFT JOIN users bu ON cu.buyer_id = bu.id
       JOIN listings l ON cu.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCu}`, paramsCu
    );

    // 2. MoMo payment-based connections from contact_access_payments
    let whereCap = '1=1';
    const paramsCap = [];
    if (search) {
      whereCap += ' AND (bu.name LIKE ? OR cap.buyer_phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsCap.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereCap += " AND cap.status = 'confirmed'";
    if (status === 'expired') whereCap += " AND cap.status = 'failed'";
    if (status === 'pending') whereCap += " AND cap.status IN ('pending','verified')";
    if (date_from) { whereCap += ' AND cap.created_at >= ?'; paramsCap.push(date_from); }
    if (date_to) { whereCap += ' AND cap.created_at <= ?'; paramsCap.push(date_to + ' 23:59:59'); }
    if (type && type !== 'momo') whereCap += ' AND 0=1';

    const [momoPayments] = await pool.query(
      `SELECT cap.id, cap.buyer_id, cap.listing_id, cap.buyer_phone, cap.reference_id,
              cap.amount_rwf, cap.status AS payment_status, cap.otp_verified, cap.created_at AS unlocked_at,
              'pending' AS sale_status,
              'momo' AS connect_type,
              CASE WHEN cap.status = 'confirmed' THEN 'active'
                   WHEN cap.status = 'failed' THEN 'failed'
                   WHEN cap.status = 'verified' THEN 'otp_pending'
                   ELSE 'pending' END AS status,
              bu.name AS buyer_name, bu.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status,
              l.listing_type
       FROM contact_access_payments cap
       LEFT JOIN users bu ON cap.buyer_id = bu.id
       JOIN listings l ON cap.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCap}
       ORDER BY cap.created_at DESC LIMIT ? OFFSET ?`,
      [...paramsCap, limit, offset]
    );

    const [[{ totalCap }]] = await pool.query(
      `SELECT COUNT(*) AS totalCap FROM contact_access_payments cap
       LEFT JOIN users bu ON cap.buyer_id = bu.id
       JOIN listings l ON cap.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCap}`, paramsCap
    );

    // 3. OTP-based connections from otp_codes
    let whereOtp = '1=1';
    const paramsOtp = [];
    if (search) {
      whereOtp += ' AND (u.name LIKE ? OR o.phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsOtp.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereOtp += " AND o.used = 1";
    if (status === 'expired') whereOtp += " AND o.used = 0 AND o.expires_at <= NOW()";
    if (status === 'pending') whereOtp += " AND o.used = 0 AND o.expires_at > NOW()";
    if (date_from) { whereOtp += ' AND o.created_at >= ?'; paramsOtp.push(date_from); }
    if (date_to) { whereOtp += ' AND o.created_at <= ?'; paramsOtp.push(date_to + ' 23:59:59'); }
    if (type && type !== 'otp') whereOtp += ' AND 0=1';

    const [otpCodes] = await pool.query(
      `SELECT o.id, o.user_id AS buyer_id, o.listing_id, o.phone AS buyer_phone, o.used,
              o.expires_at, o.created_at AS unlocked_at,
              'pending' AS sale_status,
              'otp' AS connect_type,
              CASE WHEN o.used = 1 THEN 'completed'
                   WHEN o.expires_at <= NOW() THEN 'expired'
                   ELSE 'pending' END AS status,
              u.name AS buyer_name, u.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status,
              l.listing_type
       FROM otp_codes o
       LEFT JOIN users u ON o.user_id = u.id
       JOIN listings l ON o.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereOtp}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...paramsOtp, limit, offset]
    );

    const [[{ totalOtp }]] = await pool.query(
      `SELECT COUNT(*) AS totalOtp FROM otp_codes o
       LEFT JOIN users u ON o.user_id = u.id
       JOIN listings l ON o.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereOtp}`, paramsOtp
    );

    // Merge and sort all connects
    const allConnects = [...coinUnlocks, ...momoPayments, ...otpCodes]
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
      .slice(0, limit);

    const total = totalCu + totalCap + totalOtp;

    // Summary stats
    const [[{ totalCoinConnects }]] = await pool.query('SELECT COUNT(*) AS totalCoinConnects FROM contact_unlocks');
    const [[{ totalMomoConnects }]] = await pool.query("SELECT COUNT(*) AS totalMomoConnects FROM contact_access_payments WHERE status = 'confirmed'");
    const [[{ totalOtpConnects }]] = await pool.query('SELECT COUNT(*) AS totalOtpConnects FROM otp_codes WHERE used = 1');
    const [[{ pendingOtps }]] = await pool.query("SELECT COUNT(*) AS pendingOtps FROM otp_codes WHERE used = 0 AND expires_at > NOW()");
    const [[{ pendingPayments }]] = await pool.query("SELECT COUNT(*) AS pendingPayments FROM contact_access_payments WHERE status IN ('pending','verified')");
    const [[{ moMoRevenue }]] = await pool.query("SELECT COALESCE(SUM(amount_rwf), 0) AS moMoRevenue FROM contact_access_payments WHERE status = 'confirmed'");

    // Seller summary
    const [sellerSummary] = await pool.query(
      `SELECT su.id AS seller_id, su.name AS seller_name, su.phone AS seller_phone,
              COUNT(*) AS connect_count,
              SUM(CASE WHEN cu.sale_status = 'sold' THEN 1 ELSE 0 END) AS sold_count,
              SUM(CASE WHEN cu.sale_status = 'rented' THEN 1 ELSE 0 END) AS rented_count
       FROM contact_unlocks cu
       JOIN listings l ON cu.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       GROUP BY su.id, su.name, su.phone
       ORDER BY connect_count DESC`
    );

    return res.json({
      connects: allConnects,
      total,
      page: parseInt(page),
      stats: {
        totalCoinConnects,
        totalMomoConnects,
        totalOtpConnects,
        pendingOtps,
        pendingPayments,
        totalAll: totalCoinConnects + totalMomoConnects + totalOtpConnects,
        moMoRevenue,
      },
      sellerSummary,
    });
  } catch (err) {
    console.error('[Admin getConnects error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateContactSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { sale_status } = req.body;
  if (!['pending', 'sold', 'rented'].includes(sale_status)) {
    return res.status(400).json({ message: 'Invalid sale_status' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE contact_unlocks SET sale_status = ? WHERE id = ?',
      [sale_status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Connect not found' });
    }
    if (sale_status === 'sold') {
      const [[row]] = await pool.query('SELECT listing_id FROM contact_unlocks WHERE id = ?', [id]);
      if (row) {
        await pool.query("UPDATE listings SET status = 'sold' WHERE id = ?", [row.listing_id]);
      }
    }
    return res.json({ message: 'Sale status updated', sale_status });
  } catch (err) {
    console.error('[Admin updateContactSaleStatus error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.exportConnects = async (req, res) => {
  const { search, status, type, date_from, date_to, sale_status } = req.query;
  try {
    let whereCu = '1=1';
    const paramsCu = [];
    if (search) {
      whereCu += ' AND (bu.name LIKE ? OR bu.phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsCu.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereCu += ' AND (cu.expires_at IS NULL OR cu.expires_at > NOW())';
    if (status === 'expired') whereCu += ' AND cu.expires_at IS NOT NULL AND cu.expires_at <= NOW()';
    if (sale_status) { whereCu += ' AND cu.sale_status = ?'; paramsCu.push(sale_status); }
    if (date_from) { whereCu += ' AND cu.unlocked_at >= ?'; paramsCu.push(date_from); }
    if (date_to) { whereCu += ' AND cu.unlocked_at <= ?'; paramsCu.push(date_to + ' 23:59:59'); }
    if (type && type !== 'coin') whereCu += ' AND 0=1';

    const [coinUnlocks] = await pool.query(
      `SELECT cu.id, cu.buyer_phone, cu.unlocked_at, cu.sale_status,
              'coin' AS connect_type, bu.name AS buyer_name, bu.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status
       FROM contact_unlocks cu
       LEFT JOIN users bu ON cu.buyer_id = bu.id
       JOIN listings l ON cu.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCu} ORDER BY cu.unlocked_at DESC`, paramsCu
    );

    let whereCap = '1=1';
    const paramsCap = [];
    if (search) {
      whereCap += ' AND (bu.name LIKE ? OR cap.buyer_phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsCap.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereCap += " AND cap.status = 'confirmed'";
    if (status === 'expired') whereCap += " AND cap.status = 'failed'";
    if (status === 'pending') whereCap += " AND cap.status IN ('pending','verified')";
    if (date_from) { whereCap += ' AND cap.created_at >= ?'; paramsCap.push(date_from); }
    if (date_to) { whereCap += ' AND cap.created_at <= ?'; paramsCap.push(date_to + ' 23:59:59'); }
    if (type && type !== 'momo') whereCap += ' AND 0=1';

    const [momoPayments] = await pool.query(
      `SELECT cap.id, cap.buyer_phone, cap.amount_rwf, cap.created_at AS unlocked_at,
              'pending' AS sale_status, 'momo' AS connect_type,
              bu.name AS buyer_name, bu.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status
       FROM contact_access_payments cap
       LEFT JOIN users bu ON cap.buyer_id = bu.id
       JOIN listings l ON cap.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereCap} ORDER BY cap.created_at DESC`, paramsCap
    );

    let whereOtp = '1=1';
    const paramsOtp = [];
    if (search) {
      whereOtp += ' AND (u.name LIKE ? OR o.phone LIKE ? OR l.title LIKE ? OR su.name LIKE ? OR su.phone LIKE ?)';
      paramsOtp.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status === 'active') whereOtp += " AND o.used = 1";
    if (status === 'expired') whereOtp += " AND o.used = 0 AND o.expires_at <= NOW()";
    if (status === 'pending') whereOtp += " AND o.used = 0 AND o.expires_at > NOW()";
    if (date_from) { whereOtp += ' AND o.created_at >= ?'; paramsOtp.push(date_from); }
    if (date_to) { whereOtp += ' AND o.created_at <= ?'; paramsOtp.push(date_to + ' 23:59:59'); }
    if (type && type !== 'otp') whereOtp += ' AND 0=1';

    const [otpCodes] = await pool.query(
      `SELECT o.id, o.phone AS buyer_phone, o.created_at AS unlocked_at,
              'pending' AS sale_status, 'otp' AS connect_type,
              u.name AS buyer_name, u.email AS buyer_email,
              su.name AS seller_name, su.phone AS seller_phone, su.email AS seller_email,
              l.title AS listing_title, l.price AS listing_price, l.status AS listing_status
       FROM otp_codes o
       LEFT JOIN users u ON o.user_id = u.id
       JOIN listings l ON o.listing_id = l.id
       JOIN users su ON l.user_id = su.id
       WHERE ${whereOtp} ORDER BY o.created_at DESC`, paramsOtp
    );

    const all = [...coinUnlocks, ...momoPayments, ...otpCodes]
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime());

    return res.json({ connects: all });
  } catch (err) {
    console.error('[Admin exportConnects error]', err);
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
