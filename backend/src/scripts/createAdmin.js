require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const phone = process.argv[4] || '0000000000';

  if (!email || !password) {
    console.error('Usage: node src/scripts/createAdmin.js <email> <password> [phone]');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  const [existing] = await pool.query(
    'SELECT id, username, email FROM staff WHERE username = ? OR email = ?',
    [email, email]
  );

  if (existing.length > 0) {
    await pool.query(
      'UPDATE staff SET email = ?, password_hash = ?, is_active = TRUE WHERE id = ?',
      [email, hash, existing[0].id]
    );
    console.log(`Admin updated (id=${existing[0].id}): ${email}`);
  } else {
    const [result] = await pool.query(
      'INSERT INTO staff (username, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [email, email, hash, phone, 'admin']
    );
    console.log(`Admin created (id=${result.insertId}): ${email}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
