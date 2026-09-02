const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getRecruitments = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM supplier_recruitments WHERE ambassador_id = ?';
    const params = [req.user.id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY recruited_at DESC';
    const [recruitments] = await pool.query(query, params);
    return res.json({ recruitments });
  } catch (err) {
    logger.error('[Supplier recruitments error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecruitmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [[recruitment]] = await pool.query(
      'SELECT * FROM supplier_recruitments WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!recruitment) return res.status(404).json({ message: 'Recruitment not found' });
    return res.json({ recruitment });
  } catch (err) {
    logger.error('[Supplier recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createRecruitment = async (req, res) => {
  try {
    const { supplier_name, supplier_email, supplier_phone, business_type, notes } = req.body;
    
    if (!supplier_name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO supplier_recruitments (ambassador_id, supplier_name, supplier_email, supplier_phone, business_type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, supplier_name, supplier_email, supplier_phone, business_type, notes]
    );

    const [[recruitment]] = await pool.query('SELECT * FROM supplier_recruitments WHERE id = ?', [result.insertId]);
    return res.status(201).json({ recruitment });
  } catch (err) {
    logger.error('[Create supplier recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRecruitment = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_name, supplier_email, supplier_phone, business_type, status, notes } = req.body;

    const [[existing]] = await pool.query(
      'SELECT * FROM supplier_recruitments WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ message: 'Recruitment not found' });

    await pool.query(
      `UPDATE supplier_recruitments 
       SET supplier_name = COALESCE(?, supplier_name), supplier_email = COALESCE(?, supplier_email),
           supplier_phone = COALESCE(?, supplier_phone), business_type = COALESCE(?, business_type),
           status = COALESCE(?, status), notes = COALESCE(?, notes)
       WHERE id = ? AND ambassador_id = ?`,
      [supplier_name, supplier_email, supplier_phone, business_type, status, notes, id, req.user.id]
    );

    const [[recruitment]] = await pool.query('SELECT * FROM supplier_recruitments WHERE id = ?', [id]);
    return res.json({ recruitment });
  } catch (err) {
    logger.error('[Update supplier recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRecruitment = async (req, res) => {
  try {
    const { id } = req.params;
    const [[existing]] = await pool.query(
      'SELECT * FROM supplier_recruitments WHERE id = ? AND ambassador_id = ?',
      [id, req.user.id]
    );
    if (!existing) return res.status(404).json({ message: 'Recruitment not found' });

    await pool.query('DELETE FROM supplier_recruitments WHERE id = ? AND ambassador_id = ?', [id, req.user.id]);
    return res.json({ message: 'Recruitment deleted' });
  } catch (err) {
    logger.error('[Delete supplier recruitment error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecruitmentStats = async (req, res) => {
  try {
    const [[{ totalRecruitments }]] = await pool.query(
      'SELECT COUNT(*) AS totalRecruitments FROM supplier_recruitments WHERE ambassador_id = ?',
      [req.user.id]
    );
    const [[{ leads }]] = await pool.query(
      "SELECT COUNT(*) AS leads FROM supplier_recruitments WHERE ambassador_id = ? AND status = 'lead'",
      [req.user.id]
    );
    const [[{ contacted }]] = await pool.query(
      "SELECT COUNT(*) AS contacted FROM supplier_recruitments WHERE ambassador_id = ? AND status = 'contacted'",
      [req.user.id]
    );
    const [[{ registered }]] = await pool.query(
      "SELECT COUNT(*) AS registered FROM supplier_recruitments WHERE ambassador_id = ? AND status = 'registered'",
      [req.user.id]
    );
    const [[{ certified }]] = await pool.query(
      "SELECT COUNT(*) AS certified FROM supplier_recruitments WHERE ambassador_id = ? AND status = 'certified'",
      [req.user.id]
    );

    return res.json({
      stats: {
        totalRecruitments,
        leads,
        contacted,
        registered,
        certified,
      }
    });
  } catch (err) {
    logger.error('[Supplier recruitment stats error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};