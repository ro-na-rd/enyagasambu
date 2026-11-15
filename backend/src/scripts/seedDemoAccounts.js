require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { logger } = require('../config/logger');

// Demo accounts for local development and demos. Every entry is upserted by
// email so the script can be re-run safely to reset the demo passwords.

const DEMO_COINS = 5000;

const STAFF_ACCOUNTS = [
  {
    username: 'demo.admin',
    email: 'demo.admin@enyagasambu.rw',
    password: 'Admin@2026',
    phone: '+250788000010',
    role: 'admin',
    executive_role: null,
  },
  {
    username: 'demo.ceo',
    email: 'demo.ceo@enyagasambu.rw',
    password: 'Admin@2026',
    phone: '+250788000011',
    role: 'admin',
    executive_role: 'CEO',
  },
];

const USER_ACCOUNTS = [
  {
    name: 'Demo Ambassador',
    email: 'demo.ambassador@enyagasambu.rw',
    password: 'Ambassador@2026',
    phone: '+250788000012',
    role: 'ambassador',
    referral_code: 'DEMOAMB1',
  },
  {
    name: 'Demo Broker',
    email: 'demo.broker@enyagasambu.rw',
    password: 'Broker@2026',
    phone: '+250788000013',
    role: 'broker',
  },
  {
    name: 'Demo Supplier',
    email: 'demo.supplier@enyagasambu.rw',
    password: 'Supplier@2026',
    phone: '+250788000014',
    role: 'supplier',
  },
  {
    name: 'Demo User',
    email: 'demo.user@enyagasambu.rw',
    password: 'User@2026',
    phone: '+250788000015',
    role: 'user',
  },
];

// Certificate tables share a shape but differ in the owner column name.
const CERT_TABLES = {
  broker: { table: 'broker_certificates', owner: 'broker_id', prefix: 'ENA-BRK' },
  ambassador: { table: 'ambassador_certificates', owner: 'user_id', prefix: 'ENA-AMB' },
  supplier: { table: 'supplier_certificates', owner: 'user_id', prefix: 'ENA-SUP' },
};

async function upsertStaff(account) {
  const hash = await bcrypt.hash(account.password, 10);
  const [[existing]] = await pool.query(
    'SELECT id FROM staff WHERE username = ? OR email = ?',
    [account.username, account.email]
  );

  if (existing) {
    await pool.query(
      'UPDATE staff SET username = ?, email = ?, password_hash = ?, phone = ?, role = ?, executive_role = ?, is_active = 1 WHERE id = ?',
      [account.username, account.email, hash, account.phone, account.role, account.executive_role, existing.id]
    );
    return { id: existing.id, created: false };
  }

  const [result] = await pool.query(
    `INSERT INTO staff (username, email, password_hash, phone, role, executive_role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [account.username, account.email, hash, account.phone, account.role, account.executive_role]
  );
  return { id: result.insertId, created: true };
}

async function upsertUser(account) {
  const hash = await bcrypt.hash(account.password, 12);
  const [[existing]] = await pool.query('SELECT id, role FROM users WHERE email = ?', [account.email]);

  if (existing) {
    await pool.query(
      'UPDATE users SET name = ?, phone = ?, password_hash = ?, role = ?, coins = ?, is_verified = 1 WHERE id = ?',
      [account.name, account.phone, hash, account.role, DEMO_COINS, existing.id]
    );
    if (account.referral_code) {
      await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [account.referral_code, existing.id]);
    }
    return { id: existing.id, created: false };
  }

  const [result] = await pool.query(
    'INSERT INTO users (name, email, phone, password_hash, coins, role, is_verified, referral_code) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    [account.name, account.email, account.phone, hash, DEMO_COINS, account.role, account.referral_code || null]
  );
  return { id: result.insertId, created: true };
}

// A certificate without a cert_no renders as an empty shell, so give each demo
// account a real number using the same format the admin console issues.
async function ensureCertificate(role, userId) {
  const config = CERT_TABLES[role];
  if (!config) return null;

  const [[existing]] = await pool.query(
    `SELECT id, cert_no FROM ${config.table} WHERE ${config.owner} = ? ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  const year = new Date().getFullYear();
  const issuedDate = new Date().toISOString().split('T')[0];
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  const validUntilStr = validUntil.toISOString().split('T')[0];

  if (existing) {
    if (existing.cert_no) return existing.cert_no;
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM ${config.table} WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL`,
      [year]
    );
    const certNo = `${config.prefix}-${year}-${String(cnt + 1).padStart(4, '0')}`;
    await pool.query(
      `UPDATE ${config.table} SET status = 'generated', cert_no = ?, issued_date = ?, valid_until = ? WHERE id = ?`,
      [certNo, issuedDate, validUntilStr, existing.id]
    );
    return certNo;
  }

  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM ${config.table} WHERE YEAR(created_at) = ? AND cert_no IS NOT NULL`,
    [year]
  );
  const certNo = `${config.prefix}-${year}-${String(cnt + 1).padStart(4, '0')}`;
  await pool.query(
    `INSERT INTO ${config.table} (${config.owner}, status, cert_no, issued_date, valid_until, amount_rwf) VALUES (?, 'generated', ?, ?, ?, 2000)`,
    [userId, certNo, issuedDate, validUntilStr]
  );
  return certNo;
}

async function main() {
  console.log('Seeding demo accounts...\n');

  const summary = [];

  for (const account of STAFF_ACCOUNTS) {
    const { id, created } = await upsertStaff(account);
    console.log(`  ${created ? 'Created' : 'Updated'} staff: ${account.username} <${account.email}> (id=${id})`);
    summary.push({ role: account.executive_role ? `Executive (${account.executive_role})` : 'Admin', email: account.email, password: account.password });
  }

  for (const account of USER_ACCOUNTS) {
    const { id, created } = await upsertUser(account);
    const certNo = await ensureCertificate(account.role, id);
    console.log(`  ${created ? 'Created' : 'Updated'} user: ${account.email} [${account.role}] (id=${id}${certNo ? `, cert=${certNo}` : ''})`);
    summary.push({ role: account.role, email: account.email, password: account.password });
  }

  console.log('\n========================================');
  console.log('DEMO LOGIN CREDENTIALS');
  console.log('========================================');
  console.log('All accounts share one login page: /login');
  console.log('Pick the account type when prompted, then sign in.');
  console.log('');
  for (const row of summary) {
    console.log(`${row.role.padEnd(20)} ${row.email.padEnd(32)} ${row.password}`);
  }
  console.log('');
  console.log('Ambassador referral code: DEMOAMB1');
  console.log('========================================');

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Seed failed:', err.message);
  process.exit(1);
});
