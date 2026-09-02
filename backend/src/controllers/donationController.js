const { randomUUID: uuidv4 } = require('crypto');
const crypto = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { sendSms } = require('../services/smsService');
const { logger } = require('../config/logger');

const MIN_DONATION = 100;
const OTP_TTL_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 3;

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
}

function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Public summary + recent confirmed donations for the donate page
exports.getPublicStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query(
      "SELECT COALESCE(SUM(amount_rwf), 0) AS total FROM donations WHERE status = 'confirmed'"
    );
    const [[{ count }]] = await pool.query(
      "SELECT COUNT(*) AS count FROM donations WHERE status = 'confirmed'"
    );
    const [recent] = await pool.query(
      `SELECT donor_name, amount_rwf, method, message, created_at
       FROM donations
       WHERE status = 'confirmed'
       ORDER BY created_at DESC
       LIMIT 10`
    );
    return res.json({ totalRaised: total, donorCount: count, recent });
  } catch (err) {
    logger.error('[Donations public stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// STEP 1: Initiate MoMo donation
exports.initiateMomo = async (req, res) => {
  const { donor_name, donor_phone, amount, provider = 'mtn', message } = req.body;

  if (!donor_name || !donor_name.trim()) {
    return res.status(400).json({ message: 'Your name is required' });
  }
  const amountRwf = parseInt(amount);
  if (!amountRwf || isNaN(amountRwf) || amountRwf < MIN_DONATION) {
    return res.status(400).json({ message: `Minimum donation is ${MIN_DONATION} RWF` });
  }
  const phone = normalizePhone(donor_phone);
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required for Mobile Money' });
  }

  const referenceId = uuidv4();
  const userId = req.user?.id || null;

  try {
    await pool.query(
      `INSERT INTO donations (user_id, donor_name, donor_email, donor_phone, amount_rwf, method, provider, status, reference_id, message)
       VALUES (?, ?, ?, ?, ?, 'momo', ?, 'pending', ?, ?)`,
      [userId, donor_name.trim(), req.body.donor_email || null, phone, amountRwf, provider, referenceId, message || null]
    );

    await requestToPay({
      referenceId,
      amount: amountRwf,
      payerPhone: phone,
      payerMessage: `E-Nyagasambu donation of ${amountRwf} RWF`,
      payeeNote: 'E-Nyagasambu Market Online donation',
    });

    return res.json({ referenceId, amount_rwf: amountRwf, message: `A payment request of ${amountRwf} RWF has been sent to ${phone}. Please approve it on your phone.` });
  } catch (err) {
    logger.error('[Donation MoMo initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to send payment request. Please try again.' });
  }
};

// STEP 2: Poll payment status (frontend calls this every few seconds)
exports.checkPayment = async (req, res) => {
  const { referenceId } = req.params;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[donation]] = await pool.query(
      'SELECT * FROM donations WHERE reference_id = ?',
      [referenceId]
    );
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (donation.status === 'confirmed') {
      return res.json({ status: 'confirmed', donationId: donation.id, message: 'Thank you for your donation!' });
    }
    if (donation.status === 'failed') {
      return res.json({ status: 'failed', message: 'Payment was declined or failed.' });
    }
    if (donation.status === 'verified') {
      return res.json({ status: 'verified', message: 'Payment successful. Enter the code sent to your phone.' });
    }

    // Still pending — check with MoMo provider
    const momoStatus = await getPaymentStatus(referenceId);

    if (momoStatus.status === 'SUCCESSFUL') {
      const code = generateOtpCode();
      const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await pool.query(
        'UPDATE donations SET status = ?, otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE reference_id = ?',
        ['verified', code, otpExpires, referenceId]
      );

      const message = `Your E-Nyagasambu donation of ${donation.amount_rwf} RWF was received. Verification code: ${code}. Expires in ${OTP_TTL_MINUTES} minutes.`;
      await sendSms(donation.donor_phone, message);

      return res.json({ status: 'verified', message: `Payment successful! A verification code has been sent to ${donation.donor_phone}.` });
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE donations SET status = ? WHERE reference_id = ?', ['failed', referenceId]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    logger.error('[Donation check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not check payment status.' });
  }
};

// STEP 3: Verify OTP and confirm donation
exports.verifyOtp = async (req, res) => {
  const { referenceId, code } = req.body;
  if (!referenceId || !code) return res.status(400).json({ message: 'referenceId and code are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[donation]] = await conn.query(
      'SELECT * FROM donations WHERE reference_id = ?',
      [referenceId]
    );
    if (!donation) {
      await conn.rollback();
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status === 'confirmed') {
      await conn.rollback();
      return res.json({ donationId: donation.id, message: 'Donation already confirmed' });
    }

    if (donation.status !== 'verified') {
      await conn.rollback();
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    if (donation.otp_attempts >= MAX_OTP_ATTEMPTS) {
      await conn.rollback();
      return res.status(429).json({ message: 'Too many incorrect attempts. Request a new code.', locked: true });
    }

    if (!donation.otp_code || donation.otp_code !== code) {
      await conn.query('UPDATE donations SET otp_attempts = otp_attempts + 1 WHERE id = ?', [donation.id]);
      await conn.rollback();
      const remaining = MAX_OTP_ATTEMPTS - (donation.otp_attempts + 1);
      return res.status(400).json({ message: remaining > 0 ? `Invalid verification code. ${remaining} attempt(s) remaining.` : 'Invalid verification code. Too many attempts.' });
    }

    if (donation.otp_expires_at && new Date(donation.otp_expires_at) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ message: 'Verification code expired. Request a new code.' });
    }

    await conn.query(
      "UPDATE donations SET status = 'confirmed' WHERE reference_id = ?",
      [referenceId]
    );

    await conn.commit();
    return res.json({ donationId: donation.id, message: 'Thank you for your donation!' });
  } catch (err) {
    await conn.rollback();
    logger.error('[Donation OTP verify error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

// STEP 4: Resend OTP
exports.resendOtp = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[donation]] = await pool.query(
      'SELECT * FROM donations WHERE reference_id = ?',
      [referenceId]
    );
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'verified') {
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    const code = generateOtpCode();
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'UPDATE donations SET otp_code = ?, otp_expires_at = ?, otp_attempts = 0 WHERE reference_id = ?',
      [code, otpExpires, referenceId]
    );

    const message = `Your new E-Nyagasambu verification code is: ${code}. Expires in ${OTP_TTL_MINUTES} minutes.`;
    await sendSms(donation.donor_phone, message);

    return res.json({ message: `New verification code sent to ${donation.donor_phone}` });
  } catch (err) {
    logger.error('[Donation resend error]', err);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};

// Card donation (simulated for now — real gateway integration can be swapped in later)
exports.processCard = async (req, res) => {
  const { donor_name, donor_phone, donor_email, amount, card_number, card_name, card_expiry, card_cvv, message } = req.body;

  if (!donor_name || !donor_name.trim()) {
    return res.status(400).json({ message: 'Your name is required' });
  }
  const amountRwf = parseInt(amount);
  if (!amountRwf || isNaN(amountRwf) || amountRwf < MIN_DONATION) {
    return res.status(400).json({ message: `Minimum donation is ${MIN_DONATION} RWF` });
  }
  if (!card_number || String(card_number).replace(/\s+/g, '').length < 12) {
    return res.status(400).json({ message: 'A valid card number is required' });
  }
  if (!card_expiry || !card_cvv) {
    return res.status(400).json({ message: 'Card expiry and CVV are required' });
  }

  const userId = req.user?.id || null;
  const cleanCard = String(card_number).replace(/\s+/g, '');
  const last4 = cleanCard.slice(-4);
  const brand = cleanCard.startsWith('4') ? 'visa' : cleanCard.startsWith('5') ? 'mastercard' : 'card';

  try {
    // Simulate gateway authorization
    await new Promise((r) => setTimeout(r, 800));

    const [result] = await pool.query(
      `INSERT INTO donations (user_id, donor_name, donor_email, donor_phone, amount_rwf, method, provider, status, card_last4, card_brand, message)
       VALUES (?, ?, ?, ?, ?, 'card', 'bank', 'confirmed', ?, ?, ?)`,
      [userId, donor_name.trim(), donor_email || null, normalizePhone(donor_phone), amountRwf, last4, brand, message || null]
    );

    return res.json({ donationId: result.insertId, message: 'Donation successful. Thank you for your support!' });
  } catch (err) {
    logger.error('[Donation card error]', err);
    return res.status(500).json({ message: 'Failed to process card donation' });
  }
};
