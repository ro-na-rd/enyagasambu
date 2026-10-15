const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugifyKey,
  parseOptions,
  normalizeFieldType,
  serializeField,
  parseAttributes,
  sanitizeAttributes,
} = require('../src/services/categoryFieldsService');

test('slugifyKey turns a label into a stable storage key', () => {
  assert.equal(slugifyKey('  Brand Name '), 'brand_name');
  assert.equal(slugifyKey('Mileage (km)'), 'mileage_km');
});

test('parseOptions accepts JSON arrays and comma separated lists', () => {
  assert.deepEqual(parseOptions('["Red","Blue"]'), ['Red', 'Blue']);
  assert.deepEqual(parseOptions('Red, Blue'), ['Red', 'Blue']);
  assert.deepEqual(parseOptions(null), []);
});

test('normalizeFieldType falls back to text for unknown types', () => {
  assert.equal(normalizeFieldType('number'), 'number');
  assert.equal(normalizeFieldType('color-picker'), 'text');
});

test('serializeField exposes booleans and parsed options', () => {
  const field = serializeField({
    id: 1,
    category_id: 4,
    field_key: 'brand',
    label: 'Brand',
    field_type: 'select',
    options: 'Apple,Samsung',
    is_required: 1,
    sort_order: 2,
  });
  assert.deepEqual(field.options, ['Apple', 'Samsung']);
  assert.equal(field.is_required, true);
});

test('parseAttributes reads stored JSON and tolerates junk', () => {
  assert.deepEqual(parseAttributes('{"brand":"Apple"}'), { brand: 'Apple' });
  assert.deepEqual(parseAttributes('not json'), {});
  assert.deepEqual(parseAttributes(null), {});
});

test('sanitizeAttributes keeps only fields defined for the category', () => {
  const fields = [
    { field_key: 'brand', label: 'Brand', field_type: 'text', is_required: false },
    { field_key: 'storage', label: 'Storage', field_type: 'number', is_required: false },
  ];
  const { values, errors } = sanitizeAttributes(fields, {
    brand: 'Apple',
    storage: '256',
    removed_field: 'legacy',
  });
  assert.deepEqual(values, { brand: 'Apple', storage: 256 });
  assert.deepEqual(errors, []);
});

test('sanitizeAttributes reports missing required fields by label', () => {
  const fields = [{ field_key: 'brand', label: 'Brand', field_type: 'text', is_required: true }];
  const { values, errors } = sanitizeAttributes(fields, { brand: '  ' });
  assert.deepEqual(values, {});
  assert.deepEqual(errors, ['Brand is required']);
});

test('sanitizeAttributes rejects values outside a select field options', () => {
  const fields = [{
    field_key: 'condition',
    label: 'Condition',
    field_type: 'select',
    options: 'New,Used',
    is_required: false,
  }];
  const { values, errors } = sanitizeAttributes(fields, { condition: 'Broken' });
  assert.deepEqual(values, {});
  assert.deepEqual(errors, ['Condition must be one of: New, Used']);
});

test('sanitizeAttributes coerces booleans and rejects non-numeric numbers', () => {
  const fields = [
    { field_key: 'negotiable', label: 'Negotiable', field_type: 'boolean', is_required: false },
    { field_key: 'year', label: 'Year', field_type: 'number', is_required: false },
  ];
  const { values, errors } = sanitizeAttributes(fields, { negotiable: 'true', year: 'abc' });
  assert.deepEqual(values, { negotiable: true });
  assert.deepEqual(errors, ['Year must be a number']);
});

test('sanitizeAttributes rejects text longer than the allowed limit', () => {
  const fields = [{ field_key: 'notes', label: 'Notes', field_type: 'textarea', is_required: false }];
  const { values, errors } = sanitizeAttributes(fields, { notes: 'x'.repeat(501) });
  assert.deepEqual(values, {});
  assert.deepEqual(errors, ['Notes must be less than 500 characters']);
});