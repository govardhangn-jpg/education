// server/routes/auth.js
import express    from 'express';
import crypto      from 'crypto';
import jwt        from 'jsonwebtoken';
import dotenv     from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join }  from 'path';
import { protect } from '../middleware/auth.js';
import User       from '../models/User.js';
import Session    from '../models/Session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'samarthaa-secret-change-in-prod';

// ── Token helpers ────────────────────────────────────────────────────────────

function signToken(userId, tokenId) {
  return jwt.sign(
    { id: userId, jti: tokenId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function getClientInfo(req) {
  const ua  = req.headers['user-agent'] || '';
  const ip  = req.ip || req.connection?.remoteAddress || '';
  const { deviceName, deviceType } = Session.parseDevice(ua, ip);
  return { ua, ip, deviceName, deviceType };
}

// ── POST /api/auth/register ──────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, grade, syllabus, avatar, preferredLanguage } = req.body;
    if (!username || !password || !name || !grade || !syllabus) {
      return res.status(400).json({ error: 'username, password, name, grade and syllabus are required' });
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const user = await User.create({ username, password, name, email, grade, syllabus, avatar, preferredLanguage });

    const tokenId = crypto.randomUUID();
    const token   = signToken(user._id, tokenId);
    const { ua, ip, deviceName, deviceType } = getClientInfo(req);

    await Session.create({
      userId: user._id, tokenId,
      deviceName, deviceType, ipAddress: ip, userAgent: ua,
    });

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), $inc: { loginCount: 1 } });

    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('[auth/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    if (!user.isActive) return res.status(403).json({ error: 'Account is disabled. Contact admin.' });

    const tokenId = crypto.randomUUID();
    const token   = signToken(user._id, tokenId);
    const { ua, ip, deviceName, deviceType } = getClientInfo(req);

    // Create new session record for this device
    await Session.create({
      userId: user._id, tokenId,
      deviceName, deviceType, ipAddress: ip, userAgent: ua,
    });

    // Keep only last 10 sessions per user (cleanup old ones)
    const sessions = await Session.find({ userId: user._id }).sort({ createdAt: -1 });
    if (sessions.length > 10) {
      const toDelete = sessions.slice(10).map(s => s._id);
      await Session.deleteMany({ _id: { $in: toDelete } });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date(), $inc: { loginCount: 1 } });

    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    console.error('[auth/login]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', protect, async (req, res) => {
  try {
    // Update lastSeen on this session
    if (req.tokenId) {
      await Session.findOneAndUpdate(
        { tokenId: req.tokenId },
        { lastSeen: new Date() }
      );
    }
    res.json({ user: req.user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
// Logs out current device only

router.post('/logout', protect, async (req, res) => {
  try {
    if (req.tokenId) {
      await Session.deleteOne({ tokenId: req.tokenId });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/sessions ───────────────────────────────────────────────────
// Returns all active sessions for the current user

router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id })
      .sort({ lastSeen: -1 })
      .select('tokenId deviceName deviceType ipAddress lastSeen createdAt');

    const result = sessions.map(s => ({
      id:         s._id,
      tokenId:    s.tokenId,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      ipAddress:  s.ipAddress,
      lastSeen:   s.lastSeen,
      createdAt:  s.createdAt,
      isCurrent:  s.tokenId === req.tokenId,
    }));

    res.json({ sessions: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/auth/sessions/:id ───────────────────────────────────────────
// Revoke a specific session (sign out a device)

router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await session.deleteOne();
    res.json({ message: 'Session revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/auth/sessions ────────────────────────────────────────────────
// Sign out ALL other devices (keep current session)

router.delete('/sessions', protect, async (req, res) => {
  try {
    await Session.deleteMany({
      userId:  req.user._id,
      tokenId: { $ne: req.tokenId }, // keep current session
    });
    res.json({ message: 'All other devices signed out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/auth/preferences ─────────────────────────────────────────────

router.patch('/preferences', protect, async (req, res) => {
  try {
    const { preferredLanguage, avatar } = req.body;
    const updates = {};
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
    if (avatar)            updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
