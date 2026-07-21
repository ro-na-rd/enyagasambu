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

  const hash = await bcrypt.hash('admin123', 10);

  await pool.query(
    `INSERT IGNORE INTO staff (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
    ['admin', 'admin@nmo.com', hash, '250700000000', 'admin']
  );

  await pool.query(
    `INSERT IGNORE INTO staff (username, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)`,
    ['moderator', 'moderator@nmo.com', hash, '250700000001', 'moderator']
  );

  console.log('Default admin users seeded:');
  console.log('  admin@nmo.com / admin123  (role: admin)');
  console.log('  moderator@nmo.com / admin123  (role: moderator)');

  await pool.end();
}

seed().catch(console.error);
