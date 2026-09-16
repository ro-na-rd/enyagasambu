const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.listPublicPartners = async (req, res) => {
  try {
    const [partners] = await pool.query(
      `SELECT id, name, logo_url, website_url
       FROM partners
       WHERE active = 1
       ORDER BY sort_order, id`
    );
    return res.json({ partners });
  } catch (err) {
    logger.error('[Partners] public list error:', err);
    return res.status(500).json({ message: 'Could not load partners' });
  }
};
