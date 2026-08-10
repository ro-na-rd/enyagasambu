const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
  });

  const sql = `CREATE TABLE IF NOT EXISTS broker_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    client_id INT DEFAULT NULL,
    direction ENUM('inbound','outbound') NOT NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_email VARCHAR(150) DEFAULT NULL,
    sender_phone VARCHAR(30) DEFAULT NULL,
    body TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES broker_clients(id) ON DELETE SET NULL
  )`;
  await pool.query(sql);
  console.log('broker_messages table created successfully');
  process.exit(0);
}

run().catch(err => { console.error('Migration error:', err.message); process.exit(1); });
