/* eslint-disable no-console */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

const connConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

const USAGE = [
  'Usage: node src/scripts/migrate.js [--status | --dry-run | --apply | --down <file>]',
  '  (default)         Show pending migrations',
  '  --status          Show all applied migrations',
  '  --dry-run         Show which migrations would run, in order',
  '  --apply           Apply all pending migrations',
  '  --down <file>     Apply the <file> migration in reverse (must define an "SQL_DOWN" section)',
  '',
].join('\n');

async function ensureTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checksum CHAR(64) NOT NULL
    ) ENGINE=InnoDB
  `);
}

function checksum(sql) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(sql).digest('hex');
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function splitDown(sql) {
  const marker = /--\s*@DOWN\s*\r?\n/i;
  const m = sql.match(marker);
  if (!m) return null;
  return sql.slice(m.index + m[0].length).replace(/\r?\n?--\s*@END_DOWN\s*$/i, '');
}

// Applying must ignore the rollback section: the server executes every
// statement in the file, so a trailing "DROP TABLE" would undo the migration.
function splitUp(sql) {
  const marker = /--\s*@DOWN\s*\r?\n/i;
  const m = sql.match(marker);
  if (!m) return sql;
  return sql.slice(0, m.index);
}

async function getApplied(conn) {
  const [rows] = await conn.query('SELECT filename, checksum FROM schema_migrations ORDER BY id');
  return new Map(rows.map((r) => [r.filename, r.checksum]));
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--status')
    ? 'status'
    : args.includes('--dry-run')
      ? 'dry-run'
      : args.includes('--apply')
        ? 'apply'
        : args.includes('--down')
          ? 'down'
          : 'default';

  const downFile = mode === 'down' ? args[args.indexOf('--down') + 1] : null;

  const conn = await mysql.createConnection(connConfig);
  try {
    await ensureTable(conn);

    if (mode === 'status') {
      const applied = await getApplied(conn);
      console.log(applied.size === 0 ? 'No migrations applied yet.' : 'Applied migrations:');
      for (const [f, c] of applied) console.log('  [applied] ' + f + '  (' + c.slice(0, 12) + ')');
      return;
    }

    const files = listMigrationFiles();
    const applied = await getApplied(conn);
    const pending = files.filter((f) => !applied.has(f));

    if (mode === 'default') {
      console.log(files.length + ' migration file(s) found, ' + pending.length + ' pending.');
      if (pending.length) pending.forEach((f) => console.log('  [pending] ' + f));
      return;
    }

    if (mode === 'down') {
      if (!downFile) throw new Error('--down requires a filename, e.g. --down add_broker_permissions.sql');
      const full = path.join(MIGRATIONS_DIR, downFile);
      const sql = fs.readFileSync(full, 'utf8');
      const down = splitDown(sql);
      if (!down) throw new Error('No "-- @DOWN" section found in ' + downFile);
      await conn.query(down);
      await conn.query('DELETE FROM schema_migrations WHERE filename = ?', [downFile]);
      console.log('[down] applied: ' + downFile);
      return;
    }

    // dry-run / apply
    if (pending.length === 0) {
      console.log('Database is up to date. Nothing to apply.');
      return;
    }
    for (const f of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
      const chk = checksum(sql);
      if (mode === 'dry-run') {
        console.log('  [would apply] ' + f + '  (' + chk.slice(0, 12) + ')');
        continue;
      }
      console.log('[apply] ' + f + ' ...');
      try {
        await conn.query(splitUp(sql));
      } catch (e) {
        if (!/already exists|Duplicate (column|key|foreign key)|ER_DUP_FIELDNAME|ER_DUP_KEYNAME/i.test(e.message + ' ' + (e.code||''))) throw e;
        console.warn('[apply] warn (already applied): ' + e.message.slice(0,120));
      }
      await conn.query('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [f, chk]);
      console.log('[apply] done: ' + f);
    }
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Migration error:', err.message);
    process.exit(1);
  });
}

module.exports = { splitDown, splitUp, checksum, listMigrationFiles, connConfig };