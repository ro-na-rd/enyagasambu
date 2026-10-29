const pool = require('../config/db');
const { logger } = require('../config/logger');
const { uploadToS3, deleteFromS3Url } = require('../services/s3Service');

const ROLE_AUDIENCE = {
  ambassador: 'ambassador',
  broker: 'broker',
  supplier: 'supplier',
  admin: 'staff',
  moderator: 'staff',
  staff: 'staff',
};

const truthy = (value) => value === true || value === 1 || value === '1' || value === 'true' || value === 'on';

exports.listForRole = async (req, res) => {
  try {
    const audience = ROLE_AUDIENCE[req.user?.role] || 'all';
    const [rows] = await pool.query(
      `SELECT id, title, body, image_url, audience, is_trending, created_at
       FROM announcements
       WHERE is_published = 1 AND (audience = 'all' OR audience = ?)
       ORDER BY is_trending DESC, created_at DESC LIMIT 30`,
      [audience]
    );
    res.json(rows);
  } catch (err) {
    logger.error('[Announcements list error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listPublic = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, body, image_url, is_trending, created_at
       FROM announcements
       WHERE is_published = 1 AND audience = 'all'
       ORDER BY is_trending DESC, created_at DESC LIMIT 30`
    );
    res.json(rows);
  } catch (err) {
    logger.error('[Announcements public list error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.body, a.image_url, a.audience, a.is_published, a.is_trending, a.created_at,
              s.username AS created_by_name
       FROM announcements a
       LEFT JOIN staff s ON a.created_by = s.id
       ORDER BY a.is_trending DESC, a.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    logger.error('[Announcements adminList error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.adminCreate = async (req, res) => {
  const { title, body, audience, is_trending } = req.body;
  if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = (await uploadToS3(req.file)).url;
    }

    const [result] = await pool.query(
      'INSERT INTO announcements (title, body, image_url, audience, is_trending, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, body, imageUrl, audience || 'all', truthy(is_trending) ? 1 : 0, req.user.id]
    );
    return res.status(201).json({ message: 'Announcement created', id: result.insertId, image_url: imageUrl });
  } catch (err) {
    logger.error('[Announcements adminCreate error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.adminDelete = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image_url FROM announcements WHERE id = ?', [req.params.id]);
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    if (rows[0]?.image_url) {
      await deleteFromS3Url(rows[0].image_url);
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('[Announcements adminDelete error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};
