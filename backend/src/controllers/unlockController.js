const pool = require('../config/db');

const CONNECT_COST = 300;
const UNLOCK_MINUTES = 3;

exports.unlock = async (req, res) => {
  const { listing_id, phone } = req.body;
  if (!phone || !listing_id) return res.status(400).json({ message: 'phone and listing_id required' });

  try {
    const [[listing]] = await pool.query(
      "SELECT id, user_id, status FROM listings WHERE id = ? AND status = 'active'",
      [listing_id]
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found or inactive' });

    const phoneKey = phone.replace(/\s+/g, '');
    if (listing.user_id && req.user && req.user.id === listing.user_id) {
      return res.status(400).json({ message: 'You cannot unlock your own listing' });
    }

    const [[existing]] = await pool.query(
      'SELECT id, expires_at FROM contact_unlocks WHERE buyer_phone = ? AND listing_id = ? ORDER BY id DESC LIMIT 1',
      [phoneKey, listing_id]
    );
    if (existing) {
      const now = new Date();
      if (existing.expires_at && new Date(existing.expires_at) > now) {
        const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);
        return res.json({ sellerPhone: seller?.phone, expiresAt: existing.expires_at, alreadyUnlocked: true });
      }
    }

    const expiresAt = new Date(Date.now() + UNLOCK_MINUTES * 60 * 1000);

    if (req.user) {
      const [[user]] = await pool.query('SELECT coins FROM users WHERE id = ? FOR UPDATE', [req.user.id]);
      if (!user || user.coins < CONNECT_COST) {
        return res.status(402).json({ message: `Not enough coins. You need ${CONNECT_COST} coins to connect.` });
      }
      await pool.query('UPDATE users SET coins = coins - ? WHERE id = ?', [CONNECT_COST, req.user.id]);
      await pool.query(
        'INSERT INTO coin_transactions (user_id, amount, type, listing_id) VALUES (?, ?, ?, ?)',
        [req.user.id, -CONNECT_COST, 'connect_fee', listing_id]
      );
      await pool.query(
        'INSERT INTO contact_unlocks (buyer_id, listing_id, buyer_phone, expires_at) VALUES (?, ?, ?, ?)',
        [req.user.id, listing_id, phoneKey, expiresAt]
      );
    } else {
      await pool.query(
        'INSERT INTO contact_unlocks (buyer_id, listing_id, buyer_phone, expires_at) VALUES (NULL, ?, ?, ?)',
        [listing_id, phoneKey, expiresAt]
      );
    }

    const [[seller]] = await pool.query('SELECT phone FROM users WHERE id = ?', [listing.user_id]);

    return res.json({ sellerPhone: seller?.phone, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    console.error('[unlock error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
