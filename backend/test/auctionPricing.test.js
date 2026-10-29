const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_DURATIONS,
  DEFAULT_DURATION,
  parseDurationPrices,
  resolveAuctionDuration,
  computeAuctionWindow,
} = require('../src/services/auctionPricing');

test('parseDurationPrices maps setting rows to a day/price table', () => {
  const prices = parseDurationPrices([
    { setting_key: 'listing_duration_3_days', setting_value: '500' },
    { setting_key: 'listing_duration_7_days', setting_value: '1000' },
  ]);
  assert.deepEqual(prices, { 3: 500, 7: 1000 });
});

test('parseDurationPrices ignores malformed rows and falls back when empty', () => {
  assert.deepEqual(parseDurationPrices([]), DEFAULT_DURATIONS);
  assert.deepEqual(parseDurationPrices(null), DEFAULT_DURATIONS);
  assert.deepEqual(
    parseDurationPrices([
      { setting_key: 'listing_duration_days', setting_value: '10' },
      { setting_key: 'listing_duration_5_days', setting_value: 'abc' },
      { setting_key: 'other', setting_value: '1' },
    ]),
    DEFAULT_DURATIONS,
  );
});

test('resolveAuctionDuration honours a valid requested duration', () => {
  assert.deepEqual(resolveAuctionDuration(30, { 3: 500, 7: 1000, 30: 3500 }), {
    duration_days: 30,
    amount_rwf: 3500,
  });
});

test('resolveAuctionDuration accepts a numeric string', () => {
  assert.deepEqual(resolveAuctionDuration('7', { 3: 500, 7: 1000 }), {
    duration_days: 7,
    amount_rwf: 1000,
  });
});

test('resolveAuctionDuration falls back to the default duration', () => {
  assert.deepEqual(resolveAuctionDuration(999, { 3: 500, 7: 1000, 30: 3500 }), {
    duration_days: DEFAULT_DURATION,
    amount_rwf: 1000,
  });
  assert.deepEqual(resolveAuctionDuration(undefined, { 3: 500, 7: 1000, 30: 3500 }), {
    duration_days: 7,
    amount_rwf: 1000,
  });
});

test('computeAuctionWindow spans the requested number of days', () => {
  const now = new Date('2026-01-01T00:00:00.000Z').getTime();
  const { auction_start, expires_at } = computeAuctionWindow(3, now);
  assert.equal(auction_start.getTime(), now);
  assert.equal(expires_at.getTime(), now + 3 * 24 * 60 * 60 * 1000);
});

test('computeAuctionWindow defaults invalid durations', () => {
  const now = new Date('2026-01-01T00:00:00.000Z').getTime();
  const { expires_at } = computeAuctionWindow(0, now);
  assert.equal(expires_at.getTime(), now + DEFAULT_DURATION * 24 * 60 * 60 * 1000);
});
