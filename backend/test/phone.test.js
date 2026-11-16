const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRwandaPhone, isValidRwandaPhone } = require('../src/utils/phone');

test('normalizeRwandaPhone keeps national mobile numbers', () => {
  assert.equal(normalizeRwandaPhone('0788123456'), '0788123456');
});

test('normalizeRwandaPhone removes spaces, dashes and parentheses', () => {
  assert.equal(normalizeRwandaPhone('078 812-3456'), '0788123456');
  assert.equal(normalizeRwandaPhone('(078) 812 3456'), '0788123456');
});

test('normalizeRwandaPhone converts international prefixes to national format', () => {
  assert.equal(normalizeRwandaPhone('+250 788 123 456'), '0788123456');
  assert.equal(normalizeRwandaPhone('250788123456'), '0788123456');
  assert.equal(normalizeRwandaPhone('00250788123456'), '0788123456');
});

test('normalizeRwandaPhone accepts a missing leading zero', () => {
  assert.equal(normalizeRwandaPhone('788123456'), '0788123456');
});

test('normalizeRwandaPhone returns an empty string for blank input', () => {
  assert.equal(normalizeRwandaPhone(''), '');
  assert.equal(normalizeRwandaPhone(null), '');
  assert.equal(normalizeRwandaPhone(undefined), '');
  assert.equal(normalizeRwandaPhone('abc'), '');
});

test('isValidRwandaPhone accepts MTN and Airtel mobile numbers', () => {
  assert.equal(isValidRwandaPhone('0788123456'), true);
  assert.equal(isValidRwandaPhone('0798123456'), true);
  assert.equal(isValidRwandaPhone('0728123456'), true);
  assert.equal(isValidRwandaPhone('0738123456'), true);
  assert.equal(isValidRwandaPhone('+250 788 123 456'), true);
});

test('isValidRwandaPhone rejects wrong prefixes and lengths', () => {
  assert.equal(isValidRwandaPhone('0708123456'), false);
  assert.equal(isValidRwandaPhone('078812345'), false);
  assert.equal(isValidRwandaPhone('07881234567'), false);
  assert.equal(isValidRwandaPhone(''), false);
  assert.equal(isValidRwandaPhone('not-a-phone'), false);
});
