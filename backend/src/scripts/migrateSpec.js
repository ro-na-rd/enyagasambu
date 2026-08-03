require('dotenv').config();
const pool = require('../config/db');

async function run() {
  console.log('Applying spec-alignment migrations...');

  // 1. Extend users.role enum with 'supplier'
  await pool.query(
    "ALTER TABLE users MODIFY COLUMN role ENUM('user','seller','admin','broker','ambassador','supplier') NOT NULL DEFAULT 'user'"
  );
  console.log('  [ok] users.role -> supplier');

  // 2. support_requests: category + listing_id
  await pool.query(
    "ALTER TABLE support_requests ADD COLUMN category ENUM('payment','listing','access','other') DEFAULT 'other'"
  ).catch(() => console.log('  [skip] support_requests.category already exists'));
  await pool.query(
    'ALTER TABLE support_requests ADD COLUMN listing_id INT NULL'
  ).catch(() => console.log('  [skip] support_requests.listing_id already exists'));
  console.log('  [ok] support_requests category/listing_id');

  // 3. OTP attempt counters
  for (const table of ['seller_otps', 'staff_otps', 'payment_otps', 'otp_codes']) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN attempts INT DEFAULT 0`)
      .catch(() => console.log(`  [skip] ${table}.attempts already exists`));
  }
  await pool.query('ALTER TABLE contact_access_payments ADD COLUMN otp_attempts INT DEFAULT 0')
    .catch(() => console.log('  [skip] contact_access_payments.otp_attempts already exists'));
  console.log('  [ok] otp attempts columns');

  // 4. payments.provider_ref UNIQUE
  await pool.query('ALTER TABLE payments ADD UNIQUE INDEX uniq_provider_ref (provider_ref)')
    .catch(() => console.log('  [skip] payments.provider_ref unique already exists'));
  console.log('  [ok] payments.provider_ref unique');

  // 5. listing_reports table
  await pool.query(
    `CREATE TABLE IF NOT EXISTS listing_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      listing_id INT NOT NULL,
      reporter_id INT NULL,
      reason ENUM('spam','inappropriate','scam','misleading','illegal','other') NOT NULL,
      details TEXT,
      status ENUM('open','reviewing','actioned','dismissed') DEFAULT 'open',
      resolved_by INT NULL,
      resolved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (resolved_by) REFERENCES staff(id) ON DELETE SET NULL
    )`
  );
  console.log('  [ok] listing_reports');

  // 6. supplier_profiles table
  await pool.query(
    `CREATE TABLE IF NOT EXISTS supplier_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      business_name VARCHAR(200),
      business_phone VARCHAR(20),
      business_location VARCHAR(200),
      description TEXT,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
  console.log('  [ok] supplier_profiles');

  console.log('All migrations applied.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
