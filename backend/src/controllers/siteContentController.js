const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sc.*, u.name AS updated_by_name
       FROM site_content sc
       LEFT JOIN users u ON sc.updated_by = u.id
       ORDER BY sc.section ASC, sc.label ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[SiteContent] getAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT content_key, content FROM site_content WHERE status = 'published'"
    );
    const map = {};
    rows.forEach((r) => { map[r.content_key] = r.content; });
    res.json(map);
  } catch (err) {
    console.error('[SiteContent] getPublic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { content_key, section, label, content, status } = req.body;
  if (!content_key || !label) return res.status(400).json({ message: 'content_key and label are required' });
  try {
    const [result] = await pool.query(
      `INSERT INTO site_content (content_key, section, label, content, status, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [content_key, section || 'general', label, content || '', status || 'published', req.user.id]
    );
    const [[row]] = await pool.query(
      `SELECT sc.*, u.name AS updated_by_name
       FROM site_content sc LEFT JOIN users u ON sc.updated_by = u.id WHERE sc.id = ?`,
      [result.insertId]
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A content key with that name already exists' });
    console.error('[SiteContent] create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { content_key, section, label, content, status } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id FROM site_content WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query(
      `UPDATE site_content SET
         content_key = COALESCE(?, content_key),
         section = COALESCE(?, section),
         label = COALESCE(?, label),
         content = COALESCE(?, content),
         status = COALESCE(?, status),
         updated_by = ?
       WHERE id = ?`,
      [content_key || null, section || null, label || null, content !== undefined ? content : null, status || null, req.user.id, req.params.id]
    );
    const [[row]] = await pool.query(
      `SELECT sc.*, u.name AS updated_by_name
       FROM site_content sc LEFT JOIN users u ON sc.updated_by = u.id WHERE sc.id = ?`,
      [req.params.id]
    );
    res.json(row);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A content key with that name already exists' });
    console.error('[SiteContent] update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id, status FROM site_content WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const newStatus = existing.status === 'published' ? 'draft' : 'published';
    await pool.query('UPDATE site_content SET status = ?, updated_by = ? WHERE id = ?', [newStatus, req.user.id, req.params.id]);
    const [[row]] = await pool.query(
      `SELECT sc.*, u.name AS updated_by_name
       FROM site_content sc LEFT JOIN users u ON sc.updated_by = u.id WHERE sc.id = ?`,
      [req.params.id]
    );
    res.json(row);
  } catch (err) {
    console.error('[SiteContent] toggleStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM site_content WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await pool.query('DELETE FROM site_content WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[SiteContent] remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};