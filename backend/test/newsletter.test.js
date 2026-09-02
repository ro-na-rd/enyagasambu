'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { normalizeEmail, toSource } = require('../src/utils/newsletterValidation');

test('normalizeEmail trims and lowercases a valid address', () => {
  assert.strictEqual(normalizeEmail('  User@Example.COM '), 'user@example.com');
});

test('normalizeEmail returns null for invalid addresses', () => {
  for (const bad of ['', '   ', 'not-an-email', 'a@b', 'a b@c.com', '@x.com', 'a@', 123, null, undefined]) {
    assert.strictEqual(normalizeEmail(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

test('toSource falls back to "footer" and caps length', () => {
  assert.strictEqual(toSource(undefined), 'footer');
  assert.strictEqual(toSource(''), 'footer');
  assert.strictEqual(toSource('  Landing Page  '), 'landing page');
  assert.strictEqual(toSource('x'.repeat(100)).length, 50);
});
