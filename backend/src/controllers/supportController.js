const pool = require('../config/db');
const { notifyAdmins } = require('../services/notificationService');

const CATEGORIES = ['payment', 'listing', 'access', 'other'];

exports.submit = async (req, res) => {
  const { name, email, phone, category, subject, message, listingId } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email and message are required' });
  }
  const resolvedCategory = category && CATEGORIES.includes(category) ? category : 'other';
  try {
    await pool.query(
      `INSERT INTO support_requests (name, email, phone, category, subject, message, listing_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone || null, resolvedCategory, subject || resolvedCategory, message, listingId || null]
    );
    notifyAdmins('New support request', `${name} submitted a ${resolvedCategory} request.`, 'support');
    res.status(201).json({ message: 'Support request submitted successfully' });
  } catch (err) {
    console.error('[Support] submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT sr.*, l.title AS listing_title
       FROM support_requests sr
       LEFT JOIN listings l ON l.id = sr.listing_id
       ORDER BY sr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[Support] list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'in_progress', 'resolved', 'closed'];
  if (!valid.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    await pool.query('UPDATE support_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('[Support] updateStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
