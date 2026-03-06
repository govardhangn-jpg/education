import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin', 'teacher'));

// GET /api/admin/students
router.get('/students', async (req, res) => {
  try {
    const { grade, syllabus, search, page = 1, limit = 20 } = req.query;
    const query = { role: 'student' };
    if (grade) query.grade = grade;
    if (syllabus) query.syllabus = syllabus;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }];
    const students = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ students, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/students/bulk — create multiple students
router.post('/students/bulk', requireRole('admin'), async (req, res) => {
  try {
    const { students } = req.body; // array of student objects
    const results = { created: [], errors: [] };
    for (const s of students) {
      try {
        const user = await User.create({ ...s, role: 'student' });
        results.created.push({ username: user.username, name: user.name });
      } catch (e) { results.errors.push({ username: s.username, error: e.message }); }
    }
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/students/:id/toggle — activate/deactivate
router.patch('/students/:id/toggle', requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Student not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ isActive: user.isActive });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/stats — overall platform stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeToday = await User.countDocuments({ lastActiveDate: { $gte: new Date(Date.now() - 86400000) } });
    const totalQuizzes = await QuizAttempt.countDocuments();
    const totalSessions = await ChatSession.countDocuments();
    const avgQuizScore = await QuizAttempt.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]);
    const gradeDistribution = await User.aggregate([{ $group: { _id: '$grade', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    const syllabusDistribution = await User.aggregate([{ $group: { _id: '$syllabus', count: { $sum: 1 } } }]);
    res.json({ totalStudents, activeToday, totalQuizzes, totalSessions, avgQuizScore: avgQuizScore[0]?.avg?.toFixed(1) || 0, gradeDistribution, syllabusDistribution });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
