import express from 'express';
import { protect } from '../middleware/auth.js';
import { CURRICULUM, SUBJECTS_BY_GRADE } from '../data/curriculum.js';
import User from '../models/User.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// GET /api/curriculum — get chapters for grade/syllabus/subject
router.get('/', protect, (req, res) => {
  const { grade, syllabus, subject } = req.query;
  if (!grade || !syllabus) return res.status(400).json({ error: 'Grade and syllabus required' });

  // Resolve the correct CURRICULUM top-level key for ALL course types
  const syllabusMap = {
    'NEET Preparation': 'NEET',
    'KCET Preparation': 'KCET',
    'NEET PG':          'NEET PG',
    'IIT-JEE':          'IIT-JEE',
  };
  let lookupSyllabus = syllabusMap[grade] || syllabus;
  if (['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'].includes(grade)) lookupSyllabus = 'LLB';
  if (grade.startsWith('UPSC') || grade.startsWith('Optional –')) lookupSyllabus = 'UPSC';
  if (/^(MBBS|BDS|B\.Pharm|BSc Nursing|BMLT|BPT|BOT)/.test(grade)) lookupSyllabus = 'RGUHS';

  if (subject) {
    const chapters = CURRICULUM[lookupSyllabus]?.[grade]?.[subject] || [];
    return res.json({ chapters, subject, grade, syllabus });
  }
  const subjects = SUBJECTS_BY_GRADE[grade] || [];
  const curriculum = {};
  subjects.forEach(sub => { curriculum[sub] = CURRICULUM[lookupSyllabus]?.[grade]?.[sub] || []; });
  res.json({ curriculum, grade, syllabus, subjects });
});

// GET /api/curriculum/progress — student's progress per chapter
router.get('/progress', protect, async (req, res) => {
  try {
    const { grade, syllabus } = req.query;
    const g = grade || req.user.grade;
    const s = syllabus || req.user.syllabus;
    const subjects = SUBJECTS_BY_GRADE[g] || [];

    // Resolve correct CURRICULUM top-level key for ALL course types
    const syllabusMap = {
      'NEET Preparation': 'NEET',
      'KCET Preparation': 'KCET',
      'NEET PG':          'NEET PG',
      'IIT-JEE':          'IIT-JEE',
    };
    let lookupSyllabus = syllabusMap[g] || s;
    // LLB grades
    if (['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'].includes(g)) lookupSyllabus = 'LLB';
    // UPSC grades
    if (g.startsWith('UPSC') || g.startsWith('Optional –')) lookupSyllabus = 'UPSC';
    // RGUHS grades (MBBS, BDS, B.Pharm, BSc Nursing, BMLT, BPT, BOT)
    if (/^(MBBS|BDS|B\.Pharm|BSc Nursing|BMLT|BPT|BOT)/.test(g)) lookupSyllabus = 'RGUHS';

    const attempts    = await QuizAttempt.find({ userId: req.user._id, grade: g });
    const chatSessions = await ChatSession.find({ userId: req.user._id, grade: g });

    const progress = {};
    subjects.forEach(sub => {
      const chapters = CURRICULUM[lookupSyllabus]?.[g]?.[sub] || [];
      progress[sub] = chapters.map(ch => {
        const chAttempts = attempts.filter(a => a.subject === sub && a.chapter === ch);
        const chSessions = chatSessions.filter(cs => cs.subject === sub && cs.chapter === ch);
        const bestScore = chAttempts.length ? Math.max(...chAttempts.map(a => a.score)) : null;
        return {
          chapter: ch,
          quizzesTaken: chAttempts.length,
          bestScore,
          chatSessions: chSessions.length,
          status: bestScore !== null ? (bestScore >= 80 ? 'mastered' : bestScore >= 50 ? 'learning' : 'needs-review') : (chSessions.length > 0 ? 'started' : 'not-started'),
        };
      });
    });
    res.json({ progress, grade: g, syllabus: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/curriculum/dashboard — full student dashboard stats
router.get('/dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const recentQuizzes = await QuizAttempt.find({ userId: req.user._id }).sort({ completedAt: -1 }).limit(5);
    const recentSessions = await ChatSession.find({ userId: req.user._id }).sort({ lastActivity: -1 }).limit(5).select('-messages');
    const totalMessages = await ChatSession.aggregate([
      { $match: { userId: req.user._id } },
      { $project: { count: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);
    const quizStats = await QuizAttempt.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$subject', avgScore: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);
    res.json({
      user, recentQuizzes, recentSessions,
      totalMessages: totalMessages[0]?.total || 0,
      quizStats,
      achievements: user.achievements,
      streakDays: user.streakDays,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
