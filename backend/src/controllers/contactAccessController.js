const { randomUUID: uuidv4 } = require('crypto');
const crypto = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { sendSms } = require('../services/smsService');

const ACCESS_FEE = 300;
const OTP_TTL_MINUTES = 5;

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
}

function generateOtpCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// STEP 1: Initiate MoMo payment for contact access
exports.initiatePayment = async (req, res) => {
  const { listingId, phone } = req.body;
  if (!listingId || !phone) {
    return res.status(400).json({ message: 'listingId and phone are required' });
  }

  const phoneKey = normalizePhone(phone);

  try {
    const [[listing]] = await pool.query(
      "SELECT id, user_id, status FROM listings WHERE id = ? AND status = 'active'",
      [listingId]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found or inactive' });

    if (req.user && listing.user_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot unlock your own listing' });
    }

    // Check if already unlocked and not expired
    const [[existing]] = await pool.query(
      `SELECT id, otp_verified FROM contact_access_payments
       WHERE listing_id = ? AND buyer_phone = ? AND status = 'confirmed'
       ORDER BY id DESC LIMIT 1`,
      [listingId, phoneKey]
    );
    if (existing) {
      const [[seller]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [listing.user_id]);
      return res.json({
        alreadyUnlocked: true,
        sellerPhone: seller?.phone,
        sellerName: seller?.name,
        message: 'Contact already unlocked for this listing',
      });
    }

    // Check for an existing pending payment that hasn't expired (5 min window)
    const [[pending]] = await pool.query(
      `SELECT id, reference_id, status, created_at FROM contact_access_payments
       WHERE listing_id = ? AND buyer_phone = ? AND status IN ('pending', 'verified')
       AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)
       ORDER BY id DESC LIMIT 1`,
      [listingId, phoneKey]
    );
    if (pending && pending.status === 'verified') {
      return res.json({ referenceId: pending.reference_id, status: 'verified', message: 'Payment already verified. Enter OTP.' });
    }
    if (pending && pending.status === 'pending') {
      return res.json({ referenceId: pending.reference_id, status: 'pending', message: 'Payment already initiated. Check your phone.' });
    }

    const referenceId = uuidv4();
    const buyerId = req.user?.id || null;

    await pool.query(
      'INSERT INTO contact_access_payments (listing_id, buyer_id, buyer_phone, reference_id, amount_rwf) VALUES (?, ?, ?, ?, ?)',
      [listingId, buyerId, phoneKey, referenceId, ACCESS_FEE]
    );

    await requestToPay({
      referenceId,
      amount: ACCESS_FEE,
      payerPhone: phoneKey,
      payerMessage: `NMO: Unlock seller contact for listing #${listingId} (${ACCESS_FEE} RWF)`,
      payeeNote: `Contact access – listing ${listingId}`,
    });

    return res.json({
      message: `A payment request of ${ACCESS_FEE} RWF has been sent to ${phoneKey}. Please approve the payment on your phone.`,
      referenceId,
      status: 'pending',
    });
  } catch (err) {
    console.error('[Contact access initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to send payment request. Please try again.' });
  }
};

// STEP 2: Poll payment status (frontend calls this every 5 seconds)
exports.checkPayment = async (req, res) => {
  const { referenceId } = req.params;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query(
      'SELECT * FROM contact_access_payments WHERE reference_id = ?',
      [referenceId]
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Already confirmed
    if (payment.status === 'confirmed') {
      const [[listing]] = await pool.query('SELECT user_id FROM listings WHERE id = ?', [payment.listing_id]);
      const [[seller]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [listing?.user_id]);
      return res.json({ status: 'confirmed', sellerPhone: seller?.phone, sellerName: seller?.name });
    }

    // Already verified (OTP sent, waiting for verification)
    if (payment.status === 'verified') {
      return res.json({ status: 'verified', message: 'Payment verified. Enter OTP.' });
    }

    // Failed
    if (payment.status === 'failed') {
      return res.json({ status: 'failed', message: 'Payment was declined or failed.' });
    }

    // Still pending — check with MTN
    const momoStatus = await getPaymentStatus(referenceId);

    if (momoStatus.status === 'SUCCESSFUL') {
      // Payment successful — generate and send OTP
      const code = generateOtpCode();
      const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await pool.query(
        'UPDATE contact_access_payments SET status = ?, otp_code = ?, otp_expires_at = ? WHERE reference_id = ?',
        ['verified', code, otpExpires, referenceId]
      );

      const message = `Your NMO verification code is: ${code}. This code expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
      await sendSms(payment.buyer_phone, message);

      return res.json({ status: 'verified', message: `Payment successful! A verification code has been sent to ${payment.buyer_phone}.` });
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE contact_access_payments SET status = ? WHERE reference_id = ?', ['failed', referenceId]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    // Still pending
    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Contact access check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not check payment status.' });
  }
};

// STEP 3: Verify OTP and unlock contact
exports.verifyOtp = async (req, res) => {
  const { referenceId, code } = req.body;
  if (!referenceId || !code) return res.status(400).json({ message: 'referenceId and code are required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[payment]] = await conn.query(
      'SELECT * FROM contact_access_payments WHERE reference_id = ?',
      [referenceId]
    );
    if (!payment) {
      await conn.rollback();
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status === 'confirmed') {
      await conn.rollback();
      const [[listing]] = await pool.query('SELECT user_id FROM listings WHERE id = ?', [payment.listing_id]);
      const [[seller]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [listing?.user_id]);
      return res.json({ sellerPhone: seller?.phone, sellerName: seller?.name, message: 'Contact already unlocked' });
    }

    if (payment.status !== 'verified') {
      await conn.rollback();
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    if (!payment.otp_code || payment.otp_code !== code) {
      await conn.rollback();
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (payment.otp_expires_at && new Date(payment.otp_expires_at) < new Date()) {
      await conn.rollback();
      return res.status(400).json({ message: 'Verification code expired. Request a new code.' });
    }

    // OTP valid — mark confirmed and create/update contact_unlocks record
    await conn.query(
      'UPDATE contact_access_payments SET status = ?, otp_verified = TRUE WHERE reference_id = ?',
      ['confirmed', referenceId]
    );

    // Upsert into contact_unlocks (permanent record, no expiry for MoMo unlocks)
    const buyerId = payment.buyer_id;
    if (buyerId) {
      await conn.query(
        `INSERT INTO contact_unlocks (buyer_id, listing_id, buyer_phone, expires_at)
         VALUES (?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE expires_at = NULL`,
        [buyerId, payment.listing_id, payment.buyer_phone]
      );
    } else {
      // Guest — just record in contact_unlocks without buyer_id
      await conn.query(
        'INSERT INTO contact_unlocks (buyer_id, listing_id, buyer_phone, expires_at) VALUES (NULL, ?, ?, NULL)',
        [payment.listing_id, payment.buyer_phone]
      );
    }

    await conn.commit();

    const [[listing]] = await pool.query('SELECT user_id FROM listings WHERE id = ?', [payment.listing_id]);
    const [[seller]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [listing?.user_id]);

    return res.json({
      sellerPhone: seller?.phone,
      sellerName: seller?.name,
      message: 'Contact unlocked successfully',
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Contact access verify error]', err);
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
    const [[payment]] = await pool.query(
      'SELECT * FROM contact_access_payments WHERE reference_id = ?',
      [referenceId]
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status !== 'verified') {
      return res.status(400).json({ message: 'Payment has not been verified yet' });
    }

    const code = generateOtpCode();
    const otpExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'UPDATE contact_access_payments SET otp_code = ?, otp_expires_at = ? WHERE reference_id = ?',
      [code, otpExpires, referenceId]
    );

    const message = `Your NMO verification code is: ${code}. This code expires in ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`;
    await sendSms(payment.buyer_phone, message);

    return res.json({ message: `New verification code sent to ${payment.buyer_phone}` });
  } catch (err) {
    console.error('[Contact access resend error]', err);
    return res.status(500).json({ message: 'Failed to resend verification code' });
  }
};

// Check if a listing's contact is already unlocked for a phone/user
exports.getContact = async (req, res) => {
  const { listingId } = req.params;
  if (!listingId) return res.status(400).json({ message: 'listingId is required' });

  try {
    const [[listing]] = await pool.query(
      'SELECT id, user_id FROM listings WHERE id = ?',
      [listingId]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    // Check if already unlocked via contact_access_payments
    let unlocked = false;
    if (req.user) {
      const [[existing]] = await pool.query(
        "SELECT id FROM contact_access_payments WHERE listing_id = ? AND buyer_id = ? AND status = 'confirmed'",
        [listingId, req.user.id]
      );
      unlocked = !!existing;
    }
    // Also check contact_unlocks (covers legacy unlocks too)
    if (!unlocked) {
      const [[legacy]] = await pool.query(
        'SELECT id FROM contact_unlocks WHERE listing_id = ?',
        [listingId]
      );
      unlocked = !!legacy;
    }

    if (!unlocked) return res.json({ unlocked: false });

    const [[seller]] = await pool.query('SELECT phone, name FROM users WHERE id = ?', [listing.user_id]);
    return res.json({
      unlocked: true,
      sellerPhone: seller?.phone,
      sellerName: seller?.name,
    });
  } catch (err) {
    console.error('[Contact access get error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
