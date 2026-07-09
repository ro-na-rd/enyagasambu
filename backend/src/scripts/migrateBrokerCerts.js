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

  const sql = `CREATE TABLE IF NOT EXISTS broker_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    photo_url VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
    status ENUM('pending','paid','generated') DEFAULT 'pending',
    payment_ref VARCHAR(100) DEFAULT NULL,
    amount_rwf INT DEFAULT 2000,
    issued_date DATE DEFAULT NULL,
    valid_until DATE DEFAULT NULL,
    generated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL
  )`;
  await pool.query(sql);
  console.log('broker_certificates table created successfully');
  process.exit(0);
}

run().catch(err => { console.error('Migration error:', err.message); process.exit(1); });
