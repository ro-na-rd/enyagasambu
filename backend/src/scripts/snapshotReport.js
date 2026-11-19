/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('../config/db');

function iso(d) {
  return d.toISOString().slice(0, 10);
}

async function collect() {
  const [counts] = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE is_verified = 1) AS verified_users,
      (SELECT COUNT(*) FROM listings WHERE status != 'deleted') AS total_listings,
      (SELECT COUNT(*) FROM listings WHERE status = 'active' AND expires_at > NOW()) AS active_listings,
      (SELECT COUNT(*) FROM contact_unlocks) AS total_unlocks,
      (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE type = 'connect_fee') AS connect_fees,
      (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE type = 'listing_fee') AS listing_fees,
      (SELECT COALESCE(SUM(amount), 0) FROM coin_transactions WHERE type = 'boost_fee') AS boost_fees,
      (SELECT COUNT(*) FROM coin_transactions WHERE type = 'connect_fee') AS completed_connections
  `);

  const [byRole] = await pool.query(
    'SELECT role, COUNT(*) AS c FROM users GROUP BY role'
  );

  const [byCategory] = await pool.query(
    `SELECT c.name AS name, COUNT(*) AS c
     FROM listings l JOIN categories c ON c.id = l.category_id
     WHERE l.status != 'deleted'
     GROUP BY c.name ORDER BY c DESC`
  );

  return {
    generated_at: new Date().toISOString(),
    counts: Object.fromEntries(Object.entries(counts[0]).map(([k, v]) => [k, Number(v)])),
    users_by_role: Object.fromEntries(byRole.map((r) => [r.role, Number(r.c)])),
    listings_by_category: Object.fromEntries(byCategory.map((r) => [r.name, Number(r.c)])),
  };
}

async function main() {
  const today = iso(new Date());
  const data = await collect();
  await pool.query(
    `INSERT INTO report_snapshots (snapshot_date, period, data)
     VALUES (?, 'day', ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), created_at = CURRENT_TIMESTAMP`,
    [today, JSON.stringify(data)]
  );
  console.log('[snapshot] upserted day snapshot for ' + today);
  await pool.end();
}

main().catch((err) => {
  console.error('Snapshot error:', err.message);
  process.exit(1);
});