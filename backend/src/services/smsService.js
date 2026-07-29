const AfricasTalking = require('africastalking');

const SIMULATION_MODE = process.env.PAYMENT_SIMULATION === 'true';

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
  // In simulation mode, log the message instead of sending SMS
  if (SIMULATION_MODE) {
    console.log(`[SIMULATION SMS] To: ${phone}`);
    console.log(`[SIMULATION SMS] Message: ${message}`);
    return { status: 'simulated' };
  }

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