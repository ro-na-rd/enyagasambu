const pool = require('../config/db');

const DEFAULT_RATE = 5;

async function getRate() {
  const [[s]] = await pool.query("SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'");
  const rate = parseFloat(s?.setting_value);
  return isNaN(rate) || rate <= 0 ? DEFAULT_RATE : rate;
}

async function recordCommission(conn, brokerId, listingId) {
  const rate = await getRate();
  const [[listing]] = await conn.query(
    "SELECT price FROM listings WHERE id = ? AND user_id = ? AND status = 'sold'",
    [listingId, brokerId]
  );
  if (!listing || listing.price == null) return null;
  const amount = Math.round(parseFloat(listing.price) * (rate / 100));
  await conn.query(
    `INSERT INTO broker_commissions (broker_id, listing_id, amount_rwf)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE amount_rwf = VALUES(amount_rwf)`,
    [brokerId, listingId, amount]
  );
  return { listingId, amount };
}

async function backfillCommissions(brokerId) {
  const rate = await getRate();
  const [rows] = await pool.query(
    `SELECT l.id AS listing_id, l.price, l.created_at
     FROM listings l
     LEFT JOIN broker_commissions bc ON bc.listing_id = l.id
     WHERE l.user_id = ? AND l.status = 'sold' AND bc.id IS NULL AND l.price IS NOT NULL`,
    [brokerId]
  );
  for (const row of rows) {
    const amount = Math.round(parseFloat(row.price) * (rate / 100));
    await pool.query(
      'INSERT INTO broker_commissions (broker_id, listing_id, amount_rwf, created_at) VALUES (?, ?, ?, ?)',
      [brokerId, row.listing_id, amount, row.created_at || new Date()]
    );
  }
  return rows.length;
}

async function getSummary(brokerId) {
  await backfillCommissions(brokerId);
  const [[{ totalCommission }]] = await pool.query(
    'SELECT COALESCE(SUM(amount_rwf), 0) AS totalCommission FROM broker_commissions WHERE broker_id = ?',
    [brokerId]
  );
  const [[{ thisMonth }]] = await pool.query(
    'SELECT COALESCE(SUM(amount_rwf), 0) AS thisMonth FROM broker_commissions WHERE broker_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)',
    [brokerId]
  );
  const [[{ thisQuarter }]] = await pool.query(
    'SELECT COALESCE(SUM(amount_rwf), 0) AS thisQuarter FROM broker_commissions WHERE broker_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)',
    [brokerId]
  );
  const [[{ closedDeals }]] = await pool.query(
    "SELECT COUNT(*) AS closedDeals FROM listings WHERE user_id = ? AND status = 'sold'",
    [brokerId]
  );
  return {
    totalCommission,
    commissionThisMonth: thisMonth,
    commissionThisQuarter: thisQuarter,
    closedDeals,
  };
}

async function getEntries(brokerId) {
  await backfillCommissions(brokerId);
  const [rows] = await pool.query(
    `SELECT bc.id, bc.amount_rwf, bc.created_at,
            l.id AS listing_id, l.title, l.price, l.currency, l.client_name,
            c.name AS category_name
     FROM broker_commissions bc
     JOIN listings l ON l.id = bc.listing_id
     LEFT JOIN categories c ON l.category_id = c.id
     WHERE bc.broker_id = ?
     ORDER BY bc.created_at DESC`,
    [brokerId]
  );
  return rows;
}

module.exports = { getRate, recordCommission, backfillCommissions, getSummary, getEntries, DEFAULT_RATE };
