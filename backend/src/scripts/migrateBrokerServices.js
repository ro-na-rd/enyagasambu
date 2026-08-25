const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
  });

  const sql = `ALTER TABLE users ADD COLUMN IF NOT EXISTS services JSON DEFAULT NULL`;
  await pool.query(sql);
  console.log('services column added to users table');
  process.exit(0);
}

run().catch(err => { console.error('Migration error:', err.message); process.exit(1); });
