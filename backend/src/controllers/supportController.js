const pool = require('../config/db');

exports.submit = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Name, email, subject and message are required' });
  }
  try {
    await pool.query(
      `INSERT INTO support_requests (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone || null, subject, message]
    );
    res.status(201).json({ message: 'Support request submitted successfully' });
  } catch (err) {
    console.error('[Support] submit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM support_requests ORDER BY created_at DESC'
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
