const pool = require('../config/db');
const { logger } = require('../config/logger');

async function expireListings() {
  try {
    const [result] = await pool.query(
      `UPDATE listings SET status = 'expired'
       WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= NOW()`
    );
    if (result.affectedRows > 0) {
      logger.info(`[Expiry scheduler] Expired ${result.affectedRows} listing(s)`);
    }
  } catch (err) {
    logger.error('[Expiry scheduler error]', err);
  }
}

function startExpiryScheduler() {
  expireListings().catch(() => {});
  setInterval(expireListings, 60 * 60 * 1000);
}

module.exports = { startExpiryScheduler };
