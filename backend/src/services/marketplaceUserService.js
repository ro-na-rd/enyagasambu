const crypto = require('crypto');

async function getOrCreateStaffMarketplaceUser(conn, staffId) {
  const [[staff]] = await conn.query(
    'SELECT id, username, email, phone, role FROM staff WHERE id = ? AND is_active = 1',
    [staffId]
  );
  if (!staff) throw new Error('Staff account not found');

  if (staff.email) {
    const [[existingByEmail]] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [staff.email]);
    if (existingByEmail) return existingByEmail.id;
  }

  if (staff.phone) {
    const phoneDigits = staff.phone.replace(/\D/g, '');
    if (phoneDigits) {
      const [usersWithPhones] = await conn.query('SELECT id, phone FROM users WHERE phone IS NOT NULL');
      const existingByPhone = usersWithPhones.find((user) => (user.phone || '').replace(/\D/g, '') === phoneDigits);
      if (existingByPhone) return existingByPhone.id;
    }
  }

  const [result] = await conn.query(
    'INSERT INTO users (name, email, phone, password_hash, role, coins) VALUES (?, ?, ?, ?, ?, 0)',
    [staff.username, staff.email || null, staff.phone || null, crypto.randomBytes(32).toString('hex'), staff.role === 'moderator' ? 'user' : 'admin']
  );
  return result.insertId;
}

module.exports = { getOrCreateStaffMarketplaceUser };
