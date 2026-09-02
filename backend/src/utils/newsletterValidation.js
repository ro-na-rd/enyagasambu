'use strict';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  if (typeof email !== 'string') return null;
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) return null;
  return value;
}

function toSource(source) {
  const s = (source || '').trim().toLowerCase();
  return s.length > 50 ? s.slice(0, 50) : (s || 'footer');
}

module.exports = { normalizeEmail, toSource, EMAIL_RE };
