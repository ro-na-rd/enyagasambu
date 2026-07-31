require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nmo_db',
    waitForConnections: true,
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@nmo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(adminPassword, 10);

  await pool.query(
    `INSERT INTO staff (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email), password_hash = VALUES(password_hash), role = VALUES(role)`,
    [adminEmail, adminEmail, hash, '250700000000', 'admin']
  );

  await pool.query(
    `INSERT IGNORE INTO staff (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
    ['moderator', 'moderator@nmo.com', hash, '250700000001', 'moderator']
  );

  console.log('Default admin users seeded:');
  console.log(`  ${adminEmail} / ${adminPassword}  (role: admin)`);
  console.log('  moderator@nmo.com / admin123  (role: moderator)');

  await pool.end();
}

seed().catch(console.error);
