require('dotenv').config();
const pool = require('../config/db');
const { logger } = require('../config/logger');

async function main() {
  // 1. executive_roles
  await pool.query(`CREATE TABLE IF NOT EXISTS executive_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('executive_roles table created');

  // 2. executive_permissions
  await pool.query(`CREATE TABLE IF NOT EXISTS executive_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module VARCHAR(50) NOT NULL,
    can_view TINYINT(1) DEFAULT 1,
    can_manage TINYINT(1) DEFAULT 0,
    can_approve TINYINT(1) DEFAULT 0,
    can_export TINYINT(1) DEFAULT 0,
    FOREIGN KEY (role_id) REFERENCES executive_roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_module (role_id, module)
  )`);
  console.log('executive_permissions table created');

  // 3. executive_audit_log
  await pool.query(`CREATE TABLE IF NOT EXISTS executive_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    executive_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    record_id INT,
    previous_value JSON,
    new_value JSON,
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
  )`);
  console.log('executive_audit_log table created');

  // 4. executive_approvals
  await pool.query(`CREATE TABLE IF NOT EXISTS executive_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    requested_by INT NOT NULL,
    metadata JSON,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    reviewed_by INT DEFAULT NULL,
    reviewed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requested_by) REFERENCES staff(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES staff(id) ON DELETE SET NULL
  )`);
  console.log('executive_approvals table created');

  // 5. executive_alerts
  await pool.query(`CREATE TABLE IF NOT EXISTS executive_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    severity ENUM('low','medium','high') DEFAULT 'medium',
    message TEXT NOT NULL,
    value DECIMAL(10,2),
    status ENUM('active','dismissed') DEFAULT 'active',
    dismissed_by INT DEFAULT NULL,
    dismissed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dismissed_by) REFERENCES staff(id) ON DELETE SET NULL
  )`);
  console.log('executive_alerts table created');

  // 6. Add executive_role column to staff table if not exists
  try {
    await pool.query(`ALTER TABLE staff ADD COLUMN executive_role VARCHAR(50) DEFAULT NULL AFTER role`);
    console.log('staff.executive_role column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('staff.executive_role column already exists');
    } else throw e;
  }

  // 7. Add email column to staff table if not exists
  try {
    await pool.query(`ALTER TABLE staff ADD COLUMN email VARCHAR(100) NULL UNIQUE AFTER username`);
    console.log('staff.email column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('staff.email column already exists');
    } else throw e;
  }

  // --- Seed executive_roles ---
  const roles = [
    ['CEO', 'Chief Executive Officer – full platform oversight'],
    ['CIO', 'Chief Information Officer – technology, security, infrastructure'],
    ['COO', 'Chief Operating Officer – day-to-day operations'],
    ['CMO', 'Chief Marketing Officer – marketing, campaigns, outreach'],
    ['CFO', 'Chief Financial Officer – revenue, finance, payments'],
  ];

  for (const [name, description] of roles) {
    await pool.query(
      `INSERT INTO executive_roles (name, description) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE description = VALUES(description)`,
      [name, description]
    );
  }
  console.log('executive_roles seeded');

  // --- Seed executive_permissions ---
  const perms = [
    // CEO
    ['CEO', 'executive_kpis', 1, 0, 0, 0],
    ['CEO', 'financial_summaries', 1, 0, 0, 0],
    ['CEO', 'marketplace_analytics', 1, 0, 0, 0],
    ['CEO', 'user_statistics', 1, 0, 0, 0],
    ['CEO', 'operational_performance', 1, 0, 0, 0],
    ['CEO', 'strategic_reports', 1, 0, 0, 1],
    ['CEO', 'platform_settings', 1, 0, 1, 0],
    ['CEO', 'listings', 1, 0, 0, 0],
    ['CEO', 'payments', 1, 0, 0, 0],
    ['CEO', 'coins', 1, 0, 0, 0],
    ['CEO', 'subscriptions', 1, 0, 0, 0],
    ['CEO', 'brokers', 1, 0, 0, 0],
    ['CEO', 'ambassadors', 1, 0, 0, 0],
    ['CEO', 'suppliers', 1, 0, 0, 0],
    ['CEO', 'certificates', 1, 0, 0, 0],
    ['CEO', 'support', 1, 0, 0, 0],
    ['CEO', 'reports', 1, 0, 0, 0],
    ['CEO', 'cms', 1, 0, 1, 0],
    ['CEO', 'announcements', 1, 0, 1, 0],
    ['CEO', 'promo_codes', 1, 0, 1, 0],
    ['CEO', 'system_health', 1, 0, 0, 0],
    ['CEO', 'audit_logs', 1, 0, 0, 1],

    // CIO
    ['CIO', 'system_health', 1, 1, 0, 0],
    ['CIO', 'security_logs', 1, 1, 0, 0],
    ['CIO', 'audit_logs', 1, 0, 0, 1],
    ['CIO', 'technical_config', 1, 1, 0, 0],
    ['CIO', 'api_metrics', 1, 0, 0, 0],
    ['CIO', 'user_permissions', 1, 1, 0, 0],
    ['CIO', 'platform_settings', 1, 1, 0, 0],
    ['CIO', 'listings', 1, 0, 0, 0],
    ['CIO', 'payments', 1, 0, 0, 0],
    ['CIO', 'coins', 1, 0, 0, 0],
    ['CIO', 'subscriptions', 1, 0, 0, 0],
    ['CIO', 'brokers', 1, 0, 0, 0],
    ['CIO', 'ambassadors', 1, 0, 0, 0],
    ['CIO', 'suppliers', 1, 0, 0, 0],
    ['CIO', 'certificates', 1, 0, 0, 0],
    ['CIO', 'support', 1, 0, 0, 0],
    ['CIO', 'reports', 1, 0, 0, 1],

    // COO
    ['COO', 'listings', 1, 1, 0, 0],
    ['COO', 'auctions', 1, 1, 0, 0],
    ['COO', 'reports', 1, 1, 0, 0],
    ['COO', 'support', 1, 1, 0, 0],
    ['COO', 'brokers', 1, 1, 0, 0],
    ['COO', 'suppliers', 1, 1, 0, 0],
    ['COO', 'ambassadors', 1, 1, 0, 0],
    ['COO', 'certificates', 1, 1, 0, 0],
    ['COO', 'users', 1, 1, 0, 0],
    ['COO', 'payments', 1, 0, 0, 0],
    ['COO', 'platform_settings', 1, 0, 0, 0],
    ['COO', 'system_health', 1, 0, 0, 0],

    // CMO
    ['CMO', 'marketing_analytics', 1, 0, 0, 1],
    ['CMO', 'campaigns', 1, 1, 0, 0],
    ['CMO', 'promo_codes', 1, 1, 0, 0],
    ['CMO', 'announcements', 1, 1, 0, 0],
    ['CMO', 'cms', 1, 1, 0, 0],
    ['CMO', 'referrals', 1, 1, 0, 0],
    ['CMO', 'ambassadors', 1, 1, 0, 0],
    ['CMO', 'listings', 1, 0, 0, 0],
    ['CMO', 'payments', 1, 0, 0, 0],
    ['CMO', 'coins', 1, 0, 0, 0],
    ['CMO', 'subscriptions', 1, 0, 0, 0],
    ['CMO', 'system_health', 1, 0, 0, 0],

    // CFO
    ['CFO', 'revenue', 1, 1, 0, 1],
    ['CFO', 'coins', 1, 1, 0, 0],
    ['CFO', 'subscriptions', 1, 1, 0, 0],
    ['CFO', 'promo_codes', 1, 0, 1, 0],
    ['CFO', 'refunds', 1, 1, 0, 0],
    ['CFO', 'broker_commissions', 1, 1, 0, 0],
    ['CFO', 'donations', 1, 1, 0, 0],
    ['CFO', 'certificates', 1, 0, 0, 0],
    ['CFO', 'payments', 1, 1, 0, 0],
    ['CFO', 'system_health', 1, 0, 0, 0],
  ];

  for (const [roleName, module, canView, canManage, canApprove, canExport] of perms) {
    await pool.query(
      `INSERT INTO executive_permissions (role_id, module, can_view, can_manage, can_approve, can_export)
       SELECT er.id, ?, ?, ?, ?, ?
       FROM executive_roles er WHERE er.name = ?
       ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_manage = VALUES(can_manage),
         can_approve = VALUES(can_approve), can_export = VALUES(can_export)`,
      [module, canView, canManage, canApprove, canExport, roleName]
    );
  }
  console.log('executive_permissions seeded');

  console.log('Migration complete');
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Migration failed:', err.message);
  process.exit(1);
});
