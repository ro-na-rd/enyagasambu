'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { dayBuckets } = require('../src/controllers/analyticsController');

test('dayBuckets returns one bucket per calendar day inclusive', () => {
  const buckets = dayBuckets(new Date('2026-08-28T12:00:00Z'), new Date('2026-08-30T12:00:00Z'));
  assert.strictEqual(buckets.length, 3);
  assert.deepStrictEqual(buckets.map((b) => b.key), ['2026-08-28', '2026-08-29', '2026-08-30']);
});

test('dayBuckets normalizes to UTC calendar days regardless of time-of-day', () => {
  const buckets = dayBuckets(new Date('2026-08-01T23:59:00Z'), new Date('2026-08-01T23:59:00Z'));
  assert.strictEqual(buckets.length, 1);
  assert.strictEqual(buckets[0].key, '2026-08-01');
  assert.strictEqual(buckets[0].label, buckets[0].key);
});

test('dayBuckets handles multi-month ranges without dropping days', () => {
  const buckets = dayBuckets(new Date('2026-01-31'), new Date('2026-02-02'));
  assert.strictEqual(buckets.length, 3);
  assert.strictEqual(buckets[0].key, '2026-01-31');
  assert.strictEqual(buckets[2].key, '2026-02-02');
});