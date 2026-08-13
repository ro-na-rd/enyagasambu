const pool = require('../config/db');

function recipientCol(user) {
  return user.is_staff ? 'staff_id' : 'user_id';
}

exports.list = async (req, res) => {
  try {
    const col = recipientCol(req.user);
    const [rows] = await pool.query(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM notifications WHERE ${col} = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Notifications list error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const col = recipientCol(req.user);
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE ${col} = ? AND is_read = 0`,
      [req.user.id]
    );
    res.json({ count });
  } catch (err) {
    console.error('[Notifications unread error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const col = recipientCol(req.user);
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND ${col} = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications markRead error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const col = recipientCol(req.user);
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE ${col} = ?`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications markAllRead error]', err);
    res.status(500).json({ message: 'Server error' });
  }
};
