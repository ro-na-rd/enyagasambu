const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const activeListings = `FROM listings l
      JOIN categories c ON c.id = l.category_id
      WHERE l.status = 'active' AND l.expires_at > NOW() AND c.type = ?`;

    const [[{ products }]] = await pool.query(
      `SELECT COUNT(*) AS products ${activeListings}`, ['product']
    );
    const [[{ properties }]] = await pool.query(
      `SELECT COUNT(*) AS properties ${activeListings}`, ['rental_property']
    );
    const [[{ vehicles }]] = await pool.query(
      `SELECT COUNT(*) AS vehicles ${activeListings}`, ['rental_vehicle']
    );
    const [[{ suppliers }]] = await pool.query(
      "SELECT COUNT(*) AS suppliers FROM users WHERE role = 'supplier'"
    );

    return res.json({ stats: { products, properties, vehicles, suppliers } });
  } catch (err) {
    console.error('[Stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
