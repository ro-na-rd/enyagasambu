const pool = require('../config/db');

exports.requireRegistrationOpen = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT setting_value FROM platform_settings WHERE setting_key = ? LIMIT 1',
      ['allow_registration']
    );
    if (rows.length > 0 && rows[0].setting_value === 'false') {
      return res.status(403).json({ message: 'Registration is currently closed' });
    }
    next();
  } catch (err) {
    next(err);
  }
};