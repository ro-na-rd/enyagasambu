const { refreshSession, revokeSession, clearSessionCookies } = require('../services/authSessionService');

exports.current = (req, res) => {
  if (!req.user) return res.json({ user: null });
  const { sid, typ, iat, exp, ...user } = req.user;
  return res.json({ user });
};

exports.refresh = async (req, res) => {
  try {
    const session = await refreshSession(req, res);
    if (!session) {
      clearSessionCookies(res);
      return res.status(401).json({ message: 'Session expired', code: 'SESSION_EXPIRED' });
    }
    return res.json({ user: session.claims });
  } catch {
    clearSessionCookies(res);
    return res.status(401).json({ message: 'Session expired', code: 'SESSION_EXPIRED' });
  }
};

exports.logout = async (req, res) => {
  try {
    await revokeSession(req);
  } catch {
    // The session is cleared client-side even if it was already absent or expired.
  }
  clearSessionCookies(res);
  return res.status(204).end();
};
