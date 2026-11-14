const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const ACCESS_COOKIE = 'nmo_access';
const REFRESH_COOKIE = 'nmo_refresh';
const CSRF_COOKIE = 'nmo_csrf';
const ACCESS_TTL = process.env.AUTH_ACCESS_TTL || '15m';
const REFRESH_TTL_DAYS = Number.parseInt(process.env.AUTH_REFRESH_TTL_DAYS || '30', 10);
const REFRESH_MAX_AGE = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;

function cookieConfig() {
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
  const secure = process.env.AUTH_COOKIE_SECURE === 'true' || sameSite === 'none' || process.env.NODE_ENV === 'production';
  return { secure, sameSite: ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : 'lax' };
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, item) => {
    const index = item.indexOf('=');
    if (index === -1) return cookies;
    const name = item.slice(0, index).trim();
    if (!name) return cookies;
    try {
      cookies[name] = decodeURIComponent(item.slice(index + 1).trim());
    } catch {
      cookies[name] = item.slice(index + 1).trim();
    }
    return cookies;
  }, {});
}

function claimsFor(user) {
  return {
    id: user.id,
    name: user.name || user.username || user.email,
    email: user.email,
    username: user.username,
    phone: user.phone,
    photo_url: user.photo_url || null,
    coins: Number(user.coins || 0),
    services: user.services,
    role: user.role,
    is_staff: user.is_staff === true,
    executive_role: user.executive_role || null,
  };
}

function signAccessToken(claims, sessionId) {
  return jwt.sign({ ...claims, sid: sessionId, typ: 'access' }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function setCookies(res, accessToken, refreshToken, csrfToken) {
  const options = cookieConfig();
  res.cookie(ACCESS_COOKIE, accessToken, { ...options, httpOnly: true, path: '/api', maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...options, httpOnly: true, path: '/api/auth/session', maxAge: REFRESH_MAX_AGE });
  res.cookie(CSRF_COOKIE, csrfToken, { ...options, httpOnly: false, path: '/', maxAge: REFRESH_MAX_AGE });
}

async function createSession(res, user) {
  const claims = claimsFor(user);
  const sessionId = crypto.randomUUID();
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + REFRESH_MAX_AGE);
  await pool.query(
    'INSERT INTO auth_sessions (id, refresh_token_hash, claims, expires_at) VALUES (?, ?, ?, ?)',
    [sessionId, hash(refreshToken), JSON.stringify(claims), expiresAt]
  );
  const accessToken = signAccessToken(claims, sessionId);
  setCookies(res, accessToken, refreshToken, csrfToken);
  return accessToken;
}

async function refreshSession(req, res) {
  const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE];
  if (!refreshToken) return null;
  const [rows] = await pool.query(
    'SELECT id, claims FROM auth_sessions WHERE refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
    [hash(refreshToken)]
  );
  if (!rows.length) return null;

  const session = rows[0];
  const nextRefreshToken = crypto.randomBytes(48).toString('base64url');
  const nextCsrfToken = crypto.randomBytes(32).toString('base64url');
  const [result] = await pool.query(
    'UPDATE auth_sessions SET refresh_token_hash = ?, last_used_at = NOW() WHERE id = ? AND refresh_token_hash = ? AND revoked_at IS NULL',
    [hash(nextRefreshToken), session.id, hash(refreshToken)]
  );
  if (result.affectedRows !== 1) return null;

  const claims = typeof session.claims === 'string' ? JSON.parse(session.claims) : session.claims;
  const accessToken = signAccessToken(claims, session.id);
  setCookies(res, accessToken, nextRefreshToken, nextCsrfToken);
  return { accessToken, claims };
}

async function revokeSession(req) {
  const refreshToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE];
  if (refreshToken) {
    await pool.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE refresh_token_hash = ? AND revoked_at IS NULL', [hash(refreshToken)]);
  }
}

function clearSessionCookies(res) {
  const options = cookieConfig();
  res.clearCookie(ACCESS_COOKIE, { ...options, httpOnly: true, path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...options, httpOnly: true, path: '/api/auth/session' });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false, path: '/' });
}

async function validateCookieAccess(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.typ !== 'access' || !decoded.sid) throw new Error('Invalid access token');
  const [rows] = await pool.query('SELECT id FROM auth_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1', [decoded.sid]);
  if (!rows.length) throw new Error('Session expired');
  return decoded;
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  CSRF_COOKIE,
  createSession,
  refreshSession,
  revokeSession,
  clearSessionCookies,
  parseCookies,
  validateCookieAccess,
};
