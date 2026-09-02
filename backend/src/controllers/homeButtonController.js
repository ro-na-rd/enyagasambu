const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, label, href, sort_order
       FROM home_buttons
       WHERE active = 1
       ORDER BY sort_order, id`
    );
    res.json({ buttons: rows });
  } catch (err) {
    logger.error('[HomeButtons] getPublic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT hb.id, hb.label, hb.href, hb.sort_order, hb.active, hb.updated_at,
              u.username AS updated_by_name
       FROM home_buttons hb
       LEFT JOIN staff u ON u.id = hb.updated_by
       ORDER BY hb.sort_order, hb.id`
    );
    res.json({ buttons: rows });
  } catch (err) {
    logger.error('[HomeButtons] getAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { label, href, sort_order } = req.body;
  if (!label || !String(label).trim()) {
    return res.status(400).json({ message: 'Label is required' });
  }
  if (!href || !String(href).trim()) {
    return res.status(400).json({ message: 'Link is required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO home_buttons (label, href, sort_order, updated_by)
       VALUES (?, ?, ?, ?)`,
      [String(label).trim(), String(href).trim(), parseInt(sort_order) || 0, req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM home_buttons WHERE id = ?', [result.insertId]);
    res.status(201).json({ button: row });
  } catch (err) {
    logger.error('[HomeButtons] create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { label, href, sort_order, active } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id FROM home_buttons WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await pool.query(
      `UPDATE home_buttons SET
         label = COALESCE(?, label),
         href = COALESCE(?, href),
         sort_order = COALESCE(?, sort_order),
         active = COALESCE(?, active),
         updated_by = ?
       WHERE id = ?`,
      [
        label ? String(label).trim() : null,
        href ? String(href).trim() : null,
        sort_order !== undefined ? parseInt(sort_order) : null,
        active !== undefined ? (active === 'false' || active === false ? 0 : 1) : null,
        req.user.id,
        req.params.id,
      ]
    );

    const [[row]] = await pool.query('SELECT * FROM home_buttons WHERE id = ?', [req.params.id]);
    res.json({ button: row });
  } catch (err) {
    logger.error('[HomeButtons] update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM home_buttons WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query('DELETE FROM home_buttons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Button deleted' });
  } catch (err) {
    logger.error('[HomeButtons] remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};