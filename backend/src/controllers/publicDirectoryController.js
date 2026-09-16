const pool = require('../config/db');
const { logger } = require('../config/logger');

const ROLE_LABELS = {
  broker: 'Registered Broker',
  ambassador: 'Registered Ambassador',
  supplier: 'Registered Supplier',
  user: 'Registered Member',
  seller: 'Registered Member',
};

exports.listRegisteredMembers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, role, is_verified, created_at
       FROM users
       WHERE role IN ('broker', 'ambassador', 'supplier', 'user', 'seller')
       ORDER BY created_at DESC, name ASC`
    );

    const members = rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: ROLE_LABELS[row.role] || 'Registered Member',
      category: row.role === 'user' || row.role === 'seller' ? 'member' : row.role,
      status: row.is_verified ? 'Verified' : 'Registered',
      created_at: row.created_at,
    }));

    return res.json({ members });
  } catch (err) {
    logger.error('[Public directory error]', err);
    return res.status(500).json({ message: 'Could not load registered members' });
  }
};
