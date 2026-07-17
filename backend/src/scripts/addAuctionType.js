const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'nmo_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
});
async function main() {
  await pool.query("ALTER TABLE listings MODIFY COLUMN listing_type ENUM('sell','rent','auction') DEFAULT 'sell'");
  console.log('listing_type ENUM updated (added auction)');
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
