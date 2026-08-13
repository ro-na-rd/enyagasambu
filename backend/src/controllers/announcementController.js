const pool = require('../config/db');

const ROLE_AUDIENCE = {
  ambassador: 'ambassador',
  broker: 'broker',
  supplier: 'supplier',
  admin: 'staff',
  moderator: 'staff',
  staff: 'staff',
};

exports.listForRole = async (req, res) => {
  try {
    const audience = ROLE_AUDIENCE[req.user?.role] || 'all';
    const [rows] = await pool.query(
      `SELECT id, title, body, audience, created_at
       FROM announcements
       WHERE is_published = 1 AND (audience = 'all' OR audience = ?)
       ORDER BY created_at DESC LIMIT 30`,
      [audience]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Announcements list error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.body, a.audience, a.is_published, a.created_at,
              s.username AS created_by_name
       FROM announcements a
       LEFT JOIN staff s ON a.created_by = s.id
       ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Announcements adminList error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminCreate = async (req, res) => {
  const { title, body, audience } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (title, body, audience, created_by) VALUES (?, ?, ?, ?)',
      [title, body, audience || 'all', req.user.id]
    );
    return res.status(201).json({ message: 'Announcement created', id: result.insertId });
  } catch (err) {
    console.error('[Announcements adminCreate error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Announcements adminDelete error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};
