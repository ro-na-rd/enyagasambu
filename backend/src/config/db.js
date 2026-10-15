const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT, 10) || 10,
  queueLimit: 50,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

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
