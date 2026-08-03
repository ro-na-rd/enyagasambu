const pool = require('../config/db');

exports.listSuppliers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.phone, sp.business_name, sp.business_location, sp.verified
       FROM users u
       JOIN supplier_profiles sp ON sp.user_id = u.id
       WHERE sp.verified = 1
       ORDER BY u.name`
    );
    return res.json({ suppliers: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.myListings = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, description, price, price_type, location, status, listing_type, expires_at, created_at
       FROM listings WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ listings: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
