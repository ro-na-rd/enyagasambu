const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getRecruitments = async (req, res) => {
  try {
    const [recruitments] = await pool.query(
      `SELECT r.*,
              u.name AS recruited_name, u.email AS recruited_email, u.role AS recruited_role
       FROM ambassador_recruitments r
       LEFT JOIN users u ON u.id = r.recruited_user_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ recruitments });
  } catch (err) {
    logger.error('[Ambassador recruitments error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createRecruitment = async (req, res) => {
  const { name, email, phone, type, notes } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: 'Name and type are required' });
  }
  if (!['supplier', 'vendor', 'user'].includes(type)) {
    return res.status(400).json({ message: 'Type must be supplier, vendor, or user' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO ambassador_recruitments (user_id, name, email, phone, type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, email || null, phone || null, type, notes || null]
    );
    const [[recruitment]] = await pool.query('SELECT * FROM ambassador_recruitments WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: 'Recruitment recorded', recruitment });
  } catch (err) {
    logger.error('[Ambassador create recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRecruitment = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  try {
    const [[rec]] = await pool.query(
      'SELECT id FROM ambassador_recruitments WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!rec) return res.status(404).json({ message: 'Recruitment not found' });

    const updates = [];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (updates.length === 0) return res.status(400).json({ message: 'No updates provided' });

    values.push(id);
    await pool.query(`UPDATE ambassador_recruitments SET ${updates.join(', ')} WHERE id = ?`, values);

    const [[updated]] = await pool.query('SELECT * FROM ambassador_recruitments WHERE id = ?', [id]);
    return res.json({ message: 'Updated', recruitment: updated });
  } catch (err) {
    logger.error('[Ambassador update recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecruitmentStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ambassador_recruitments WHERE user_id = ?`,
      [req.user.id]
    );
    const [[{ suppliers }]] = await pool.query(
      `SELECT COUNT(*) AS suppliers FROM ambassador_recruitments WHERE user_id = ? AND type = 'supplier'`,
      [req.user.id]
    );
    const [[{ vendors }]] = await pool.query(
      `SELECT COUNT(*) AS vendors FROM ambassador_recruitments WHERE user_id = ? AND type = 'vendor'`,
      [req.user.id]
    );
    const [[{ onboarded }]] = await pool.query(
      `SELECT COUNT(*) AS onboarded FROM ambassador_recruitments WHERE user_id = ? AND status = 'onboarded'`,
      [req.user.id]
    );
    const [[{ pending }]] = await pool.query(
      `SELECT COUNT(*) AS pending FROM ambassador_recruitments WHERE user_id = ? AND status = 'pending'`,
      [req.user.id]
    );
    return res.json({ total, suppliers, vendors, onboarded, pending });
  } catch (err) {
    logger.error('[Ambassador recruitment stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRecruitment = async (req, res) => {
  const { id } = req.params;
  try {
    const [[rec]] = await pool.query(
      'SELECT id FROM ambassador_recruitments WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!rec) return res.status(404).json({ message: 'Recruitment not found' });
    await pool.query('DELETE FROM ambassador_recruitments WHERE id = ?', [id]);
    return res.json({ message: 'Deleted' });
  } catch (err) {
    logger.error('[Ambassador delete recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
