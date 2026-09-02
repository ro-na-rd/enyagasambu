const pool = require('../config/db');
const { logger } = require('../config/logger');

const SELECT = 'id, code, name, description, category, price_rwf, duration_years, active, created_at, updated_at';

exports.getPublicTypes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT} FROM certificate_types WHERE active = 1 ORDER BY category, price_rwf`
    );
    return res.json({ types: rows });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listTypes = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${SELECT} FROM certificate_types ORDER BY category, price_rwf`);
    return res.json({ types: rows });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createType = async (req, res) => {
  const { code, name, description, category, price_rwf, duration_years, active } = req.body;

  if (!code || !name) return res.status(400).json({ message: 'Code and name are required' });
  if (!category) return res.status(400).json({ message: 'Category is required' });

  const price = Number(price_rwf);
  if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Valid price is required' });

  const years = Number(duration_years) || 1;

  try {
    const [result] = await pool.query(
      `INSERT INTO certificate_types (code, name, description, category, price_rwf, duration_years, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [String(code).toUpperCase(), name, description || null, category, price, years, active === false ? 0 : 1]
    );

    const [[type]] = await pool.query(`SELECT ${SELECT} FROM certificate_types WHERE id = ?`, [result.insertId]);
    return res.status(201).json({ message: 'Certificate type created', type });
  } catch (err) {
    logger.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Certificate type code already exists' });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateType = async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price_rwf, duration_years, active, code } = req.body;

  try {
    const [[existing]] = await pool.query('SELECT id FROM certificate_types WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Certificate type not found' });

    const price = Number(price_rwf);
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Valid price is required' });

    await pool.query(
      `UPDATE certificate_types
       SET code = ?, name = ?, description = ?, category = ?, price_rwf = ?, duration_years = ?, active = ?
       WHERE id = ?`,
      [
        String(code || '').toUpperCase(),
        name,
        description || null,
        category,
        price,
        Number(duration_years) || 1,
        active === false ? 0 : 1,
        id,
      ]
    );

    const [[type]] = await pool.query(`SELECT ${SELECT} FROM certificate_types WHERE id = ?`, [id]);
    return res.json({ message: 'Certificate type updated', type });
  } catch (err) {
    logger.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Certificate type code already exists' });
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteType = async (req, res) => {
  const { id } = req.params;

  try {
    const [refs] = await pool.query(
      'SELECT COUNT(*) AS total FROM broker_certificates WHERE certificate_type_id = ?',
      [id]
    );
    const [ambRefs] = await pool.query(
      'SELECT COUNT(*) AS total FROM ambassador_certificates WHERE certificate_type_id = ?',
      [id]
    );
    const [supRefs] = await pool.query(
      'SELECT COUNT(*) AS total FROM supplier_certificates WHERE certificate_type_id = ?',
      [id]
    );

    if (refs[0].total > 0 || ambRefs[0].total > 0 || supRefs[0].total > 0) {
      await pool.query('UPDATE certificate_types SET active = 0 WHERE id = ?', [id]);
      return res.json({ message: 'Certificate type deactivated (still referenced by existing certificates)' });
    }

    const [result] = await pool.query('DELETE FROM certificate_types WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Certificate type not found' });

    return res.json({ message: 'Certificate type deleted' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
