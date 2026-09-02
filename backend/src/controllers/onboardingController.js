const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getMaterials = async (req, res) => {
  try {
    const { type, category } = req.query;
    let query = 'SELECT * FROM onboarding_materials WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND material_type = ?';
      params.push(type);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY order_index ASC, created_at DESC';
    const [materials] = await pool.query(query, params);
    return res.json({ materials });
  } catch (err) {
    logger.error('[Onboarding materials error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[material]] = await pool.query('SELECT * FROM onboarding_materials WHERE id = ?', [id]);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    return res.json({ material });
  } catch (err) {
    logger.error('[Onboarding material error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM onboarding_materials WHERE category IS NOT NULL'
    );
    return res.json({ categories: categories.map(c => c.category) });
  } catch (err) {
    logger.error('[Onboarding categories error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRequiredMaterials = async (req, res) => {
  try {
    const [materials] = await pool.query(
      'SELECT * FROM onboarding_materials WHERE is_required = TRUE ORDER BY order_index ASC'
    );
    return res.json({ materials });
  } catch (err) {
    logger.error('[Required onboarding materials error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const [[{ totalRequired }]] = await pool.query(
      'SELECT COUNT(*) AS totalRequired FROM onboarding_materials WHERE is_required = TRUE'
    );
    const [[{ totalMaterials }]] = await pool.query(
      'SELECT COUNT(*) AS totalMaterials FROM onboarding_materials'
    );

    return res.json({
      progress: {
        totalRequired: totalRequired || 0,
        totalMaterials: totalMaterials || 0,
        completionPercentage: 0, // This would need tracking of completed materials
      }
    });
  } catch (err) {
    logger.error('[Onboarding progress error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};