import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, grade, syllabus, avatar, preferredLanguage } = req.body;
    if (!username || !password || !name || !grade || !syllabus) return res.status(400).json({ error: 'Missing required fields' });
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Username already taken' });
    const user = await User.create({ username, password, name, email, grade, syllabus, avatar: avatar || '🧑‍🎓', preferredLanguage: preferredLanguage || 'English' });
    const token = signToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ error: 'Account is deactivated' });
    user.lastLogin = new Date();
    user.loginCount += 1;
    // Update streak
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (lastActive === yesterday) user.streakDays += 1;
    else if (lastActive !== today) user.streakDays = 1;
    user.lastActiveDate = new Date();
    await user.save();
    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
});

// PATCH /api/auth/preferences
router.patch('/preferences', protect, async (req, res) => {
  try {
    const { preferredLanguage, grade, syllabus, avatar } = req.body;
    const update = {};
    if (preferredLanguage) update.preferredLanguage = preferredLanguage;
    if (grade) update.grade = grade;
    if (syllabus) update.syllabus = syllabus;
    if (avatar) update.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
