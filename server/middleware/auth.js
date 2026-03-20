// server/middleware/auth.js
import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'samarthaa-secret-change-in-prod';

// Try to load Session model — only available after Session.js is deployed
let Session = null;
try {
  const mod = await import('../models/Session.js');
  Session = mod.default;
} catch {
  console.log('[auth] Session model not found — using JWT-only validation');
}

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
    } catch (e) {
      return res.status(401).json({ error: 'Token expired or invalid. Please log in again.' });
    }

    // If Session model available, validate session is still active
    if (Session && decoded.jti) {
      try {
        const session = await Session.findOne({ tokenId: decoded.jti, userId: decoded.id });
        if (!session) {
          return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
        }
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (!session.lastSeen || session.lastSeen < fiveMinAgo) {
          session.lastSeen = new Date();
          await session.save();
        }
        req.tokenId = decoded.jti;
      } catch {
        // Session lookup failed — allow through with JWT-only auth
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or account disabled.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth middleware]', err.message);
    res.status(500).json({ error: 'Authentication error' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Backwards compatibility alias
export const requireRole = requireAdmin;
