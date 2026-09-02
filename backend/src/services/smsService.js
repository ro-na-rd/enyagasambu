const AfricasTalking = require('africastalking');
const { logger } = require('../config/logger');

let at, sms;
try {
  at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  sms = at.SMS;
  logger.info('[SMS] Africa\'s Talking SMS service initialized');
} catch (err) {
  logger.warn('[SMS] Africa\'s Talking initialization failed:', err.message);
  sms = null;
}

async function sendSms(phone, message) {
  if (!sms) {
    logger.warn('[SMS] Service unavailable — SMS not sent to', phone);
    return;
  }
  if (!phone) throw new Error('Phone number required for SMS');
  const normalized = phone.replace(/\s+/g, '');
  const result = await sms.send({
    to: [normalized],
    message,
    from: process.env.AT_SENDER_ID || 'NMO',
  });
  return result;
}

module.exports = { sendSms };
