const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
  for (const stmt of statements) {
    if (!stmt) continue;
    try { await pool.query(stmt); } catch (e) { if (!e.message.includes('already exists') && !e.code?.includes('ER_TABLE_EXISTS')) console.warn('[initDb] warn:', e.message.slice(0,120)); }
  }
}

async function init() {
  console.log('[initDb] checking schema...');
  const schemaPath = path.join(__dirname, '../config/schema.sql');
  if (fs.existsSync(schemaPath)) await runSqlFile(schemaPath);
  const migDir = path.join(__dirname, '../../migrations');
  if (fs.existsSync(migDir)) {
    for (const f of fs.readdirSync(migDir).filter(f=>f.endsWith('.sql')).sort()) {
      console.log('[initDb] migration', f);
      await runSqlFile(path.join(migDir,f));
    }
  }
  const [rows] = await pool.query("SHOW TABLES LIKE 'notifications'");
  if (rows.length===0) console.warn('[initDb] notifications table missing — run schema.sql');
  console.log('[initDb] done');
  await pool.end();
}

if (require.main===module) init().catch(e=>{console.error(e);process.exit(1)});
module.exports = { init };
