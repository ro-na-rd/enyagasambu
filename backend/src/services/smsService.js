const AfricasTalking = require('africastalking');

let at, sms;
try {
  at = AfricasTalking({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  sms = at.SMS;
} catch {
  sms = null;
}

async function sendSms(phone, message) {
  if (!sms) return;
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