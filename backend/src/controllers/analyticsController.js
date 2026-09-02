'use strict';

const pool = require('../config/db');
const { logger } = require('../config/logger');

function parseRange(req) {
  // Accepts from/to as YYYY-MM-DD; defaults to the trailing 30 days.
  const to = new Date(req.query.to || Date.now());
  const from = req.query.from ? new Date(req.query.from) : new Date(to.getTime() - 29 * 86400000);
  const start = new Date(Math.min(from.getTime(), to.getTime()));
  const end = new Date(Math.max(from.getTime(), to.getTime()));
  return { start, end };
}

// Build [{ key, label }] for every calendar day in [start, end].
// Dates are normalized to their UTC YYYY-MM-DD so results never depend on the
// server timezone (mirrors how the SQL day-buckets are sliced).
function dayBuckets(start, end) {
  const from = new Date(start).toISOString().slice(0, 10);
  const to = new Date(end).toISOString().slice(0, 10);
  const buckets = [];
  const cur = new Date(from + 'T00:00:00Z');
  const last = new Date(to + 'T00:00:00Z');
  while (cur.getTime() <= last.getTime()) {
    const key = cur.toISOString().slice(0, 10);
    buckets.push({ key, label: key });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return buckets;
}

async function dailySeries(sql, params, buckets) {
  const [rows] = await pool.query(sql, params);
  const byDate = new Map(rows.map((r) => [String(r.d), Number(r.c)]));
  return buckets.map((b) => ({ date: b.key, value: byDate.get(b.key) || 0 }));
}

async function runFunnel() {
  const [[{ signups }]] = await pool.query('SELECT COUNT(*) AS signups FROM users');
  const [[{ verified }]] = await pool.query('SELECT COUNT(*) AS verified FROM users WHERE is_verified = 1');
  const [[{ posters }]] = await pool.query(
    "SELECT COUNT(DISTINCT user_id) AS posters FROM listings WHERE status != 'deleted'"
  );
  const [[{ activePosters }]] = await pool.query(
    "SELECT COUNT(DISTINCT user_id) AS activePosters FROM listings WHERE status = 'active' AND expires_at > NOW()"
  );
  const [[{ unlockBuyers }]] = await pool.query(
    'SELECT COUNT(DISTINCT buyer_id) AS unlockBuyers FROM contact_unlocks WHERE buyer_id IS NOT NULL'
  );
  const [[{ completedDeals }]] = await pool.query(
    "SELECT COUNT(*) AS completedDeals FROM coin_transactions WHERE type = 'connect_fee'"
  );

  const stages = [
    { key: 'signups', label: 'Verified signups', value: Number(signups) },
    { key: 'verified', label: 'Verified accounts', value: Number(verified) },
    { key: 'posters', label: 'Sellers who posted', value: Number(posters) },
    { key: 'active_posters', label: 'Sellers with active listings', value: Number(activePosters) },
    { key: 'unlock_buyers', label: 'Buyers who unlocked contact', value: Number(unlockBuyers) },
    { key: 'deals', label: 'Completed connections', value: Number(completedDeals) },
  ];

  let max = 0;
  for (const s of stages) max = Math.max(max, s.value);
  return stages.map((s) => ({ ...s, rate: max ? Math.round((s.value / max) * 100) : 0 }));
}

async function getOverview(req, res) {
  try {
    const { start, end } = parseRange(req);
    const params = [start, end];

    const [[base]] = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE created_at BETWEEN ? AND ?) AS registered,
        (SELECT COUNT(*) FROM listings WHERE status != 'deleted' AND created_at BETWEEN ? AND ?) AS listingsCreated,
        (SELECT COUNT(*) FROM listings WHERE status = 'active' AND expires_at > NOW()) AS activeListings,
        (SELECT COUNT(*) FROM contact_unlocks WHERE unlocked_at BETWEEN ? AND ?) AS unlocks,
        (SELECT COALESCE(SUM(amount),0) FROM coin_transactions WHERE type = 'listing_fee' AND created_at BETWEEN ? AND ?) AS listingFees,
        (SELECT COALESCE(SUM(amount),0) FROM coin_transactions WHERE type = 'boost_fee' AND created_at BETWEEN ? AND ?) AS boostFees,
        (SELECT COALESCE(SUM(amount),0) FROM coin_transactions WHERE type = 'connect_fee' AND created_at BETWEEN ? AND ?) AS connectFees`,
      [...params, ...params, ...params, ...params, ...params, ...params, ...params]
    );

    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalListings }]] = await pool.query("SELECT COUNT(*) AS totalListings FROM listings WHERE status != 'deleted'");

    const out = {};
    for (const [k, v] of Object.entries(base)) out[k] = Number(v);
    out.totalUsers = Number(totalUsers);
    out.totalListings = Number(totalListings);
    out.range = { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };

    return res.json({ overview: out });
  } catch (err) {
    logger.error('Error in analytics overview:', err);
    return res.status(500).json({ message: 'Server error while computing overview' });
  }
}

async function getTrends(req, res) {
  try {
    const { start, end } = parseRange(req);
    const endPlus1 = new Date(end.getTime() + 86400000).toISOString().slice(0, 10);
    const buckets = dayBuckets(start, end);
    const [from, to] = [start.toISOString().slice(0, 10), endPlus1];

    const [users, listings, unlocks, revenue] = await Promise.all([
      dailySeries(
        'SELECT DATE(created_at) AS d, COUNT(*) AS c FROM users WHERE created_at >= ? AND created_at < ? GROUP BY DATE(created_at)',
        [from, to],
        buckets
      ),
      dailySeries(
        "SELECT DATE(created_at) AS d, COUNT(*) AS c FROM listings WHERE status != 'deleted' AND created_at >= ? AND created_at < ? GROUP BY DATE(created_at)",
        [from, to],
        buckets
      ),
      dailySeries(
        'SELECT DATE(unlocked_at) AS d, COUNT(*) AS c FROM contact_unlocks WHERE unlocked_at >= ? AND unlocked_at < ? GROUP BY DATE(unlocked_at)',
        [from, to],
        buckets
      ),
      dailySeries(
        `SELECT DATE(created_at) AS d, COALESCE(SUM(amount), 0) AS c
         FROM coin_transactions
         WHERE amount > 0 AND created_at >= ? AND created_at < ?
         GROUP BY DATE(created_at)`,
        [from, to],
        buckets
      ),
    ]);

    return res.json({
      range: { from: buckets[0].key, to: buckets[buckets.length - 1].key },
      series: {
        new_users: users,
        new_listings: listings,
        unlocks: unlocks,
        revenue: revenue,
      },
    });
  } catch (err) {
    logger.error('Error in analytics trends:', err);
    return res.status(500).json({ message: 'Server error while computing trends' });
  }
}

async function getFunnel(req, res) {
  try {
    return res.json({ funnel: await runFunnel() });
  } catch (err) {
    logger.error('Error in analytics funnel:', err);
    return res.status(500).json({ message: 'Server error while computing funnel' });
  }
}

async function getSnapshots(req, res) {
  try {
    const { start, end } = parseRange(req);
    const [rows] = await pool.query(
      'SELECT snapshot_date, data FROM report_snapshots WHERE snapshot_date BETWEEN ? AND ? ORDER BY snapshot_date ASC',
      [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
    );
    return res.json({
      snapshots: rows.map((r) => {
        const d = r.snapshot_date instanceof Date ? r.snapshot_date : new Date(String(r.snapshot_date).slice(0, 10));
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
          date,
          data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        };
      }),
    });
  } catch (err) {
    logger.error('Error reading report snapshots:', err);
    return res.status(500).json({ message: 'Server error while reading snapshots' });
  }
}

module.exports = { getOverview, getTrends, getFunnel, getSnapshots, dayBuckets };