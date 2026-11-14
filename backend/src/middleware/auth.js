const jwt = require('jsonwebtoken');
const { ACCESS_COOKIE, parseCookies, validateCookieAccess } = require('../services/authSessionService');

function bearerToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

const authenticate = async (req, res, next) => {
  const token = bearerToken(req);
  const cookieToken = parseCookies(req.headers.cookie)[ACCESS_COOKIE];
  if (!token && !cookieToken) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = token
      ? jwt.verify(token, process.env.JWT_SECRET)
      : await validateCookieAccess(cookieToken);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'moderator' && req.user?.role !== 'staff') {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
};

const requireBroker = (req, res, next) => {
  if (req.user?.role !== 'broker') {
    return res.status(403).json({ message: 'Broker access required' });
  }
  next();
};

const requireAmbassador = (req, res, next) => {
  if (req.user?.role !== 'ambassador') {
    return res.status(403).json({ message: 'Ambassador access required' });
  }
  next();
};

const requireSupplier = (req, res, next) => {
  if (req.user?.role !== 'supplier') {
    return res.status(403).json({ message: 'Supplier access required' });
  }
  next();
};

const authenticateOptional = async (req, res, next) => {
  const token = bearerToken(req);
  const cookieToken = parseCookies(req.headers.cookie)[ACCESS_COOKIE];
  if (!token && !cookieToken) {
    req.user = null;
    return next();
  }
  try {
    const decoded = token
      ? jwt.verify(token, process.env.JWT_SECRET)
      : await validateCookieAccess(cookieToken);
    req.user = decoded;
  } catch {
    req.user = null;
  }
  next();
};

const authenticatePhoneSeller = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'phone_seller') {
      return res.status(403).json({ message: 'Phone seller access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireExecutive = (req, res, next) => {
  if (!req.user || (req.user.role !== 'executive' && req.user.is_staff !== true)) {
    return res.status(403).json({ message: 'Executive access required' });
  }
  next();
};

const requireExecutiveRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.executive_role)) {
    return res.status(403).json({ message: 'Executive role not authorized' });
  }
  next();
};

const checkExecutivePermission = async (pool, executiveRole, module, action) => {
  const [rows] = await pool.query(
    'SELECT 1 FROM executive_permissions WHERE executive_role = ? AND module = ? AND action = ?',
    [executiveRole, module, action]
  );
  return rows.length > 0;
};

const logExecutiveAction = async (pool, staffId, executiveRole, action, module, recordId, previousValue, newValue, ipAddress, userAgent) => {
  await pool.query(
    'INSERT INTO executive_audit_log (staff_id, executive_role, action, module, record_id, previous_value, new_value, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [staffId, executiveRole, action, module, recordId, previousValue, newValue, ipAddress, userAgent]
  );
};

module.exports = { authenticate, authenticateOptional, authenticatePhoneSeller, requireAdmin, requireStaff, requireBroker, requireAmbassador, requireSupplier, requireExecutive, requireExecutiveRole, checkExecutivePermission, logExecutiveAction };
