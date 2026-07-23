const crypto = require('crypto');
const pool = require('../config/db');
const { sendSms } = require('../services/smsService');

const OTP_TTL_MINUTES = 5;

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateRenewalToken() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

async function createRenewalToken(conn, listingId, sellerPhone, expiresAt) {
  const validFrom = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000);
  const tokenExpiresAt = new Date(validFrom.getTime() + 48 * 60 * 60 * 1000);
  const token = generateRenewalToken();
  await conn.query(
    'INSERT INTO renewal_tokens (listing_id, seller_phone, token, valid_from, expires_at) VALUES (?, ?, ?, ?, ?)',
    [listingId, sellerPhone, token, validFrom, tokenExpiresAt]
  );
  return token;
}

exports.sendPaymentOtp = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query(
      "SELECT * FROM payments WHERE provider_ref = ? AND type = 'listing_token'",
      [referenceId]
    );
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status !== 'verified') {
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    const phone = normalizePhone(payment.phone);
    if (!phone) return res.status(400).json({ message: 'Phone number not found on payment' });

    await pool.query(
      'UPDATE payment_otps SET verified = 1 WHERE payment_id = ? AND verified = 0',
      [payment.id]
    );

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'INSERT INTO payment_otps (payment_id, phone, code, expires_at) VALUES (?, ?, ?, ?)',
      [payment.id, phone, code, expiresAt]
    );

    const message = `Your NMO verification code is: ${code}. This code expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
    await sendSms(phone, message);

    return res.json({ message: `Verification code sent to ${phone}` });
  } catch (err) {
    console.error('[Payment OTP send error]', err);
    return res.status(500).json({ message: 'Failed to send verification code' });
  }
};

exports.verifyPaymentOtp = async (req, res) => {
  const { referenceId, code } = req.body;
  if (!referenceId || !code) return res.status(400).json({ message: 'referenceId and code are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[payment]] = await conn.query(
      "SELECT * FROM payments WHERE provider_ref = ? AND type = 'listing_token'",
      [referenceId]
    );
    if (!payment) {
      await conn.rollback();
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (payment.status === 'confirmed') {
      await conn.rollback();
      return res.status(400).json({ message: 'This payment has already been used' });
    }

    if (payment.status !== 'verified') {
      await conn.rollback();
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    const [[otp]] = await conn.query(
      `SELECT id FROM payment_otps
       WHERE payment_id = ? AND code = ? AND verified = 0 AND expires_at > NOW()`,
      [payment.id, code]
    );

    if (!otp) {
      const [[expiredOtp]] = await conn.query(
        'SELECT id FROM payment_otps WHERE payment_id = ? AND code = ? AND verified = 0',
        [payment.id, code]
      );
      await conn.rollback();
      if (expiredOtp) {
        return res.status(400).json({ message: 'Verification code expired. Request a new code.' });
      }
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await conn.query('UPDATE payment_otps SET verified = 1 WHERE id = ?', [otp.id]);

    const payload = payment.payload ? JSON.parse(payment.payload) : {};

    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
      const guestName = payload.guest_name || 'Guest';
      const guestPhone = normalizePhone(payload.guest_phone || '');
      if (!guestPhone) {
        await conn.rollback();
        return res.status(400).json({ message: 'Guest phone is required' });
      }
      const [result] = await conn.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [guestName, guestPhone, crypto.randomBytes(32).toString('hex'), 'user']
      );
      userId = result.insertId;
    }

    const durationDays = payload.duration_days || 3;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const [listingResult] = await conn.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, price_type, location, listing_type, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, payload.category_id, payload.title, payload.description, payload.price, payload.price_type, payload.location, payload.listing_type, expiresAt]
    );

    if (payload.images?.length) {
      const imageValues = payload.images.map((imageUrl, i) => [listingResult.insertId, imageUrl, i === 0]);
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    }

    await conn.query('UPDATE payments SET status = ?, listing_id = ? WHERE id = ?', ['confirmed', listingResult.insertId, payment.id]);

    const sellerPhone = req.user ? normalizePhone(req.user.phone) : normalizePhone(payload.guest_phone || '');
    if (sellerPhone) {
      await createRenewalToken(conn, listingResult.insertId, sellerPhone, expiresAt);
    }

    await conn.commit();

    if (sellerPhone) {
      sendSms(sellerPhone, 'Your post has been published successfully. Thank you for using our platform.').catch(() => {});
    }

    return res.json({ listingId: listingResult.insertId, message: 'Post published successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('[Payment OTP verify error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.resendPaymentOtp = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query(
      "SELECT * FROM payments WHERE provider_ref = ? AND type = 'listing_token'",
      [referenceId]
    );
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status !== 'verified') {
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    const phone = normalizePhone(payment.phone);
    if (!phone) return res.status(400).json({ message: 'Phone number not found' });

    await pool.query(
      'UPDATE payment_otps SET verified = 1 WHERE payment_id = ? AND verified = 0',
      [payment.id]
    );

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'INSERT INTO payment_otps (payment_id, phone, code, expires_at) VALUES (?, ?, ?, ?)',
      [payment.id, phone, code, expiresAt]
    );

    const message = `Your NMO verification code is: ${code}. This code expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
    await sendSms(phone, message);

    return res.json({ message: `New verification code sent to ${phone}` });
  } catch (err) {
    console.error('[Payment OTP resend error]', err);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};
