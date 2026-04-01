/**
 * ─────────────────────────────────────────────────────────────
 *  Auth & RBAC Middleware — Shared across all route modules
 *  Extracted from routes/auth.js following API design principles:
 *  "Stateless auth, role-based access, consistent error format"
 * ─────────────────────────────────────────────────────────────
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartpark_fallback_secret_2026';

/**
 * Generate a signed JWT for a user.
 * Payload: { id, email, role, name }
 * Expiry: 7 days
 */
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Middleware: Verify JWT from Authorization header.
 * Attaches decoded payload to req.user on success.
 *
 * Returns 401 with structured error on failure.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      error:   'Unauthorized',
      message: 'No token provided. Include Authorization: Bearer <token>.',
      path:    req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      error:   'Unauthorized',
      message: 'Invalid or expired token.',
      path:    req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware: Optional JWT — does NOT reject unauthenticated requests.
 * If a valid token is present, attaches req.user. Otherwise proceeds without.
 * Useful for endpoints with mixed public/authenticated behavior.
 */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch {
      // Silently ignore — user remains unauthenticated
    }
  }
  next();
}

/**
 * Middleware factory: Restrict access to specific roles.
 * Must be used AFTER authMiddleware.
 *
 * Usage: requireRole('admin', 'service_provider')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error:   'Unauthorized',
        message: 'Authentication required.',
        path:    req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error:   'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
        path:    req.originalUrl,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
}

module.exports = { signToken, authMiddleware, optionalAuth, requireRole, JWT_SECRET };
