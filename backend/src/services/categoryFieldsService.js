const pool = require('../config/db');
const { logger } = require('../config/logger');

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'boolean'];
const MAX_VALUE_LENGTH = 500;

function slugifyKey(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

function parseOptions(options) {
  if (Array.isArray(options)) return options.map((o) => String(o).trim()).filter(Boolean);
  if (typeof options !== 'string' || !options.trim()) return [];
  try {
    const parsed = JSON.parse(options);
    if (Array.isArray(parsed)) return parsed.map((o) => String(o).trim()).filter(Boolean);
  } catch {
    // Plain comma-separated lists are allowed so admins can paste "Red, Blue".
  }
  return options.split(',').map((o) => o.trim()).filter(Boolean);
}

function normalizeFieldType(type) {
  const value = String(type || '').trim().toLowerCase();
  return FIELD_TYPES.includes(value) ? value : 'text';
}

// Raw DB rows -> the shape the API and the frontend forms consume.
function serializeField(row) {
  return {
    id: row.id,
    category_id: row.category_id,
    field_key: row.field_key,
    label: row.label,
    field_type: row.field_type,
    options: parseOptions(row.options),
    placeholder: row.placeholder || null,
    is_required: Boolean(row.is_required),
    sort_order: row.sort_order,
  };
}

function parseAttributes(raw) {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (err) {
    logger.warn('[CategoryFields] Ignoring unparseable attributes payload');
    return {};
  }
}

/**
 * Validates a submitted attributes object against a category's field definitions.
 * Unknown keys are dropped so a category's field removal cannot leave stale data,
 * and required fields must be answered. Returns the cleaned values plus the
 * messages the caller should surface to the poster.
 */
function sanitizeAttributes(fields, raw) {
  const submitted = parseAttributes(raw);
  const values = {};
  const errors = [];

  for (const field of fields || []) {
    const key = field.field_key;
    const label = field.label || key;
    const provided = submitted[key];
    const isBlank = provided === undefined || provided === null
      || (typeof provided === 'string' && provided.trim() === '');

    if (isBlank) {
      if (field.is_required) errors.push(`${label} is required`);
      continue;
    }

    if (field.field_type === 'number') {
      const num = Number(provided);
      if (!Number.isFinite(num)) {
        errors.push(`${label} must be a number`);
        continue;
      }
      values[key] = num;
      continue;
    }

    if (field.field_type === 'boolean') {
      values[key] = provided === true || provided === 'true' || provided === 1 || provided === '1';
      continue;
    }

    if (field.field_type === 'select') {
      const options = parseOptions(field.options);
      const value = String(provided).trim();
      if (options.length && !options.includes(value)) {
        errors.push(`${label} must be one of: ${options.join(', ')}`);
        continue;
      }
      values[key] = value;
      continue;
    }

    const value = String(provided).trim();
    if (value.length > MAX_VALUE_LENGTH) {
      errors.push(`${label} must be less than ${MAX_VALUE_LENGTH} characters`);
      continue;
    }
    values[key] = value;
  }

  return { values, errors };
}

/**
 * Reads a category's posting fields. Pass a connection to read inside an open
 * transaction; the shared pool is used otherwise.
 */
async function loadCategoryFields(categoryId, executor) {
  const runner = executor || pool;
  const [rows] = await runner.query(
    `SELECT id, category_id, field_key, label, field_type, options, placeholder, is_required, sort_order
     FROM category_fields WHERE category_id = ? ORDER BY sort_order, id`,
    [categoryId]
  );
  return rows.map(serializeField);
}

module.exports = {
  FIELD_TYPES,
  MAX_VALUE_LENGTH,
  slugifyKey,
  parseOptions,
  normalizeFieldType,
  serializeField,
  parseAttributes,
  sanitizeAttributes,
  loadCategoryFields,
};