require('dotenv').config();
const pool = require('../config/db');
const { logger } = require('../config/logger');

async function main() {
  const sql = `CREATE TABLE IF NOT EXISTS broker_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    listing_id INT NOT NULL UNIQUE,
    amount_rwf INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
  )`;
  await pool.query(sql);
  console.log('broker_commissions table created successfully');
  await pool.end();
}

main().catch((err) => {
  logger.error('Migration failed:', err.message);
  process.exit(1);
});
