const pool = require('../config/db');
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

const CONNECT_COST = 300;
const OTP_TTL_MINUTES = 10;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSms(phone, code) {
  if (!sms) return;
  const message = `Your NMO verification code is: ${code}. Valid for ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
  await sms.send({
    to: [phone],
    message,
    from: process.env.AT_SENDER_ID || 'NMO',
  });
}

// ─── STEP 1: buyer submits their phone, we send OTP ──────────────────────────
exports.sendOtp = async (req, res) => {
  const { listing_id, phone } = req.body;
  if (!phone || !listing_id) return res.status(400).json({ message: 'phone and listing_id required' });

  try {
    const [[listing]] = await pool.query(
      "SELECT id, user_id, status FROM listings WHERE id = ? AND status = 'active'",
      [listing_id]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found or inactive' });
    if (listing.user_id === req.user.id) return res.status(400).json({ message: 'You cannot connect to your own listing' });

    // already unlocked? return early without charging
    const [[unlock]] = await pool.query(
      'SELECT id FROM contact_unlocks WHERE buyer_id = ? AND listing_id = ?',
      [req.user.id, listing_id]
    );
    if (unlock) {
      const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);
      return res.json({ alreadyUnlocked: true, sellerPhone: seller?.phone });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // invalidate previous unused codes for this user+listing
    await pool.query(
      'UPDATE otp_codes SET used = 1 WHERE user_id = ? AND listing_id = ? AND used = 0',
      [req.user.id, listing_id]
    );

    await pool.query(
      'INSERT INTO otp_codes (user_id, listing_id, phone, code, expires_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, listing_id, phone, code, expiresAt]
    );

    await sendSms(phone, code);

    return res.json({ message: `Verification code sent to ${phone}`, otpSent: true });
  } catch (err) {
    console.error('[OTP send error]', err);
    return res.status(500).json({ message: 'Failed to send OTP. Check your phone number and try again.' });
  }
};

// ─── STEP 2: buyer submits OTP code + pays 300 coins ─────────────────────────
exports.verifyOtp = async (req, res) => {
  const { listing_id, phone, code } = req.body;
  if (!code || !listing_id || !phone) return res.status(400).json({ message: 'code, phone, and listing_id required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[otp]] = await conn.query(
      `SELECT id FROM otp_codes
       WHERE user_id = ? AND listing_id = ? AND phone = ? AND code = ? AND used = 0 AND expires_at > NOW()`,
      [req.user.id, listing_id, phone, code]
    );
    if (!otp) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const [[user]] = await conn.query('SELECT coins FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (!user || user.coins < CONNECT_COST) {
      await conn.rollback();
      return res.status(402).json({ message: `Not enough coins. You need ${CONNECT_COST} coins to connect.` });
    }

    await conn.query('UPDATE otp_codes SET used = 1 WHERE id = ?', [otp.id]);
    await conn.query('UPDATE users SET coins = coins - ? WHERE id = ?', [CONNECT_COST, req.user.id]);
    await conn.query(
      'INSERT INTO contact_unlocks (buyer_id, listing_id, buyer_phone) VALUES (?, ?, ?)',
      [req.user.id, listing_id, phone]
    );
    await conn.query(
      'INSERT INTO coin_transactions (user_id, amount, type, listing_id) VALUES (?, ?, ?, ?)',
      [req.user.id, -CONNECT_COST, 'connect_fee', listing_id]
    );

    await conn.commit();

    const [[listing]] = await pool.query('SELECT user_id FROM listings WHERE id = ?', [listing_id]);
    const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);

    return res.json({ sellerPhone: seller?.phone });
  } catch (err) {
    await conn.rollback();
    console.error('[OTP verify error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
