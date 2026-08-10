require('dotenv').config();
const pool = require('../config/db');

async function main() {
  await pool.query(
    "ALTER TABLE listings ADD COLUMN currency VARCHAR(10) DEFAULT 'RWF' AFTER price_type"
  ).catch((err) => {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('  [skip] listings.currency already exists');
      return;
    }
    throw err;
  });
  console.log('listings.currency column added');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
