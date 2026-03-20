// server/middleware/auth.js
import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'samarthaa-secret-change-in-prod';

// Lazy Session loader — no top-level await, no startup crash
let Session = null;
let sessionLoadDone = false;
async function loadSession() {
  if (sessionLoadDone) return Session;
  sessionLoadDone = true;
  try {
    const mod = await import('../models/Session.js');
    Session = mod.default;
  } catch { /* Session.js not yet deployed — JWT-only mode is fine */ }
  return Session;
}

// ── protect — JWT + optional session validation ───────────────────────────
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const token = header.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Token expired or invalid. Please log in again.' });
    }

    if (decoded.jti) {
      const SM = await loadSession();
      if (SM) {
        try {
          const session = await SM.findOne({ tokenId: decoded.jti, userId: decoded.id });
          if (!session) return res.status(401).json({ error: 'Session revoked. Please log in again.' });
          const ago5 = new Date(Date.now() - 300000);
          if (!session.lastSeen || session.lastSeen < ago5) {
            session.lastSeen = new Date();
            await session.save();
          }
          req.tokenId = decoded.jti;
        } catch { /* session check failed — allow through */ }
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or disabled.' });
    req.user = user;
    next();
  } catch (err) {
    console.error('[auth]', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// ── requireRole — works BOTH as direct middleware AND as factory ───────────
// Usage 1 (direct):  router.use(protect, requireRole)
// Usage 2 (factory): router.use(protect, requireRole('admin'))
// Usage 3 (alias):   router.use(protect, requireAdmin)
export const requireRole = (reqOrRole, res, next) => {
  // Called as factory: requireRole('admin') — returns middleware function
  if (typeof reqOrRole === 'string') {
    return (req, res, next) => {
      if (!req.user || !['admin', 'teacher'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      next();
    };
  }
  // Called as direct middleware: requireRole(req, res, next)
  const req = reqOrRole;
  if (!req.user || !['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireAdmin = requireRole;
