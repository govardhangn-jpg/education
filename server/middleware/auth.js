// server/middleware/auth.js
import jwt     from 'jsonwebtoken';
import User    from '../models/User.js';
import Session from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'samarthaa-secret-change-in-prod';

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

    // Validate session exists in DB (enables revocation across devices)
    const tokenId = decoded.jti;
    if (tokenId) {
      const session = await Session.findOne({ tokenId, userId: decoded.id });
      if (!session) {
        return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
      }
      // Update lastSeen periodically (not on every request — throttle to every 5 min)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (!session.lastSeen || session.lastSeen < fiveMinAgo) {
        session.lastSeen = new Date();
        await session.save();
      }
      req.tokenId = tokenId;
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or account disabled.' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth middleware]', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
