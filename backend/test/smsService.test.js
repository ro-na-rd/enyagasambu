const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSmsPhone } = require('../src/services/smsService');

test('normalizeSmsPhone converts a local Rwandan number to E.164', () => {
  assert.equal(normalizeSmsPhone('078 123 4567'), '+250781234567');
});

test('normalizeSmsPhone preserves international Rwandan formats', () => {
  assert.equal(normalizeSmsPhone('+250 78 123 4567'), '+250781234567');
  assert.equal(normalizeSmsPhone('250781234567'), '+250781234567');
  assert.equal(normalizeSmsPhone('00250781234567'), '+250781234567');
});

test('normalizeSmsPhone rejects an empty phone number', () => {
  assert.throws(() => normalizeSmsPhone(''), /Phone number required/);
});
