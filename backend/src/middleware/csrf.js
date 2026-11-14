const { ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, parseCookies } = require('../services/authSessionService');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function requireCsrfForCookieSession(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookies = parseCookies(req.headers.cookie);
  if (!cookies[ACCESS_COOKIE] && !cookies[REFRESH_COOKIE]) return next();

  const token = req.get('x-csrf-token');
  if (!token || token !== cookies[CSRF_COOKIE]) {
    return res.status(403).json({ message: 'CSRF validation failed', code: 'CSRF_INVALID' });
  }
  return next();
}

module.exports = { requireCsrfForCookieSession };
