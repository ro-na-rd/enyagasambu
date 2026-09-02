require('dotenv').config();
const pool = require('../config/db');
const DEFAULTS = require('../config/siteContentDefaults');
const { logger } = require('../config/logger');

async function run() {
  console.log('Migrating site_content table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INT AUTO_INCREMENT PRIMARY KEY,
      content_key VARCHAR(120) NOT NULL UNIQUE,
      section VARCHAR(50) NOT NULL DEFAULT 'general',
      label VARCHAR(200) NOT NULL,
      content LONGTEXT,
      status ENUM('published', 'draft') DEFAULT 'published',
      updated_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  const [[admin]] = await pool.query(
    "SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
  );
  const authorId = admin ? admin.id : null;

  for (const def of DEFAULTS) {
    const [existing] = await pool.query(
      'SELECT id FROM site_content WHERE content_key = ?',
      [def.content_key]
    );
    if (existing.length > 0) continue; // never overwrite existing/edited content
    await pool.query(
      `INSERT INTO site_content (content_key, section, label, content, status, updated_by)
       VALUES (?, ?, ?, ?, 'published', ?)`,
      [def.content_key, def.section, def.label, def.content, authorId]
    );
    console.log(`  [seeded] ${def.content_key}`);
  }

  console.log('Site content migration complete.');
  process.exit(0);
}

run().catch((err) => {
  logger.error('Migration failed:', err.message);
  process.exit(1);
});