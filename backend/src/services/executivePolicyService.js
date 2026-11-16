const EXECUTIVE_ROLE_ALIASES = {
  CIO: 'CTO',
};

const STAFF_MANAGEMENT_EXECUTIVE_ROLES = new Set(['CEO', 'CTO', 'COO']);
const FREE_POSTING_EXECUTIVE_ROLES = new Set(['CEO', 'CTO', 'COO', 'CMO', 'CFO']);

function normalizeExecutiveRole(role) {
  const normalized = String(role || '').trim().toUpperCase();
  return EXECUTIVE_ROLE_ALIASES[normalized] || normalized;
}

function canManageStaff(user) {
  return user?.is_staff === true
    && STAFF_MANAGEMENT_EXECUTIVE_ROLES.has(normalizeExecutiveRole(user.executive_role));
}

function canPostMarketplaceListingForFree(user) {
  return user?.role === 'admin'
    || (user?.is_staff === true && FREE_POSTING_EXECUTIVE_ROLES.has(normalizeExecutiveRole(user.executive_role)));
}

module.exports = {
  canManageStaff,
  canPostMarketplaceListingForFree,
  normalizeExecutiveRole,
};
