const pool = require('../config/db');
const { logger } = require('../config/logger');
const { normalizeEmail, toSource } = require('../utils/newsletterValidation');

exports.subscribe = async (req, res) => {
  const normalized = normalizeEmail(req.body && req.body.email);
  if (!normalized) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  const source = toSource(req.body && req.body.source);
  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, source, status)
       VALUES (?, ?, 'subscribed')
       ON DUPLICATE KEY UPDATE status = 'subscribed', source = VALUES(source)`,
      [normalized, source]
    );
    return res.status(201).json({ message: 'Subscribed' });
  } catch (err) {
    logger.error('[Newsletter] subscribe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.unsubscribe = async (req, res) => {
  const normalized = normalizeEmail(req.body && req.body.email);
  if (!normalized) {
    return res.status(400).json({ message: 'A valid email is required' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE newsletter_subscribers SET status = ? WHERE email = ?',
      ['unsubscribed', normalized]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Unsubscribed' });
  } catch (err) {
    logger.error('[Newsletter] unsubscribe error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, source, status, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC'
    );
    res.json(rows);
  } catch (err) {
    logger.error('[Newsletter] getAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query('DELETE FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    logger.error('[Newsletter] remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
