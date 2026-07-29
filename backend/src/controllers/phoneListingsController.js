const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { sendSms } = require('../services/smsService');
const { uploadToS3 } = require('../services/s3Service');
const { requestToPay, getPaymentStatus } = require('../services/momoService');

const OTP_TTL_MINUTES = 10;
const TOKEN_EXPIRY = '1h';
const REPOST_COST = 400;

const repostPayments = new Map(); // referenceId -> { listingId, userId, phone }

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
}

function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

exports.requestAccess = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  const normalizedPhone = normalizePhone(phone);

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE u.phone = ? AND l.status != 'deleted'`,
      [normalizedPhone]
    );

    if (total === 0) {
      return res.status(404).json({ message: 'No listings found for this phone number' });
    }

    let [[user]] = await pool.query('SELECT id FROM users WHERE phone = ? LIMIT 1', [normalizedPhone]);
    let userId;
    if (!user) {
      const [result] = await pool.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [`Seller ${normalizedPhone.slice(-4)}`, normalizedPhone, crypto.randomBytes(32).toString('hex'), 'user']
      );
      userId = result.insertId;
    } else {
      userId = user.id;
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await pool.query(
      'INSERT INTO seller_otps (user_id, phone, code, expires_at) VALUES (?, ?, ?, ?)',
      [userId, normalizedPhone, code, expiresAt]
    );

    await sendSms(normalizedPhone, `Your NMO access code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);
    return res.json({ message: `OTP sent to ${normalizedPhone}` });
  } catch (err) {
    console.error('[Phone access request error]', err);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyAccess = async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ message: 'Phone and code are required' });

  const normalizedPhone = normalizePhone(phone);

  try {
    const [[otpRow]] = await pool.query(
      `SELECT o.id, u.id AS user_id
       FROM seller_otps o
       JOIN users u ON u.id = o.user_id
       WHERE o.phone = ? AND o.code = ? AND o.used = 0 AND o.expires_at > NOW()
       ORDER BY o.created_at DESC LIMIT 1`,
      [normalizedPhone, code]
    );

    if (!otpRow) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE seller_otps SET used = 1 WHERE id = ?', [otpRow.id]);

    const token = jwt.sign(
      { id: otpRow.user_id, phone: normalizedPhone, role: 'phone_seller' },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    const [listings] = await pool.query(
      `SELECT l.id, l.title, l.price, l.price_type, l.listing_type, l.status, l.expires_at, l.created_at,
              c.name AS category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.user_id = u.id
       WHERE u.phone = ? AND l.status != 'deleted'
       ORDER BY l.created_at DESC`,
      [normalizedPhone]
    );

    return res.json({ token, listings });
  } catch (err) {
    console.error('[Phone access verify error]', err);
    return res.status(500).json({ message: 'Verification failed' });
  }
};

exports.getListings = async (req, res) => {
  try {
    const [listings] = await pool.query(
      `SELECT l.id, l.title, l.description, l.price, l.price_type, l.listing_type, l.location,
              l.status, l.is_featured, l.expires_at, l.created_at,
              c.name AS category_name, c.id AS category_id,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.user_id = u.id
       WHERE u.phone = ? AND l.status != 'deleted'
       ORDER BY l.created_at DESC`,
      [req.user.phone]
    );
    return res.json({ listings });
  } catch (err) {
    console.error('[Phone listings list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[listing]] = await conn.query(
      `SELECT l.id, l.user_id FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ? AND u.phone = ? AND l.status != 'deleted'`,
      [id, req.user.phone]
    );
    if (!listing) {
      await conn.rollback();
      return res.status(404).json({ message: 'Listing not found' });
    }

    const { title, description, price, price_type, location, category_id } = req.body;
    await conn.query(
      'UPDATE listings SET title = ?, description = ?, price = ?, price_type = ?, location = ?, category_id = ? WHERE id = ?',
      [title, description || null, price || null, price_type || 'fixed', location || null, category_id, id]
    );

    if (req.files?.length) {
      await conn.query('DELETE FROM listing_images WHERE listing_id = ?', [id]);
      const imageValues = [];
      for (let i = 0; i < req.files.length; i++) {
        const { url } = await uploadToS3(req.files[i]);
        imageValues.push([id, url, i === 0]);
      }
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    }

    await conn.commit();
    return res.json({ message: 'Listing updated' });
  } catch (err) {
    await conn.rollback();
    console.error('[Phone listing update error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.deleteListing = async (req, res) => {
  const { id } = req.params;

  try {
    const [[listing]] = await pool.query(
      `SELECT l.id FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ? AND u.phone = ? AND l.status != 'deleted'`,
      [id, req.user.phone]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    await pool.query("UPDATE listings SET status = 'deleted' WHERE id = ?", [id]);
    return res.json({ message: 'Listing deleted' });
  } catch (err) {
    console.error('[Phone listing delete error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Step 1: Initiate MoMo payment for repost (400 RWF)
exports.repostListing = async (req, res) => {
  const { id } = req.params;
  let referenceId;

  try {
    const [[listing]] = await pool.query(
      `SELECT l.id FROM listings l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ? AND u.phone = ? AND l.status != 'deleted'`,
      [id, req.user.phone]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    referenceId = uuidv4();
    repostPayments.set(referenceId, { listingId: Number(id), userId: req.user.id, phone: req.user.phone });

    await requestToPay({
      referenceId,
      amount: REPOST_COST,
      payerPhone: req.user.phone,
      payerMessage: `NMO: Repost listing #${id} (${REPOST_COST} RWF)`,
      payeeNote: `Listing repost – #${id}`,
    });

    return res.json({
      message: `Payment request of ${REPOST_COST} RWF sent to ${req.user.phone}. Approve on your phone.`,
      referenceId,
    });
  } catch (err) {
    if (referenceId) repostPayments.delete(referenceId);
    console.error('[Repost initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to send payment request. Please try again.' });
  }
};

// Step 2: Poll payment status and extend listing if paid
exports.checkRepostPayment = async (req, res) => {
  const { referenceId } = req.params;

  const pending = repostPayments.get(referenceId);
  if (!pending) return res.status(404).json({ message: 'Repost payment not found or expired' });

  try {
    const momoStatus = await getPaymentStatus(referenceId);

    if (momoStatus.status === 'SUCCESSFUL') {
      const newExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await pool.query(
        "UPDATE listings SET status = 'active', expires_at = ? WHERE id = ?",
        [newExpiresAt, pending.listingId]
      );
      repostPayments.delete(referenceId);
      return res.json({ status: 'successful', message: 'Listing reposted', expires_at: newExpiresAt });
    }

    if (momoStatus.status === 'FAILED') {
      repostPayments.delete(referenceId);
      return res.json({ status: 'failed', message: 'Payment was declined or failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Repost check error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not check payment status.' });
  }
};
