const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const pool = require('../config/db');
const { requestToPay, getPaymentStatus } = require('../services/momoService');
const { sendSms } = require('../services/smsService');

const LISTING_COST = 400;
const CONNECT_COST = 300;
const LISTING_DAYS = 3;
const BOOST_COST = 200;

const LISTING_PRICE = {
  3: 500,
  7: 1000,
  30: 3500,
};

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
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

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type, name');
    return res.json({ categories: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getListings = async (req, res) => {
  const { category, type, group, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = "l.status = 'active' AND l.expires_at > NOW()";
  const params = [];

  if (category) {
    where += ' AND c.slug = ?';
    params.push(category);
  }
  if (type) {
    where += ' AND l.listing_type = ?';
    params.push(type);
  }
  if (group) {
    where += ' AND c.type = ?';
    params.push(group);
  }
  if (search) {
    where += ' AND (l.title LIKE ? OR l.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.price, l.price_type, l.location, l.listing_type,
              l.is_featured, l.created_at, l.expires_at,
              c.name AS category_name, c.slug AS category_slug, c.type AS category_type,
              u.name AS seller_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.user_id = u.id
       WHERE ${where}
       ORDER BY l.is_featured DESC, l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l JOIN categories c ON l.category_id = c.id WHERE ${where}`,
      params
    );

    return res.json({ listings: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getListing = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const [[listing]] = await pool.query(
      `SELECT l.*, c.name AS category_name, c.slug AS category_slug, c.type AS category_type,
              u.name AS seller_name, u.id AS seller_id
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ? AND l.status != 'deleted'`,
      [id]
    );

    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const [images] = await pool.query(
      'SELECT id, image_url, is_primary FROM listing_images WHERE listing_id = ?',
      [id]
    );

    let contactUnlocked = false;
    let sellerPhone = null;

    if (userId) {
      if (userId === listing.seller_id) {
        const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [userId]);
        sellerPhone = seller?.phone;
        contactUnlocked = true;
      } else {
        const [[unlock]] = await pool.query(
          'SELECT id FROM contact_unlocks WHERE buyer_id = ? AND listing_id = ?',
          [userId, id]
        );
        if (unlock) {
          const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.seller_id]);
          sellerPhone = seller?.phone;
          contactUnlocked = true;
        }
      }
    }

    return res.json({
      listing: { ...listing, images, contactUnlocked, sellerPhone },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createListing = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let userId;
    let isAdmin = false;
    let postingFree = false;
    let postingFee = LISTING_COST;
    let user = null;
    let isGuest = false;

    if (req.user) {
      userId = req.user.id;
      isAdmin = req.user.role === 'admin';
      [[user]] = await conn.query('SELECT coins, phone FROM users WHERE id = ? FOR UPDATE', [userId]);
    } else {
      const { guest_name, guest_phone } = req.body;
      if (!guest_name || !guest_phone) {
        await conn.rollback();
        return res.status(400).json({ message: 'Name and phone are required when not signed in.' });
      }
      isGuest = true;
      const [result] = await conn.query(
        'INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)',
        [guest_name, guest_phone, crypto.randomBytes(32).toString('hex'), 'user']
      );
      userId = result.insertId;
    }

    if (!isGuest && !isAdmin) {
      const [settingRows] = await conn.query("SELECT setting_key, setting_value FROM platform_settings WHERE setting_key IN ('posting_free','posting_fee')");
      const s = {};
      if (settingRows) settingRows.forEach(r => { s[r.setting_key] = r.setting_value; });
      postingFree = s.posting_free === 'true';
      postingFee = parseInt(s.posting_fee, 10) || LISTING_COST;

      if (!postingFree) {
        if (!user || user.coins < postingFee) {
          await conn.rollback();
          return res.status(402).json({ message: `Insufficient coins. You need ${postingFee} coins to list.` });
        }
        await conn.query('UPDATE users SET coins = coins - ? WHERE id = ?', [postingFee, userId]);
      }
    }

    let durationDays = LISTING_DAYS;
    if (!isGuest) {
      const [[sub]] = await conn.query('SELECT * FROM seller_subscriptions WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())', [userId]);
      if (sub) durationDays = sub.listing_duration_days;
    }

    const { title, description, price, price_type, location, listing_type, category_id } = req.body;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const [result] = await conn.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, price_type, location, listing_type, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, category_id, title, description, price || null, price_type || 'fixed', location, listing_type || 'sell', expiresAt]
    );

    if (!isGuest && !isAdmin && !postingFree) {
      await conn.query(
        'INSERT INTO coin_transactions (user_id, amount, type, listing_id) VALUES (?, ?, ?, ?)',
        [userId, -postingFee, 'listing_fee', result.insertId]
      );
    }

    if (req.files?.length) {
      const imageValues = req.files.map((f, i) => [result.insertId, `/uploads/${f.filename}`, i === 0]);
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    }

    const sellerPhone = user ? normalizePhone(user.phone) : normalizePhone(req.body.guest_phone || '');
    if (sellerPhone && !isGuest) {
      await createRenewalToken(conn, result.insertId, sellerPhone, expiresAt);
    }

    await conn.commit();
    return res.status(201).json({ message: 'Listing created', listingId: result.insertId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.initiateListingPayment = async (req, res) => {
  const { title, description, price, price_type, location, listing_type, category_id, duration_days = 3, provider = 'mtn' } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

  const duration = [3, 7, 30].includes(parseInt(duration_days)) ? parseInt(duration_days) : 3;
  const amount = LISTING_PRICE[duration];

  let sellerPhone;
  let guestName = '';
  let guestPhone = '';

  if (req.user) {
    sellerPhone = normalizePhone(req.user.phone || req.body.phone || '');
  } else {
    guestName = req.body.guest_name || '';
    guestPhone = normalizePhone(req.body.guest_phone || req.body.phone || '');
    sellerPhone = guestPhone;
  }

  if (!sellerPhone) return res.status(400).json({ message: 'Seller phone is required for payment' });

  const images = req.files?.map((f) => `/uploads/${f.filename}`) || [];
  const payload = {
    title,
    description,
    price: price || null,
    price_type: price_type || 'fixed',
    location,
    listing_type: listing_type || 'sell',
    category_id,
    duration_days: duration,
    images,
    guest_name: guestName,
    guest_phone: guestPhone,
  };

  const referenceId = uuidv4();
  try {
    await pool.query(
      'INSERT INTO payments (type, phone, provider, amount_rwf, status, provider_ref, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['listing_token', sellerPhone, provider, amount, 'pending', referenceId, JSON.stringify(payload)]
    );

    await requestToPay({
      referenceId,
      amount,
      payerPhone: sellerPhone,
      payerMessage: `NMO listing payment for ${duration} days`,
      payeeNote: 'Nyagasambu Market Online listing token',
    });

    return res.json({ referenceId, amount_rwf: amount });
  } catch (err) {
    console.error('[Listing payment initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to initiate listing payment' });
  }
};

exports.confirmListingPayment = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query('SELECT * FROM payments WHERE provider_ref = ? AND type = ?', [referenceId, 'listing_token']);
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status === 'confirmed') {
      return res.json({ message: 'Listing already activated' });
    }

    const momoStatus = await getPaymentStatus(referenceId);
    if (momoStatus.status === 'SUCCESSFUL') {
      const payload = payment.payload ? JSON.parse(payment.payload) : {};
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

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

        const expiresAt = new Date(Date.now() + payload.duration_days * 24 * 60 * 60 * 1000);
        const [result] = await conn.query(
          `INSERT INTO listings (user_id, category_id, title, description, price, price_type, location, listing_type, expires_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, payload.category_id, payload.title, payload.description, payload.price, payload.price_type, payload.location, payload.listing_type, expiresAt]
        );

        if (payload.images?.length) {
          const imageValues = payload.images.map((imageUrl, i) => [result.insertId, imageUrl, i === 0]);
          await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
        }

        await conn.query('UPDATE payments SET status = ?, listing_id = ? WHERE id = ?', ['confirmed', result.insertId, payment.id]);
        const sellerPhone = req.user ? normalizePhone(req.user.phone) : normalizePhone(payload.guest_phone || '');
        if (sellerPhone) {
          await createRenewalToken(conn, result.insertId, sellerPhone, expiresAt);
        }
        await conn.commit();
        return res.json({ message: 'Listing activated', listingId: result.insertId });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['failed', payment.id]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Listing payment confirm error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not verify payment status' });
  }
};

exports.initiateRenewal = async (req, res) => {
  const { seller_phone, renewal_token, days = 3, provider = 'mtn' } = req.body;
  if (!seller_phone || !renewal_token) return res.status(400).json({ message: 'seller_phone and renewal_token are required' });

  try {
    const normalizedPhone = normalizePhone(seller_phone);
    const [[tokenRow]] = await pool.query(
      `SELECT rt.id, rt.listing_id, l.title
       FROM renewal_tokens rt
       JOIN listings l ON l.id = rt.listing_id
       WHERE rt.seller_phone = ? AND rt.token = ? AND rt.used = 0 AND rt.valid_from <= NOW() AND rt.expires_at >= NOW()`,
      [normalizedPhone, renewal_token]
    );
    if (!tokenRow) return res.status(400).json({ message: 'Invalid or expired renewal token' });

    const renewDays = [3, 7, 30].includes(parseInt(days)) ? parseInt(days) : 3;
    const amount = LISTING_PRICE[renewDays];
    const referenceId = uuidv4();

    await pool.query(
      'INSERT INTO payments (type, phone, provider, amount_rwf, status, provider_ref, listing_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['listing_renewal', normalizedPhone, provider, amount, 'pending', referenceId, tokenRow.listing_id, JSON.stringify({ renewal_days: renewDays, renewal_token_id: tokenRow.id })]
    );

    await requestToPay({
      referenceId,
      amount,
      payerPhone: normalizedPhone,
      payerMessage: `NMO renewal fee for listing ${tokenRow.title}`,
      payeeNote: 'Nyagasambu Market Online listing renewal',
    });

    return res.json({ referenceId, amount_rwf: amount });
  } catch (err) {
    console.error('[Renewal initiate error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Failed to initiate renewal payment' });
  }
};

exports.confirmRenewal = async (req, res) => {
  const { referenceId } = req.body;
  if (!referenceId) return res.status(400).json({ message: 'referenceId is required' });

  try {
    const [[payment]] = await pool.query('SELECT * FROM payments WHERE provider_ref = ? AND type = ?', [referenceId, 'listing_renewal']);
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    if (payment.status === 'confirmed') {
      return res.json({ message: 'Renewal already confirmed' });
    }

    const momoStatus = await getPaymentStatus(referenceId);
    if (momoStatus.status === 'SUCCESSFUL') {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query('UPDATE payments SET status = ? WHERE id = ?', ['confirmed', payment.id]);
        const payload = payment.payload ? JSON.parse(payment.payload) : {};
        const renewalDays = payload?.renewal_days || 3;

        const [[listing]] = await conn.query('SELECT expires_at FROM listings WHERE id = ? FOR UPDATE', [payment.listing_id]);
        if (!listing) {
          await conn.rollback();
          return res.status(404).json({ message: 'Listing not found' });
        }

        const currentExpires = listing.expires_at && new Date(listing.expires_at) > new Date() ? new Date(listing.expires_at) : new Date();
        const newExpires = new Date(currentExpires.getTime() + renewalDays * 24 * 60 * 60 * 1000);
        await conn.query('UPDATE listings SET expires_at = ? WHERE id = ?', [newExpires, payment.listing_id]);

        const renewalTokenId = payload?.renewal_token_id;
        if (renewalTokenId) {
          await conn.query('UPDATE renewal_tokens SET used = 1 WHERE id = ?', [renewalTokenId]);
        }

        await conn.commit();
        return res.json({ message: 'Listing renewed', expires_at: newExpires });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    if (momoStatus.status === 'FAILED') {
      await pool.query('UPDATE payments SET status = ? WHERE id = ?', ['failed', payment.id]);
      return res.json({ status: 'failed', message: momoStatus.reason || 'Payment failed.' });
    }

    return res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Renewal confirm error]', err?.response?.data || err.message);
    return res.status(502).json({ message: 'Could not verify payment status' });
  }
};

exports.sendRenewalToken = async (req, res) => {
  const { seller_phone } = req.body;
  const { id } = req.params;
  if (!seller_phone) return res.status(400).json({ message: 'seller_phone is required' });

  const normalizedPhone = normalizePhone(seller_phone);
  try {
    const [[tokenRow]] = await pool.query(
      `SELECT rt.id, rt.token, rt.expires_at, l.title
       FROM renewal_tokens rt
       JOIN listings l ON l.id = rt.listing_id
       WHERE rt.listing_id = ? AND rt.seller_phone = ? AND rt.used = 0 AND rt.valid_from <= NOW() AND rt.expires_at >= NOW()`,
      [id, normalizedPhone]
    );
    if (!tokenRow) return res.status(400).json({ message: 'No active renewal token available' });

    const message = `Your NMO renewal token for listing "${tokenRow.title}" is ${tokenRow.token}. It expires at ${new Date(tokenRow.expires_at).toISOString()}.`;
    await sendSms(normalizedPhone, message);
    await pool.query('UPDATE renewal_tokens SET sent_at = NOW() WHERE id = ?', [tokenRow.id]);
    return res.json({ message: 'Renewal token sent' });
  } catch (err) {
    console.error('[Send renewal token error]', err);
    return res.status(500).json({ message: 'Could not send renewal token' });
  }
};

exports.unlockContact = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[listing]] = await conn.query(
      "SELECT id, user_id, status FROM listings WHERE id = ? AND status = 'active'",
      [id]
    );
    if (!listing) {
      await conn.rollback();
      return res.status(404).json({ message: 'Listing not found or inactive' });
    }
    if (listing.user_id === req.user.id) {
      await conn.rollback();
      return res.status(400).json({ message: 'You cannot connect to your own listing' });
    }

    const [[existing]] = await conn.query(
      'SELECT id FROM contact_unlocks WHERE buyer_id = ? AND listing_id = ?',
      [req.user.id, id]
    );
    if (existing) {
      await conn.rollback();
      const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);
      return res.json({ alreadyUnlocked: true, sellerPhone: seller?.phone });
    }

    const [[user]] = await conn.query('SELECT coins FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (!user || user.coins < CONNECT_COST) {
      await conn.rollback();
      return res.status(402).json({ message: `Insufficient coins. You need ${CONNECT_COST} coins to connect.` });
    }

    await conn.query('UPDATE users SET coins = coins - ? WHERE id = ?', [CONNECT_COST, req.user.id]);
    await conn.query(
      'INSERT INTO contact_unlocks (buyer_id, listing_id) VALUES (?, ?)',
      [req.user.id, id]
    );
    await conn.query(
      'INSERT INTO coin_transactions (user_id, amount, type, listing_id) VALUES (?, ?, ?, ?)',
      [req.user.id, -CONNECT_COST, 'connect_fee', id]
    );

    await conn.commit();

    const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);
    return res.json({ sellerPhone: seller?.phone });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.myListings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, c.name AS category_name,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l JOIN categories c ON l.category_id = c.id
       WHERE l.user_id = ? AND l.status != 'deleted'
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    return res.json({ listings: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.boostListing = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[listing]] = await conn.query(
      "SELECT id, user_id, status FROM listings WHERE id = ? AND status = 'active'",
      [id]
    );
    if (!listing) { await conn.rollback(); return res.status(404).json({ message: 'Listing not found' }); }
    if (listing.user_id !== req.user.id) { await conn.rollback(); return res.status(403).json({ message: 'Not your listing' }); }

    const [[user]] = await conn.query('SELECT coins FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
    if (!user || user.coins < BOOST_COST) {
      await conn.rollback();
      return res.status(402).json({ message: `You need ${BOOST_COST} coins to boost this listing.` });
    }

    const featuredUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await conn.query('UPDATE users SET coins = coins - ? WHERE id = ?', [BOOST_COST, req.user.id]);
    await conn.query('UPDATE listings SET is_featured = 1, featured_until = ? WHERE id = ?', [featuredUntil, id]);
    await conn.query(
      "INSERT INTO coin_transactions (user_id, amount, type, listing_id) VALUES (?, ?, 'boost_fee', ?)",
      [req.user.id, -BOOST_COST, id]
    );

    await conn.commit();
    return res.json({ message: 'Listing boosted for 7 days', featuredUntil });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};
