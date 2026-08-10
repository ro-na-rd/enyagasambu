const pool = require('../config/db');

const sanitize = (v) => (typeof v === 'string' ? v.trim() : v);

exports.getClients = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, status, deals, notes, created_at
       FROM broker_clients
       WHERE broker_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ clients: rows });
  } catch (err) {
    console.error('[Broker clients list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createClient = async (req, res) => {
  const { name, email, phone, status, deals, notes } = req.body || {};
  if (!name || !sanitize(name)) {
    return res.status(400).json({ message: 'Client name is required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO broker_clients (broker_id, name, email, phone, status, deals, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        sanitize(name),
        sanitize(email) || null,
        sanitize(phone) || null,
        status === 'inactive' ? 'inactive' : 'active',
        parseInt(deals, 10) > 0 ? parseInt(deals, 10) : 0,
        notes ? String(notes).trim() : null,
      ]
    );
    const [[client]] = await pool.query(
      'SELECT id, name, email, phone, status, deals, notes, created_at FROM broker_clients WHERE id = ?',
      [result.insertId]
    );
    return res.status(201).json({ client });
  } catch (err) {
    console.error('[Broker client create error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateClient = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status, deals, notes } = req.body || {};
  try {
    const [existing] = await pool.query(
      'SELECT name, email, phone, status, deals, notes FROM broker_clients WHERE id = ? AND broker_id = ?',
      [id, req.user.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    if (name && !sanitize(name)) {
      return res.status(400).json({ message: 'Client name is required' });
    }
    const cur = existing[0];
    await pool.query(
      `UPDATE broker_clients
       SET name = ?, email = ?, phone = ?, status = ?, deals = ?, notes = ?
       WHERE id = ? AND broker_id = ?`,
      [
        name !== undefined ? sanitize(name) || cur.name : cur.name,
        email !== undefined ? (sanitize(email) || null) : cur.email,
        phone !== undefined ? (sanitize(phone) || null) : cur.phone,
        status !== undefined ? (status === 'inactive' ? 'inactive' : 'active') : cur.status,
        deals !== undefined ? (parseInt(deals, 10) > 0 ? parseInt(deals, 10) : 0) : cur.deals,
        notes !== undefined ? (String(notes).trim() || null) : cur.notes,
        id,
        req.user.id,
      ]
    );
    const [[client]] = await pool.query(
      'SELECT id, name, email, phone, status, deals, notes, created_at FROM broker_clients WHERE id = ?',
      [id]
    );
    return res.json({ client });
  } catch (err) {
    console.error('[Broker client update error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteClient = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM broker_clients WHERE id = ? AND broker_id = ?',
      [id, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[Broker client delete error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
