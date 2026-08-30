const pool = require('../config/db');
const crypto = require('crypto');
const { uploadToS3, deleteFromS3Url } = require('../services/s3Service');
const { notifyAdmins, notifyUser } = require('../services/notificationService');

// Staff accounts (admin/moderator) live in the `staff` table, but listings.user_id
// is a FK to `users(id)`. Map a staff member to a marketplace users row, creating one if needed.
async function getOrCreateAdminUserId(conn, staffId) {
  const [[staff]] = await conn.query('SELECT id, username, email, phone FROM staff WHERE id = ?', [staffId]);
  if (!staff) throw new Error('Staff account not found');

  if (staff.email) {
    const [[existing]] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [staff.email]);
    if (existing) return existing.id;
  }

  if (staff.phone) {
    const phoneDigits = staff.phone.replace(/\D/g, '');
    if (phoneDigits) {
      const [rows] = await conn.query('SELECT id, phone FROM users WHERE phone IS NOT NULL');
      const match = rows.find((u) => (u.phone || '').replace(/\D/g, '') === phoneDigits);
      if (match) return match.id;
    }
  }

  const [result] = await conn.query(
    'INSERT INTO users (name, email, phone, password_hash, role, coins) VALUES (?, ?, ?, ?, ?, 0)',
    [staff.username, staff.email || null, staff.phone || null, crypto.randomBytes(32).toString('hex'), 'admin']
  );
  return result.insertId;
}

exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalSellers }]] = await pool.query("SELECT COUNT(*) AS totalSellers FROM users WHERE role = 'seller'");
    const [[{ totalSuppliers }]] = await pool.query("SELECT COUNT(*) AS totalSuppliers FROM users WHERE role = 'supplier'");
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
    const [[{ openReports }]] = await pool.query("SELECT COUNT(*) AS openReports FROM listing_reports WHERE status IN ('open','reviewing')");
    const [[{ totalReports }]] = await pool.query('SELECT COUNT(*) AS totalReports FROM listing_reports');

    const [recentUsers] = await pool.query(
      'SELECT id, name, email, coins, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    const [recentListings] = await pool.query(
      `SELECT l.id, l.title, l.status, l.created_at, u.name AS seller_name
       FROM listings l JOIN users u ON l.user_id = u.id
       WHERE l.status != 'deleted' ORDER BY l.created_at DESC LIMIT 5`
    );

    return res.json({
      stats: { totalUsers, totalSellers, totalSuppliers, totalBrokers, totalAmbassadors, activeListings, disabledListings, totalListings, totalUnlocks, coinsEarned, coinsFromListings, coinsFromBoosts, pendingBrokerCerts, pendingAmbassadorCerts, openReports, totalReports },
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
    const [[user]] = await pool.query('SELECT can_post_free, role FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Ambassadors must always pay for posting - cannot grant free posting
    if (user.role === 'ambassador') {
      return res.status(400).json({ message: 'Ambassadors must pay for posting to maintain platform quality. Free posting cannot be granted to ambassadors.' });
    }
    
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
  if (!['user', 'seller', 'admin', 'broker', 'ambassador', 'supplier'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot change your own role' });
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    if (role === 'supplier') {
      const [profiles] = await pool.query('SELECT id FROM supplier_profiles WHERE user_id = ?', [id]);
      if (profiles.length === 0) {
        await pool.query('INSERT INTO supplier_profiles (user_id) VALUES (?)', [id]);
      }
    }
    return res.json({ message: 'Role updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listSuppliers = async (req, res) => {
  const { verified } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (verified === 'true' || verified === 'false') {
      where += ' AND sp.verified = ?';
      params.push(verified === 'true' ? 1 : 0);
    }
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.created_at,
              sp.business_name, sp.business_phone, sp.business_location, sp.description, sp.verified
       FROM users u
       JOIN supplier_profiles sp ON sp.user_id = u.id
       WHERE ${where}
       ORDER BY u.created_at DESC`,
      params
    );
    return res.json({ suppliers: rows });
  } catch (err) {
    console.error('[Admin listSuppliers error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.verifySupplier = async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body;
  if (typeof verified !== 'boolean') return res.status(400).json({ message: 'verified boolean required' });
  try {
    const [result] = await pool.query(
      'UPDATE supplier_profiles SET verified = ? WHERE user_id = ?',
      [verified ? 1 : 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Supplier not found' });
    return res.json({ message: verified ? 'Supplier verified' : 'Supplier unverified' });
  } catch (err) {
    console.error('[Admin verifySupplier error]', err);
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
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[listing]] = await conn.query(
      `SELECT id, user_id, title, status FROM listings WHERE id = ?`,
      [id]
    );

    if (!listing) {
      await conn.rollback();
      return res.status(404).json({ message: 'Listing not found' });
    }

    const [images] = await conn.query(
      'SELECT id, image_url FROM listing_images WHERE listing_id = ?',
      [id]
    );

    // Permanently delete the listing and all related data
    await conn.query('DELETE FROM listing_images WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_comments WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_likes WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_ratings WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_reports WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM contact_unlocks WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM renewal_tokens WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM coin_transactions WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listings WHERE id = ?', [id]);

    await conn.commit();

    // Remove associated files from storage after DB commit
    for (const img of images) {
      await deleteFromS3Url(img.image_url);
    }

    return res.json({
      message: 'Listing permanently deleted',
      images_deleted: images.length,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Admin delete listing error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
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
  const { title, description, price, currency, category_id, location, listing_type, images } = req.body;
  if (!title || !category_id) return res.status(400).json({ message: 'Title and category are required' });
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Validate category exists
    const [[category]] = await conn.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Admin always gets free posting and 90-day expiration (extended from 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const adminUserId = await getOrCreateAdminUserId(conn, req.user.id);
    
    const [result] = await conn.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, currency, location, listing_type, status, expires_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1)`,
      [adminUserId, category_id, title, description || null, price || null, currency || 'RWF', location || null, listing_type || 'sell', expiresAt]
    );
    
    const listingId = result.insertId;
    
    // Handle images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imageValues = images.map((imageUrl, index) => [listingId, imageUrl, index === 0]);
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    }
    
    // Admin listings don't need renewal tokens (they're free and permanent)
    
    await conn.commit();
    
    // Notify relevant parties
    notifyAdmins('New admin listing', `Admin created listing: ${title}`, 'listing', `/admin/listings`);
    
    return res.status(201).json({ 
      message: 'Admin listing created successfully (free, featured, 90-day duration)', 
      id: listingId,
      expires_at: expiresAt,
      is_featured: true
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Admin createListing error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.createListingWithFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'At least one image is required' });
  }
  
  const { title, description, price, currency, category_id, location, listing_type } = req.body;
  if (!title || !category_id) return res.status(400).json({ message: 'Title and category are required' });
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // Validate category exists
    const [[category]] = await conn.query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Upload all images to S3
    const imageUrls = [];
    for (const file of req.files) {
      const { url } = await uploadToS3(file);
      imageUrls.push(url);
    }
    
    // Admin always gets free posting and 90-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);
    
    const adminUserId = await getOrCreateAdminUserId(conn, req.user.id);
    
    const [result] = await conn.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, currency, location, listing_type, status, expires_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1)`,
      [adminUserId, category_id, title, description || null, price || null, currency || 'RWF', location || null, listing_type || 'sell', expiresAt]
    );
    
    const listingId = result.insertId;
    
    // Insert images
    const imageValues = imageUrls.map((url, index) => [listingId, url, index === 0]);
    await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    
    await conn.commit();
    
    notifyAdmins('New admin listing', `Admin created listing with images: ${title}`, 'listing', `/admin/listings`);
    
    return res.status(201).json({ 
      message: 'Admin listing created successfully with images (free, featured, 90-day duration)', 
      id: listingId,
      images: imageUrls,
      expires_at: expiresAt,
      is_featured: true
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Admin createListingWithFiles error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
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
        const [[owner]] = await pool.query('SELECT user_id, role FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?', [row.listing_id]);
        if (owner && owner.role === 'broker') {
          try {
            const { recordCommission } = require('../services/brokerCommissionService');
            await recordCommission(pool, owner.user_id, row.listing_id);
          } catch (err) {
            console.error('[Commission record error]', err);
          }
        }
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

exports.getDonations = async (req, res) => {
  const { page = 1, search, status, method } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;

  try {
    let where = '1=1';
    const params = [];
    if (search) {
      where += ' AND (donor_name LIKE ? OR donor_phone LIKE ? OR donor_email LIKE ? OR reference_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      where += ' AND d.status = ?';
      params.push(status);
    }
    if (method) {
      where += ' AND d.method = ?';
      params.push(method);
    }

    const [donations] = await pool.query(
      `SELECT d.*, u.name AS account_name
       FROM donations d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE ${where}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM donations d WHERE ${where}`,
      params
    );

    const [[stats]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN d.status = 'confirmed' THEN d.amount_rwf END), 0) AS total_raised,
         COALESCE(SUM(CASE WHEN d.status = 'confirmed' THEN 1 END), 0) AS confirmed_count,
         COALESCE(SUM(CASE WHEN d.status = 'confirmed' AND d.method = 'momo' THEN 1 END), 0) AS momo_count,
         COALESCE(SUM(CASE WHEN d.status = 'confirmed' AND d.method = 'card' THEN 1 END), 0) AS card_count,
         COUNT(*) AS all_count
       FROM donations d`
    );

    return res.json({ donations, total, page: parseInt(page), stats });
  } catch (err) {
    console.error('[Admin getDonations error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.bulkUpdateListings = async (req, res) => {
  const { ids, action, value } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Listing IDs array required' });
  }
  if (!action) return res.status(400).json({ message: 'Action required' });

  try {
    let query, params;
    const placeholders = ids.map(() => '?').join(',');
    
    switch (action) {
      case 'status':
        if (!['active', 'disabled', 'sold', 'expired'].includes(value)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        query = `UPDATE listings SET status = ? WHERE id IN (${placeholders})`;
        params = [value, ...ids];
        break;
      case 'feature':
        query = `UPDATE listings SET is_featured = ? WHERE id IN (${placeholders})`;
        params = [value ? 1 : 0, ...ids];
        break;
      case 'extend':
        const days = parseInt(value) || 30;
        query = `UPDATE listings SET expires_at = DATE_ADD(expires_at, INTERVAL ? DAY) WHERE id IN (${placeholders})`;
        params = [days, ...ids];
        break;
      case 'delete':
        query = `UPDATE listings SET status = 'deleted' WHERE id IN (${placeholders})`;
        params = ids;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    const [result] = await pool.query(query, params);
    return res.json({ 
      message: `Updated ${result.affectedRows} listings`,
      affectedRows: result.affectedRows
    });
  } catch (err) {
    console.error('[Admin bulkUpdateListings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getSystemSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM platform_settings');
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    return res.json({ settings: settingsMap });
  } catch (err) {
    console.error('[Admin getSystemSettings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSystemSettings = async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object required' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO platform_settings (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, JSON.stringify(value), JSON.stringify(value)]
      );
    }
    return res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error('[Admin updateSystemSettings error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query(
      'SELECT id, name, email, phone, coins, role, is_verified, can_post_free, created_at FROM users WHERE id = ?',
      [id]
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get user's listings
    const [listings] = await pool.query(
      'SELECT id, title, status, created_at, expires_at FROM listings WHERE user_id = ? AND status != "deleted" ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    // Get user's transactions
    const [transactions] = await pool.query(
      'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    // Get certificate info if applicable
    let certificate = null;
    if (user.role === 'ambassador') {
      const [[cert]] = await pool.query(
        'SELECT cert_no, status, issued_date, valid_until FROM ambassador_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      if (cert) certificate = { ...cert, type: 'ambassador' };
    } else if (user.role === 'broker') {
      const [[cert]] = await pool.query(
        'SELECT cert_no, status, issued_date, valid_until FROM broker_certificates WHERE broker_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      if (cert) certificate = { ...cert, type: 'broker' };
    } else if (user.role === 'supplier') {
      const [[cert]] = await pool.query(
        'SELECT cert_no, status, issued_date, valid_until FROM supplier_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      if (cert) certificate = { ...cert, type: 'supplier' };
    }

    return res.json({ user, listings, transactions, certificate });
  } catch (err) {
    console.error('[Admin getUserDetails error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.suspendUser = async (req, res) => {
  const { id } = req.params;
  const { reason, duration_days } = req.body;
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot suspend yourself' });

  try {
    const [[user]] = await pool.query('SELECT id, is_suspended FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_suspended) {
      return res.status(400).json({ message: 'User is already suspended' });
    }

    const suspendedUntil = duration_days 
      ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
      : null;

    await pool.query(
      'UPDATE users SET is_suspended = 1, suspended_until = ?, suspension_reason = ? WHERE id = ?',
      [suspendedUntil, reason || 'Violation of platform policies', id]
    );

    notifyUser(id, 'Account suspended', `Your account has been suspended. Reason: ${reason || 'Violation of platform policies'}`, 'suspension', '/profile');

    return res.json({ message: 'User suspended successfully' });
  } catch (err) {
    console.error('[Admin suspendUser error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.unsuspendUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'UPDATE users SET is_suspended = 0, suspended_until = NULL, suspension_reason = NULL WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

    notifyUser(id, 'Account reinstated', 'Your account has been reinstated and is now active.', 'reinstatement', '/profile');

    return res.json({ message: 'User unsuspended successfully' });
  } catch (err) {
    console.error('[Admin unsuspendUser error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminAuctions = async (req, res) => {
  const { page = 1, search, status } = req.query;
  const limit = 20;
  const offset = (parseInt(page) - 1) * limit;
  let where = "l.listing_type = 'auction' AND l.status != 'deleted'";
  const params = [];
  if (search) { where += ' AND (l.title LIKE ? OR u.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (status && status !== 'all') {
    if (status === 'live') where += " AND l.status = 'active' AND (l.auction_start IS NULL OR l.auction_start <= NOW()) AND l.expires_at > NOW()";
    else if (status === 'ended') where += " AND (l.status IN ('expired','sold') OR l.expires_at <= NOW())";
    else if (status === 'sold') where += " AND l.status = 'sold'";
    else { where += ' AND l.status = ?'; params.push(status); }
  }
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.price, l.currency, l.status, l.is_featured, l.expires_at, l.created_at,
              l.highest_bid, l.minimum_increment, l.reserve_price,
              u.name AS seller_name, u.phone AS seller_phone,
              c.name AS category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image,
              (SELECT COUNT(*) FROM auction_bids b WHERE b.listing_id = l.id) AS bid_count
       FROM listings l
       JOIN users u ON l.user_id = u.id
       JOIN categories c ON l.category_id = c.id
       WHERE ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l JOIN users u ON l.user_id = u.id WHERE ${where}`,
      params
    );
    const auctions = rows.map((r) => ({
      ...r,
      price: r.price != null ? Number(r.price) : 0,
      highest_bid: r.highest_bid != null ? Number(r.highest_bid) : null,
      minimum_increment: Number(r.minimum_increment || 500),
      reserve_price: r.reserve_price != null ? Number(r.reserve_price) : null,
      bid_count: Number(r.bid_count || 0),
    }));
    return res.json({ auctions, total, page: parseInt(page) });
  } catch (err) {
    console.error('[Admin getAdminAuctions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuctionBids = async (req, res) => {
  const { id } = req.params;
  try {
    const [bids] = await pool.query(
      `SELECT b.id, b.user_id, b.bidder_name, b.amount, b.created_at,
              u.phone AS bidder_phone
       FROM auction_bids b
       LEFT JOIN users u ON u.id = b.user_id
       WHERE b.listing_id = ? ORDER BY b.amount DESC, b.created_at ASC LIMIT 200`,
      [id]
    );
    return res.json({ bids });
  } catch (err) {
    console.error('[Admin getAuctionBids error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAuction = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[auction]] = await conn.query(
      `SELECT id FROM listings WHERE id = ? AND listing_type = 'auction'`,
      [id]
    );
    if (!auction) {
      await conn.rollback();
      return res.status(404).json({ message: 'Auction not found' });
    }
    const [images] = await conn.query(
      'SELECT id, image_url FROM listing_images WHERE listing_id = ?', [id]
    );
    await conn.query('DELETE FROM listing_images WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM auction_bids WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM auction_watches WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_comments WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_likes WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_ratings WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listing_reports WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM contact_unlocks WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM renewal_tokens WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM coin_transactions WHERE listing_id = ?', [id]);
    await conn.query('DELETE FROM listings WHERE id = ?', [id]);
    await conn.commit();
    for (const img of images) await deleteFromS3Url(img.image_url);
    return res.json({ message: 'Auction permanently deleted' });
  } catch (err) {
    await conn.rollback();
    console.error('[Admin deleteAuction error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.id) return res.status(400).json({ message: 'Cannot delete yourself' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Soft delete - mark as deleted rather than actual deletion
    await conn.query('UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?', [id]);
    
    // Deactivate all their listings
    await conn.query("UPDATE listings SET status = 'disabled' WHERE user_id = ?", [id]);

    await conn.commit();
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('[Admin deleteUser error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
