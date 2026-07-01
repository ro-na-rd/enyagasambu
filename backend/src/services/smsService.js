const AfricasTalking = require('africastalking');

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});
const sms = at.SMS;

async function sendSms(phone, message) {
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