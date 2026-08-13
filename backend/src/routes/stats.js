const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [[{ activeListings }]] = await pool.query(
      "SELECT COUNT(*) AS activeListings FROM listings WHERE status = 'active' AND expires_at > NOW() AND listing_type != 'auction'"
    );
    const [[{ categories }]] = await pool.query('SELECT COUNT(*) AS categories FROM categories');
    const [[{ sellers }]] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) AS sellers FROM listings WHERE status != ?',
      ['deleted']
    );
    const [[{ productImages }]] = await pool.query(
      'SELECT COUNT(*) AS productImages FROM listing_images'
    );
    const [byType] = await pool.query(
      `SELECT c.type AS type, COUNT(*) AS cnt
       FROM listings l
       JOIN categories c ON c.id = l.category_id
       WHERE l.status = 'active' AND l.expires_at > NOW() AND l.listing_type != 'auction'
       GROUP BY c.type`
    );
    const typeCounts = {};
    (byType || []).forEach((r) => { typeCounts[r.type] = Number(r.cnt); });

    return res.json({
      stats: {
        products: typeCounts.product || 0,
        properties: typeCounts.rental_property || 0,
        vehicles: typeCounts.rental_vehicle || 0,
        suppliers: sellers || 0,
        activeListings,
        categories,
        sellers,
        productImages,
      },
    });
  } catch (err) {
    console.error('[Stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
