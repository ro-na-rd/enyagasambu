'use strict';

// Shared helper for tests that need a real MySQL database.
// Returns a promise resolving to a mysql2 connection when the DB is reachable,
// otherwise resolves to null so tests can skip cleanly (e.g. in CI without DB).

const mysql = require('mysql2/promise');

async function getDb() {
  if (process.env.TEST_SKIP_DB === '1') return null;
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 2000,
    });
    await conn.query('SELECT 1');
    return conn;
  } catch {
    return null;
  }
}

module.exports = { getDb };