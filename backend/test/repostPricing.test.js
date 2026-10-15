const test = require('node:test');
const assert = require('node:assert/strict');
const { REPOST_COST, computeRepostPrice, isDiscountEligible } = require('../src/services/repostPricing');

test('computeRepostPrice returns the full price at 0%', () => {
  assert.deepEqual(computeRepostPrice(0), {
    baseCost: 400,
    discountPercent: 0,
    discountAmount: 0,
    amount: 400,
  });
});

test('computeRepostPrice applies the configured percentage', () => {
  const p = computeRepostPrice(25);
  assert.equal(p.discountAmount, 100);
  assert.equal(p.amount, 300);
});

test('computeRepostPrice rounds the discount to whole RWF', () => {
  const p = computeRepostPrice(33.3);
  assert.equal(p.discountAmount, 133);
  assert.equal(p.amount, 267);
});

test('computeRepostPrice clamps out-of-range and invalid percentages', () => {
  assert.equal(computeRepostPrice(150).amount, 0);
  assert.equal(computeRepostPrice(-10).amount, REPOST_COST);
  assert.equal(computeRepostPrice('abc').amount, REPOST_COST);
  assert.equal(computeRepostPrice(undefined).amount, REPOST_COST);
});

test('computeRepostPrice never charges below zero', () => {
  const p = computeRepostPrice(100);
  assert.equal(p.amount, 0);
  assert.ok(p.amount >= 0);
});

function listing(overrides) {
  const now = Date.now();
  return {
    status: 'sold',
    expires_at: new Date(now + 60 * 60 * 1000),
    sale_reported_at: null,
    ...overrides,
  };
}

test('isDiscountEligible accepts sold, unexpired, unreported listings', () => {
  assert.equal(isDiscountEligible(listing({})), true);
});

test('isDiscountEligible rejects non-sold listings', () => {
  assert.equal(isDiscountEligible(listing({ status: 'active' })), false);
  assert.equal(isDiscountEligible(listing({ status: 'expired' })), false);
  assert.equal(isDiscountEligible(listing({ status: 'deleted' })), false);
});

test('isDiscountEligible rejects expired listings', () => {
  assert.equal(isDiscountEligible(listing({ expires_at: new Date(Date.now() - 1000) })), false);
  assert.equal(isDiscountEligible(listing({ expires_at: null })), false);
});

test('isDiscountEligible rejects listings the owner already reported', () => {
  assert.equal(isDiscountEligible(listing({ sale_reported_at: new Date() })), false);
});

test('isDiscountEligible rejects missing listings', () => {
  assert.equal(isDiscountEligible(null), false);
  assert.equal(isDiscountEligible(undefined), false);
});
