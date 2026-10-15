const pool = require('../config/db');
const { logger } = require('../config/logger');
const {
  slugifyKey,
  parseOptions,
  normalizeFieldType,
  serializeField,
} = require('../services/categoryFieldsService');

const fieldColumns = 'id, category_id, field_key, label, field_type, options, placeholder, is_required, sort_order';
const fieldOrder = 'ORDER BY category_id, sort_order, id';

const fieldRows = `
  SELECT ${fieldColumns}
  FROM category_fields
  ${fieldOrder}`;

// One query for every category's fields so listing forms get everything in a single call.
async function attachFields(rows) {
  if (rows.length === 0) return rows;
  const [fields] = await pool.query(fieldRows);
  const byCategory = new Map();
  for (const field of fields) {
    const list = byCategory.get(field.category_id) || [];
    list.push(serializeField(field));
    byCategory.set(field.category_id, list);
  }
  return rows.map((row) => ({ ...row, fields: byCategory.get(row.id) || [] }));
}

exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type, name');
    return res.json({ categories: await attachFields(rows) });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getCategoryFields = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${fieldColumns}
       FROM category_fields
       WHERE category_id = ?
       ORDER BY sort_order, id`,
      [req.params.id]
    );
    return res.json({ fields: rows.map(serializeField) });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createCategoryField = async (req, res) => {
  const { id } = req.params;
  const { label, field_type, options, placeholder, is_required, sort_order } = req.body;
  if (!label || !label.trim()) return res.status(400).json({ message: 'Field label is required' });
  try {
    const [[category]] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const fieldKey = slugifyKey(req.body.field_key || label);
    if (!fieldKey) return res.status(400).json({ message: 'Field label must contain letters or numbers' });
    if (normalizeFieldType(field_type) === 'select' && parseOptions(options).length === 0) {
      return res.status(400).json({ message: 'Select fields need at least one option' });
    }

    const [result] = await pool.query(
      `INSERT INTO category_fields (category_id, field_key, label, field_type, options, placeholder, is_required, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        fieldKey,
        label.trim(),
        normalizeFieldType(field_type),
        JSON.stringify(parseOptions(options)),
        placeholder || null,
        is_required ? 1 : 0,
        parseInt(sort_order, 10) || 0,
      ]
    );
    return res.status(201).json({ id: result.insertId, field_key: fieldKey });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'This category already has a field with that key' });
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategoryField = async (req, res) => {
  const { id, fieldId } = req.params;
  const { label, field_type, options, placeholder, is_required, sort_order } = req.body;
  if (!label || !label.trim()) return res.status(400).json({ message: 'Field label is required' });
  try {
    const [[field]] = await pool.query(
      'SELECT * FROM category_fields WHERE id = ? AND category_id = ?',
      [fieldId, id]
    );
    if (!field) return res.status(404).json({ message: 'Field not found' });

    const nextType = normalizeFieldType(field_type);
    if (nextType === 'select' && parseOptions(options).length === 0) {
      return res.status(400).json({ message: 'Select fields need at least one option' });
    }

    await pool.query(
      `UPDATE category_fields SET label = ?, field_type = ?, options = ?, placeholder = ?, is_required = ?, sort_order = ?
       WHERE id = ? AND category_id = ?`,
      [
        label.trim(),
        nextType,
        JSON.stringify(parseOptions(options)),
        placeholder || null,
        is_required ? 1 : 0,
        parseInt(sort_order, 10) || 0,
        fieldId,
        id,
      ]
    );
    return res.json({ id: Number(fieldId), message: 'Field updated' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategoryField = async (req, res) => {
  const { id, fieldId } = req.params;
  try {
    const [result] = await pool.query(
      'DELETE FROM category_fields WHERE id = ? AND category_id = ?',
      [fieldId, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Field not found' });
    return res.json({ message: 'Field deleted' });
  } catch (err) {
    logger.error(err);
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
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Name and type are required' });
  try {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [[existing]] = await pool.query('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    await pool.query(
      'UPDATE categories SET name = ?, slug = ?, type = ? WHERE id = ?',
      [name, slug, type, id]
    );
    return res.json({ id: Number(id), name, slug, type });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A category with that name already exists' });
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ message: 'Category deleted' });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
