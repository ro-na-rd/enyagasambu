const pool = require('../config/db');
const { uploadToS3, deleteFromS3Url } = require('../services/s3Service');

function normalizeCategory(value) {
  return value === 'board' ? 'board' : 'team';
}

exports.getPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, category, name, role, photo_url, sort_order
       FROM team_members
       WHERE active = 1
       ORDER BY category, sort_order, id`
    );
    res.json({ members: rows });
  } catch (err) {
    console.error('[Team] getPublic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT tm.id, tm.category, tm.name, tm.role, tm.photo_url, tm.sort_order, tm.active, tm.updated_at,
              u.username AS updated_by_name
       FROM team_members tm
       LEFT JOIN staff u ON u.id = tm.updated_by
       ORDER BY tm.category, tm.sort_order, tm.id`
    );
    res.json({ members: rows });
  } catch (err) {
    console.error('[Team] getAll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  const { name, role, category, sort_order } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Name is required' });
  }

  let photoUrl = null;
  try {
    if (req.file) {
      const { url } = await uploadToS3(req.file);
      photoUrl = url;
    }
    const [result] = await pool.query(
      `INSERT INTO team_members (category, name, role, photo_url, sort_order, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [normalizeCategory(category), String(name).trim(), String(role || '').trim(), photoUrl, parseInt(sort_order) || 0, req.user.id]
    );
    const [[row]] = await pool.query('SELECT * FROM team_members WHERE id = ?', [result.insertId]);
    res.status(201).json({ member: row });
  } catch (err) {
    console.error('[Team] create error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  const { name, role, category, sort_order, active } = req.body;
  try {
    const [[existing]] = await pool.query(
      'SELECT id, photo_url FROM team_members WHERE id = ?',
      [req.params.id]
    );
    if (!existing) return res.status(404).json({ message: 'Not found' });

    let photoUrl = existing.photo_url;
    let uploadedNewPhoto = false;
    if (req.file) {
      const { url } = await uploadToS3(req.file);
      photoUrl = url;
      uploadedNewPhoto = true;
    }

    await pool.query(
      `UPDATE team_members SET
         name = COALESCE(?, name),
         role = COALESCE(?, role),
         category = COALESCE(?, category),
         photo_url = COALESCE(?, photo_url),
         sort_order = COALESCE(?, sort_order),
         active = COALESCE(?, active),
         updated_by = ?
       WHERE id = ?`,
      [
        name ? String(name).trim() : null,
        role !== undefined ? String(role).trim() : null,
        category ? normalizeCategory(category) : null,
        photoUrl,
        sort_order !== undefined ? parseInt(sort_order) : null,
        active !== undefined ? (active === 'false' || active === false ? 0 : 1) : null,
        req.user.id,
        req.params.id,
      ]
    );

    const [[row]] = await pool.query('SELECT * FROM team_members WHERE id = ?', [req.params.id]);
    res.json({ member: row });

    if (uploadedNewPhoto && existing.photo_url) {
      await deleteFromS3Url(existing.photo_url);
    }
  } catch (err) {
    console.error('[Team] update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    const [[existing]] = await pool.query(
      'SELECT id, photo_url FROM team_members WHERE id = ?',
      [req.params.id]
    );
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await pool.query('DELETE FROM team_members WHERE id = ?', [req.params.id]);

    if (existing.photo_url) {
      await deleteFromS3Url(existing.photo_url);
    }

    res.json({ message: 'Member deleted' });
  } catch (err) {
    console.error('[Team] remove error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};