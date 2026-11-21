const mysql = require('mysql2/promise');
const { logger } = require('./logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  // Tunable via DB_POOL_LIMIT (default 20, higher than the old 10 to absorb
  // concurrent traffic without exhausting connections).
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 20,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 100,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Log slow queries in production so operators can spot workload hotspots.
  ...(process.env.NODE_ENV === 'production' && process.env.LOG_SLOW_QUERIES === 'true'
    ? {
        // mysql2 does not have a built-in slow-query hook; we wrap query() below.
      }
    : {}),
});

const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS, 10) || 1000;
const logSlowQueries = process.env.NODE_ENV === 'production' && process.env.LOG_SLOW_QUERIES === 'true';

// Wrap pool.query to log slow queries and connection-acquisition waits.
const originalQuery = pool.query.bind(pool);
pool.query = function query(sql, values) {
  const start = Date.now();
  return originalQuery(sql, values).then((result) => {
    const duration = Date.now() - start;
    if (logSlowQueries && duration > SLOW_QUERY_MS) {
      const safeSql = String(sql).slice(0, 500);
      logger.warn('[Slow query]', {
        durationMs: duration,
        sql: safeSql,
        values: values !== undefined ? (Array.isArray(values) ? values.length : 'object') : 0,
      });
    }
    return result;
  });
};

async function checkDatabase() {
  const maxRetries = 5;
  const retryDelay = 2000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await pool.getConnection();
      try {
        await connection.query('SELECT 1');
        return; // Success
      } finally {
        connection.release();
      }
    } catch (err) {
      logger.warn(`[DB] Connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
      } else {
        throw err; // Rethrow after final attempt
      }
    }
  }
}

module.exports = pool;
module.exports.checkDatabase = checkDatabase;
