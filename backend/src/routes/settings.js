const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/db');
const { logger } = require('../config/logger');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return res.json({ settings });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', authenticate, async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'settings object required' });
  }
  const isAdmin = req.user?.role === 'admin';
  const isCEO = req.user?.executive_role === 'CEO';
  if (!isAdmin && !isCEO) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  if (isCEO && !isAdmin) {
    const allowedKeys = ['allow_buy_coins'];
    const offending = Object.keys(settings).filter((k) => !allowedKeys.includes(k));
    if (offending.length) {
      return res.status(403).json({ message: 'CEO may only update the buy-coins setting' });
    }
  }
  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM platform_settings');
    const result = {};
    rows.forEach(r => { result[r.setting_key] = r.setting_value; });
    return res.json({ settings: result, message: 'Settings saved' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
