const pool = require('../config/db');
const { emitToUser } = require('../config/socket');

async function notifyUser(userId, title, message, type = 'info', link = null) {
  if (!userId) return;
  let id = null;
  try {
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, link]
    );
    id = result.insertId;
  } catch (err) {
    console.error('[Notification] notifyUser error:', err.message);
  }
  if (id) {
    emitToUser(userId, 'notification:new', {
      id,
      title,
      message,
      type,
      link,
      is_read: 0,
      created_at: new Date().toISOString(),
    });
  }
}

async function notifyAdmins(title, message, type = 'info', link = null) {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM staff WHERE role IN ('admin', 'moderator') AND is_active = 1"
    );
    for (const s of rows) {
      const [result] = await pool.query(
        'INSERT INTO notifications (staff_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)',
        [s.id, title, message, type, link]
      );
      emitToUser(s.id, 'notification:new', {
        id: result.insertId,
        title,
        message,
        type,
        link,
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Notification] notifyAdmins error:', err.message);
  }
}

module.exports = { notifyUser, notifyAdmins };
