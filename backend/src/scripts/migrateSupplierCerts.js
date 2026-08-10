require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nmo_db',
    waitForConnections: true,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS supplier_certificates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      photo_url VARCHAR(500) DEFAULT NULL,
      cert_no VARCHAR(50) UNIQUE DEFAULT NULL,
      status ENUM('pending','paid','generated') DEFAULT 'pending',
      payment_ref VARCHAR(100) DEFAULT NULL,
      amount_rwf INT DEFAULT 2000,
      certificate_type_id INT DEFAULT NULL,
      issued_date DATE DEFAULT NULL,
      valid_until DATE DEFAULT NULL,
      generated_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (generated_by) REFERENCES staff(id) ON DELETE SET NULL,
      FOREIGN KEY (certificate_type_id) REFERENCES certificate_types(id) ON DELETE SET NULL
    )
  `);
  console.log('supplier_certificates table created');

  await pool.query(`
    UPDATE supplier_certificates sc
    LEFT JOIN certificate_types ct ON ct.code = 'SUPPLIER'
    SET sc.certificate_type_id = ct.id
    WHERE sc.certificate_type_id IS NULL
  `);
  console.log('existing supplier certificates linked to default type');

  await pool.end();
  console.log('Migration complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
