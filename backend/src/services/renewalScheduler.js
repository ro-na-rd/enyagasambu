const pool = require('../config/db');
const { sendSms } = require('./smsService');

async function deliverRenewalTokens() {
  try {
    const [rows] = await pool.query(
      `SELECT rt.id AS token_id, rt.token, rt.seller_phone, l.id AS listing_id, l.title, l.expires_at
       FROM renewal_tokens rt
       JOIN listings l ON l.id = rt.listing_id
       WHERE rt.used = 0 AND rt.sent_at IS NULL
         AND l.expires_at BETWEEN DATE_ADD(NOW(), INTERVAL 23 HOUR) AND DATE_ADD(NOW(), INTERVAL 24 HOUR)`
    );

    for (const row of rows) {
      const message = `Your NMO listing "${row.title}" will expire soon. Use this renewal token: ${row.token}. It is valid until ${new Date(row.expires_at).toISOString()}.`;
      await sendSms(row.seller_phone, message);
      await pool.query('UPDATE renewal_tokens SET sent_at = NOW() WHERE id = ?', [row.token_id]);
    }
  } catch (err) {
    console.error('[Renewal scheduler error]', err);
  }
}

function startRenewalScheduler() {
  // Check every hour for listings that will expire in about 24h.
  setInterval(deliverRenewalTokens, 60 * 60 * 1000);
  deliverRenewalTokens().catch(() => {});
}

module.exports = { startRenewalScheduler };
