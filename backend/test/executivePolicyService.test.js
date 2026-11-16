const test = require('node:test');
const assert = require('node:assert/strict');

const {
  canManageStaff,
  canPostMarketplaceListingForFree,
  normalizeExecutiveRole,
} = require('../src/services/executivePolicyService');

test('normalizes legacy CIO executive role to CTO', () => {
  assert.equal(normalizeExecutiveRole('cio'), 'CTO');
  assert.equal(normalizeExecutiveRole(' CTO '), 'CTO');
});

test('only CEO, CTO, and COO executives can create staff accounts', () => {
  for (const executive_role of ['CEO', 'CTO', 'CIO', 'COO']) {
    assert.equal(canManageStaff({ is_staff: true, executive_role }), true);
  }
  for (const executive_role of ['CMO', 'CFO', null]) {
    assert.equal(canManageStaff({ is_staff: true, executive_role }), false);
  }
  assert.equal(canManageStaff({ role: 'admin', executive_role: 'CEO' }), false);
});

test('admins and all executive roles can post marketplace listings for free', () => {
  assert.equal(canPostMarketplaceListingForFree({ role: 'admin' }), true);
  for (const executive_role of ['CEO', 'CTO', 'CIO', 'COO', 'CMO', 'CFO']) {
    assert.equal(canPostMarketplaceListingForFree({ is_staff: true, executive_role }), true);
  }
  assert.equal(canPostMarketplaceListingForFree({ is_staff: true, executive_role: 'other' }), false);
});
