const pool = require('../config/db');
const { logger } = require('../config/logger');

// Provider collection requests that remain pending beyond this window are no
// longer actionable by the buyer. Marking them failed gives the UI a stable
// retry state and prevents an unbounded pending-payment backlog.
const PENDING_TIMEOUT_MINUTES = 10;

async function reconcilePendingPayments() {
  try {
    const [result] = await pool.query(
      `UPDATE payments
       SET status = 'failed'
       WHERE status = 'pending'
         AND created_at < DATE_SUB(NOW(), INTERVAL ${PENDING_TIMEOUT_MINUTES} MINUTE)`
    );
    if (result.affectedRows > 0) {
      logger.info(`[Payment reconciliation] Marked ${result.affectedRows} stale payment(s) as failed`);
    }
  } catch (err) {
    logger.error('[Payment reconciliation error]', err);
  }
}

function startPaymentReconciliationScheduler() {
  reconcilePendingPayments().catch(() => {});
  setInterval(reconcilePendingPayments, 10 * 60 * 1000);
}

module.exports = { reconcilePendingPayments, startPaymentReconciliationScheduler };
