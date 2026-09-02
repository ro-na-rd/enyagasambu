const pool = require('../config/db');
const { uploadToS3 } = require('../services/s3Service');
const { notifyAdmins, notifyUser } = require('../services/notificationService');
const { logger } = require('../config/logger');

const BROKER_LISTING_DAYS = 30;

function normalizePhone(phone) {
  return phone ? phone.replace(/\s+/g, '') : '';
}

function createRenewalToken(listingId, sellerPhone, expiresAt) {
  const crypto = require('crypto');
  const token = crypto.randomBytes(6).toString('hex').toUpperCase();
  const validFrom = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000);
  const tokenExpiresAt = new Date(validFrom.getTime() + 48 * 60 * 60 * 1000);
  return pool.query(
    'INSERT INTO renewal_tokens (listing_id, seller_phone, token, valid_from, expires_at) VALUES (?, ?, ?, ?, ?)',
    [listingId, sellerPhone, token, validFrom, tokenExpiresAt]
  );
}

exports.getListings = async (req, res) => {
  const { status } = req.query;
  try {
    const where = "l.user_id = ? AND l.status != 'deleted'";
    const params = [req.user.id];
    if (status && ['active', 'expired', 'sold', 'disabled'].includes(status)) {
      where += ' AND l.status = ?';
      params.push(status);
    }
    const [rows] = await pool.query(
      `SELECT l.id, l.title, l.price, l.price_type, l.currency, l.location, l.listing_type,
              l.status, l.client_name, l.views, l.created_at, l.expires_at,
              c.name AS category_name, c.slug AS category_slug, c.type AS category_type,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM listings l
       JOIN categories c ON l.category_id = c.id
       WHERE ${where}
       ORDER BY l.created_at DESC`,
      params
    );
    return res.json({ listings: rows });
  } catch (err) {
    logger.error('[Broker listings list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createListing = async (req, res) => {
  const {
    title, description, price, price_type, currency, location,
    listing_type, category_id, client_name,
  } = req.body || {};

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }
  if (!category_id || !Number.isInteger(parseInt(category_id, 10))) {
    return res.status(400).json({ message: 'Category is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const expiresAt = new Date(Date.now() + BROKER_LISTING_DAYS * 24 * 60 * 60 * 1000);

    const [result] = await conn.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, price_type, currency, location, listing_type, client_name, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        parseInt(category_id, 10),
        String(title).trim(),
        description ? String(description).trim() : null,
        price !== undefined && price !== '' && !isNaN(parseFloat(price)) ? parseFloat(price) : null,
        price_type || 'fixed',
        currency || 'RWF',
        location ? String(location).trim() : null,
        listing_type || 'sell',
        client_name ? String(client_name).trim() : null,
        expiresAt,
      ]
    );

    if (req.files?.length) {
      const imageValues = [];
      for (let i = 0; i < req.files.length; i++) {
        const { url } = await uploadToS3(req.files[i]);
        imageValues.push([result.insertId, url, i === 0]);
      }
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [imageValues]);
    }

    if (req.user.phone) {
      await createRenewalToken(result.insertId, normalizePhone(req.user.phone), expiresAt);
    }

    await conn.commit();

    const [[listing]] = await pool.query(
      `SELECT l.id, l.title, l.price, l.price_type, l.currency, l.location, l.listing_type,
              l.status, l.client_name, l.views, l.created_at, l.expires_at,
              c.name AS category_name, c.slug AS category_slug, c.type AS category_type
       FROM listings l JOIN categories c ON l.category_id = c.id
       WHERE l.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ message: 'Listing created', listing });
  } catch (err) {
    await conn.rollback();
    logger.error('[Broker listing create error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[listing]] = await conn.query(
      `SELECT id, user_id, title, status FROM listings WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    if (!listing) {
      await conn.rollback();
      return res.status(404).json({ message: 'Listing not found or not yours' });
    }

    if (listing.status === 'deleted') {
      await conn.rollback();
      return res.status(400).json({ message: 'Listing already deleted' });
    }

    // Move to recycle bin
    const restoreUntil = new Date();
    restoreUntil.setDate(restoreUntil.getDate() + 30);

    await conn.query('UPDATE listings SET status = ? WHERE id = ?', ['deleted', id]);

    await conn.query(
      `INSERT INTO recycle_bin (item_type, item_id, original_data, deleted_by, deleted_role, restore_until)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['listing', id, JSON.stringify(listing), req.user.id, req.user.role, restoreUntil]
    );

    await conn.commit();

    notifyAdmins('Broker listing moved to recycle bin', `Broker listing "${listing.title}" moved to recycle bin`, 'recycle', '/admin/recycle-bin');

    return res.json({ 
      message: 'Listing moved to recycle bin',
      restore_until: restoreUntil,
      auto_delete_after_days: 30
    });
  } catch (err) {
    await conn.rollback();
    logger.error('[Broker delete listing error]', err);
    return res.status(500).json({ message: 'Server error during deletion' });
  } finally {
    conn.release();
  }
};
