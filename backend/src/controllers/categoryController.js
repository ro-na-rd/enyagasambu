const pool = require('../config/db');

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type, name');
    return res.json({ categories: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)',
      [name, slug, type]
    );
    return res.status(201).json({ id: result.insertId, name, slug, type });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Category already exists' });
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
