require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const EXECUTIVES = [
  { username: 'ceo', password: 'Admin@123', executive_role: 'CEO' },
  { username: 'cio', password: 'cio123456', executive_role: 'CIO' },
  { username: 'coo', password: 'coo123456', executive_role: 'COO' },
  { username: 'cmo', password: 'cmo123456', executive_role: 'CMO' },
  { username: 'cfo', password: 'cfo123456', executive_role: 'CFO' },
];

async function main() {
  console.log('Seeding executive accounts...\n');

  for (const exec of EXECUTIVES) {
    const hash = await bcrypt.hash(exec.password, 10);

    const [[existing]] = await pool.query(
      'SELECT id FROM staff WHERE username = ?',
      [exec.username]
    );

    if (existing) {
      await pool.query(
        'UPDATE staff SET executive_role = ?, role = ? WHERE id = ?',
        [exec.executive_role, 'admin', existing.id]
      );
      console.log(`  Updated: ${exec.username} -> ${exec.executive_role} (id: ${existing.id})`);
    } else {
      const [result] = await pool.query(
        `INSERT INTO staff (username, password_hash, phone, role, executive_role, is_active)
         VALUES (?, ?, ?, 'admin', ?, 1)`,
        [exec.username, hash, '+250700000000', exec.executive_role]
      );
      console.log(`  Created: ${exec.username} -> ${exec.executive_role} (id: ${result.insertId})`);
    }
  }

  console.log('\n========================================');
  console.log('EXECUTIVE LOGIN CREDENTIALS');
  console.log('========================================');
  console.log('Login URL: /admin/login');
  console.log('');
  console.log('CEO:      ceo / Admin@123');
  console.log('  -> CEO can create staff accounts via Staff Management page');
  console.log('  -> CEO should change default password after first login');
  console.log('');
  console.log('CIO:      cio / cio123456');
  console.log('COO:      coo / coo123456');
  console.log('CMO:      cmo / cmo123456');
  console.log('CFO:      cfo / cfo123456');
  console.log('========================================');

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
