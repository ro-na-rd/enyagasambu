const pool = require('../config/db');
const { sendSms } = require('./smsService');
const { sendEmail } = require('./emailService');
const { notifyUser } = require('./notificationService');
const { classifyReminderTier, buildReminderMessages } = require('./reminderPolicy');
const { logger } = require('../config/logger');

const FLAG_COLUMNS = { 6: 'reminder_6h_sent_at', 2: 'reminder_2h_sent_at' };
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

async function safeSend(label, fn) {
  try {
    await fn();
  } catch (err) {
    logger.error(`[Expiry reminders] ${label} failed`, err.message);
  }
}

async function sendExpiryReminders() {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.expires_at, l.reminder_6h_sent_at, l.reminder_2h_sent_at,
              u.id AS owner_id, u.phone, u.email
       FROM listings l
       JOIN users u ON u.id = l.user_id
       WHERE l.status = 'active'
         AND l.expires_at IS NOT NULL
         AND l.expires_at > NOW()
         AND l.expires_at < DATE_ADD(NOW(), INTERVAL 8 HOUR)
         AND (l.reminder_6h_sent_at IS NULL OR l.reminder_2h_sent_at IS NULL)`
    );

    for (const row of rows) {
      const hoursLeft = (new Date(row.expires_at).getTime() - Date.now()) / 3600000;
      const tier = classifyReminderTier({
        hoursLeft,
        reminder6hSent: !!row.reminder_6h_sent_at,
        reminder2hSent: !!row.reminder_2h_sent_at,
      });
      if (!tier) continue;

      const { sms, subject, message, html } = buildReminderMessages(row.title, row.expires_at, tier);
      if (row.phone) await safeSend('sms', () => sendSms(row.phone, sms));
      if (row.email) await safeSend('email', () => sendEmail(row.email, subject, html));
      await notifyUser(row.owner_id, 'Listing expiring soon', message, 'warning', `/listings/${row.id}`);

      await pool.query(`UPDATE listings SET ${FLAG_COLUMNS[tier]} = NOW() WHERE id = ?`, [row.id]);
    }
  } catch (err) {
    logger.error('[Expiry reminders error]', err);
  }
}

function startReminderScheduler() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await sendExpiryReminders();
    } finally {
      running = false;
    }
  };
  setInterval(tick, CHECK_INTERVAL_MS);
  tick().catch(() => {});
}

module.exports = { startReminderScheduler, sendExpiryReminders };
