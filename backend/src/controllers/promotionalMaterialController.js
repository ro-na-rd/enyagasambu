const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getMaterials = async (req, res) => {
  try {
    const { category, type } = req.query;
    let query = 'SELECT * FROM promotional_materials WHERE is_active = TRUE';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      query += ' AND file_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';
    const [materials] = await pool.query(query, params);
    return res.json({ materials });
  } catch (err) {
    logger.error('[Promotional materials error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[material]] = await pool.query(
      'SELECT * FROM promotional_materials WHERE id = ? AND is_active = TRUE',
      [id]
    );
    if (!material) return res.status(404).json({ message: 'Material not found' });
    return res.json({ material });
  } catch (err) {
    logger.error('[Promotional material error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.trackDownload = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE promotional_materials SET download_count = download_count + 1 WHERE id = ?',
      [id]
    );
    return res.json({ message: 'Download tracked' });
  } catch (err) {
    logger.error('[Track download error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM promotional_materials WHERE is_active = TRUE AND category IS NOT NULL'
    );
    return res.json({ categories: categories.map(c => c.category) });
  } catch (err) {
    logger.error('[Categories error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};