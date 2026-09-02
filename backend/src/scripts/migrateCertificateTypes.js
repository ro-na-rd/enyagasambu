const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { logger } = require('../config/logger');

const DEFAULT_TYPES = [
  {
    code: 'BROKER',
    name: 'Certified Broker',
    description: 'Official E-Nyagasambu Certified Broker ID card. Authorizes you to facilitate product, property and vehicle brokerage on the marketplace.',
    category: 'broker',
    price_rwf: 2000,
    duration_years: 1,
  },
  {
    code: 'AMBASSADOR',
    name: 'Brand Ambassador',
    description: 'Official E-Nyagasambu Brand Ambassador certificate. Recognizes your dedication to promoting digital commerce and local businesses.',
    category: 'ambassador',
    price_rwf: 2000,
    duration_years: 1,
  },
  {
    code: 'SUPPLIER',
    name: 'Verified Supplier',
    description: 'Official E-Nyagasambu Verified Supplier certificate. Builds buyer trust by verifying your supplier account on the marketplace.',
    category: 'supplier',
    price_rwf: 3000,
    duration_years: 1,
  },
];

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS certificate_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(30) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      description TEXT DEFAULT NULL,
      category ENUM('broker','ambassador','supplier') NOT NULL DEFAULT 'broker',
      price_rwf INT NOT NULL DEFAULT 2000,
      duration_years INT NOT NULL DEFAULT 1,
      active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log('certificate_types table created');

  for (const t of DEFAULT_TYPES) {
    await pool.query(
      `INSERT INTO certificate_types (code, name, description, category, price_rwf, duration_years)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description),
         category = VALUES(category), price_rwf = VALUES(price_rwf), duration_years = VALUES(duration_years)`,
      [t.code, t.name, t.description, t.category, t.price_rwf, t.duration_years]
    );
  }
  console.log('default certificate types seeded');

  const [[{ count: brokerCol }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'broker_certificates' AND COLUMN_NAME = 'certificate_type_id'`
  );
  if (!brokerCol) {
    await pool.query('ALTER TABLE broker_certificates ADD COLUMN certificate_type_id INT DEFAULT NULL');
    console.log('broker_certificates.certificate_type_id added');
  }

  const [[{ count: ambCol }]] = await pool.query(
    `SELECT COUNT(*) AS count FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ambassador_certificates' AND COLUMN_NAME = 'certificate_type_id'`
  );
  if (!ambCol) {
    await pool.query('ALTER TABLE ambassador_certificates ADD COLUMN certificate_type_id INT DEFAULT NULL');
    console.log('ambassador_certificates.certificate_type_id added');
  }

  await pool.query(
    `UPDATE broker_certificates bc
     LEFT JOIN certificate_types ct ON ct.code = 'BROKER'
     SET bc.certificate_type_id = ct.id
     WHERE bc.certificate_type_id IS NULL`
  );
  await pool.query(
    `UPDATE ambassador_certificates ac
     LEFT JOIN certificate_types ct ON ct.code = 'AMBASSADOR'
     SET ac.certificate_type_id = ct.id
     WHERE ac.certificate_type_id IS NULL`
  );
  console.log('existing certificates linked to default types');

  console.log('Migration complete');
  await pool.end();
  process.exit(0);
}

run().catch(err => { logger.error('Migration error:', err.message); process.exit(1); });
