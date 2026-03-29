/**
 * server/middleware/auth.js
 * JWT verification + role-based access guard
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'reimburse_dev_secret';

/** Verify JWT, attach decoded payload to req.user */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET); // { id, email, role, companyId, name }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/** Only allow specified roles through */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { authenticate, requireRole, JWT_SECRET };
