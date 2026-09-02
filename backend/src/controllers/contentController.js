const pool = require('../config/db');
const { logger } = require('../config/logger');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT cp.*, u.name AS created_by_name
       FROM content_pages cp
       LEFT JOIN users u ON cp.created_by = u.id
       ORDER BY cp.updated_at DESC`
    );
    res.json(rows);
  } catch (err) {
    logger.error('[Content] getAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const [[row]] = await pool.query(
      'SELECT * FROM content_pages WHERE slug = ?',
      [req.params.slug]
    );
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) {
    logger.error('[Content] getBySlug error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM content_pages WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (err) {
    logger.error('[Content] getById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { title, slug, type, content, status, meta_description } = req.body;
  if (!title || !slug) return res.status(400).json({ message: 'Title and slug are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO content_pages (title, slug, type, content, status, meta_description, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, type || 'page', content || '', status || 'draft', meta_description || null, req.user.id, req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM content_pages WHERE id = ?', [result.insertId]);
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A page with that slug already exists' });
    logger.error('[Content] create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { title, slug, type, content, status, meta_description } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id FROM content_pages WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query(
      `UPDATE content_pages SET title = COALESCE(?, title), slug = COALESCE(?, slug),
       type = COALESCE(?, type), content = COALESCE(?, content),
       status = COALESCE(?, status), meta_description = COALESCE(?, meta_description),
       updated_by = ? WHERE id = ?`,
      [title || null, slug || null, type || null, content ?? null, status || null, meta_description !== undefined ? meta_description : null, req.user.id, req.params.id]
    );
    const [[row]] = await pool.query('SELECT * FROM content_pages WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A page with that slug already exists' });
    logger.error('[Content] update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id, status FROM content_pages WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const newStatus = existing.status === 'published' ? 'draft' : 'published';
    await pool.query('UPDATE content_pages SET status = ?, updated_by = ? WHERE id = ?', [newStatus, req.user.id, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM content_pages WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    logger.error('[Content] toggleStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM content_pages WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query('DELETE FROM content_pages WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    logger.error('[Content] remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
