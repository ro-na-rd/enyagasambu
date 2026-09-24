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

function normalizeSmsPhone(phone) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) throw new Error('Phone number required for SMS');

  const defaultCountryCode = String(process.env.DEFAULT_PHONE_COUNTRY_CODE || '250').replace(/\D/g, '');
  if (!defaultCountryCode) throw new Error('DEFAULT_PHONE_COUNTRY_CODE must contain digits');

  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith(defaultCountryCode)) return `+${digits}`;
  if (digits.startsWith('0')) return `+${defaultCountryCode}${digits.slice(1)}`;
  return `+${digits}`;
}

async function sendSms(phone, message) {
  if (!sms) {
    logger.warn('[SMS] Service unavailable — SMS not sent to', phone);
    return;
  }
  const normalized = normalizeSmsPhone(phone);
  const result = await sms.send({
    to: [normalized],
    message,
    from: process.env.AT_SENDER_ID || 'NMO',
  });
  return result;
}

module.exports = { sendSms, normalizeSmsPhone };
