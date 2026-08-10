require('dotenv').config();
const pool = require('../config/db');

async function main() {
  await pool.query(
    "ALTER TABLE listings ADD COLUMN client_name VARCHAR(150) DEFAULT NULL AFTER views"
  ).catch((err) => {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('  [skip] listings.client_name already exists');
      return;
    }
    throw err;
  });
  console.log('listings.client_name column added');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
