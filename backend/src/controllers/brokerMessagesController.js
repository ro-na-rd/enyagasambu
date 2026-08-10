const pool = require('../config/db');

function convKey(msg) {
  if (msg.client_id) return `client:${msg.client_id}`;
  if (msg.sender_email) return `email:${msg.sender_email.toLowerCase()}`;
  if (msg.sender_phone) return `phone:${msg.sender_phone}`;
  return `name:${msg.sender_name}`;
}

function parseKey(key) {
  const idx = key.indexOf(':');
  if (idx === -1) return null;
  const type = key.slice(0, idx);
  const value = key.slice(idx + 1);
  if (type === 'client') return { client_id: parseInt(value, 10) };
  if (type === 'email') return { email: value };
  if (type === 'phone') return { phone: value };
  if (type === 'name') return { name: value };
  return null;
}

exports.getConversations = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, client_id, direction, sender_name, sender_email, sender_phone, body, is_read, created_at
       FROM broker_messages WHERE broker_id = ? ORDER BY created_at ASC`,
      [req.user.id]
    );

    const map = new Map();
    for (const m of rows) {
      const key = convKey(m);
      let c = map.get(key);
      if (!c) {
        c = {
          key,
          client_id: m.client_id,
          name: m.sender_name,
          email: m.sender_email,
          phone: m.sender_phone,
          lastMessage: '',
          lastAt: m.created_at,
          unread: 0,
        };
        map.set(key, c);
      }
      c.lastMessage = m.direction === 'inbound' ? m.body : `You: ${m.body}`;
      c.lastAt = m.created_at;
      if (m.direction === 'inbound' && !m.is_read) c.unread += 1;
    }

    if (map.size > 0) {
      const clientIds = [...new Set([...map.values()].map((c) => c.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const [clients] = await pool.query(
          `SELECT id, name, email, phone FROM broker_clients WHERE broker_id = ? AND id IN (?)`,
          [req.user.id, clientIds]
        );
        const byId = new Map(clients.map((c) => [c.id, c]));
        for (const c of map.values()) {
          const cl = byId.get(c.client_id);
          if (cl) {
            c.name = cl.name;
            c.email = c.email || cl.email;
            c.phone = c.phone || cl.phone;
          }
        }
      }
    }

    const conversations = [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    return res.json({ conversations });
  } catch (err) {
    console.error('[Broker conversations error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getThread = async (req, res) => {
  const { key } = req.query;
  const parsed = key ? parseKey(String(key)) : null;
  if (!parsed) return res.status(400).json({ message: 'Invalid conversation' });

  try {
    let where = 'broker_id = ?';
    const params = [req.user.id];
    if (parsed.client_id) {
      where += ' AND client_id = ?';
      params.push(parsed.client_id);
    } else if (parsed.email) {
      where += ' AND sender_email = ?';
      params.push(parsed.email);
    } else if (parsed.phone) {
      where += ' AND sender_phone = ?';
      params.push(parsed.phone);
    } else if (parsed.name) {
      where += ' AND sender_name = ? AND client_id IS NULL';
      params.push(parsed.name);
    }

    const [messages] = await pool.query(
      `SELECT id, client_id, direction, sender_name, sender_email, sender_phone, body, is_read, created_at
       FROM broker_messages WHERE ${where} ORDER BY created_at ASC`,
      params
    );

    await pool.query(
      `UPDATE broker_messages SET is_read = 1 WHERE direction = 'inbound' AND ${where}`,
      params
    );

    let conversation = null;
    if (messages.length > 0) {
      const first = messages[0];
      conversation = {
        key,
        client_id: parsed.client_id || null,
        name: first.sender_name,
        email: first.sender_email,
        phone: first.sender_phone,
      };
    }

    if (parsed.client_id && conversation) {
      const [[client]] = await pool.query(
        'SELECT id, name, email, phone FROM broker_clients WHERE id = ? AND broker_id = ?',
        [parsed.client_id, req.user.id]
      );
      if (client) {
        conversation.name = client.name;
        conversation.email = conversation.email || client.email;
        conversation.phone = conversation.phone || client.phone;
      }
    }

    return res.json({ conversation, messages });
  } catch (err) {
    console.error('[Broker thread error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  const { client_id, body, to_name, to_email, to_phone } = req.body || {};
  if (!body || !String(body).trim()) {
    return res.status(400).json({ message: 'Message body is required' });
  }

  try {
    let name = to_name ? String(to_name).trim() : '';
    let email = to_email ? String(to_email).trim() : null;
    let phone = to_phone ? String(to_phone).trim() : null;
    let clientId = null;

    if (client_id) {
      const [[client]] = await pool.query(
        'SELECT id, name, email, phone FROM broker_clients WHERE id = ? AND broker_id = ?',
        [parseInt(client_id, 10), req.user.id]
      );
      if (!client) return res.status(404).json({ message: 'Client not found' });
      clientId = client.id;
      name = client.name;
      email = email || client.email;
      phone = phone || client.phone;
    }

    if (!name && !email && !phone) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    const [[broker]] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);

    const [result] = await pool.query(
      `INSERT INTO broker_messages (broker_id, client_id, direction, sender_name, sender_email, sender_phone, body, is_read)
       VALUES (?, ?, 'outbound', ?, ?, ?, ?, 1)`,
      [req.user.id, clientId, broker?.name || 'You', email, phone, String(body).trim()]
    );

    const [[message]] = await pool.query(
      'SELECT id, client_id, direction, sender_name, sender_email, sender_phone, body, is_read, created_at FROM broker_messages WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ message });
  } catch (err) {
    console.error('[Broker send error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  const { key } = req.body || {};
  const parsed = key ? parseKey(String(key)) : null;
  if (!parsed) return res.status(400).json({ message: 'Invalid conversation' });

  try {
    let where = 'broker_id = ?';
    const params = [req.user.id];
    if (parsed.client_id) {
      where += ' AND client_id = ?';
      params.push(parsed.client_id);
    } else if (parsed.email) {
      where += ' AND sender_email = ?';
      params.push(parsed.email);
    } else if (parsed.phone) {
      where += ' AND sender_phone = ?';
      params.push(parsed.phone);
    } else if (parsed.name) {
      where += ' AND sender_name = ? AND client_id IS NULL';
      params.push(parsed.name);
    }

    await pool.query(
      `UPDATE broker_messages SET is_read = 1 WHERE direction = 'inbound' AND ${where}`,
      params
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[Broker mark-read error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
