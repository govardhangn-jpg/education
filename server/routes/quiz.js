import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { protect } from '../middleware/auth.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { CURRICULUM, SUBJECTS_BY_GRADE } from '../data/curriculum.js';

// Load .env explicitly (same pattern as chat.js — handles spaces in path)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

// Create Anthropic client per-request so key is always fresh
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured in server/.env');
  return new Anthropic({ apiKey: key });
}

// Helper: resolve correct CURRICULUM lookup keys for exam modes
function resolveCurriculum(grade, syllabus) {
  const isExam = grade === 'NEET Preparation' || grade === 'KCET Preparation';
  if (isExam) {
    const examKey = grade === 'NEET Preparation' ? 'NEET' : 'KCET';
    return { lookupSyllabus: examKey, lookupGrade: grade };
  }
  return { lookupSyllabus: syllabus, lookupGrade: grade };
}

// Helper: pick a random chapter when none is specified
function resolveChapter(chapter, grade, syllabus, subject) {
  if (chapter && chapter.trim()) return chapter.trim();
  const { lookupSyllabus, lookupGrade } = resolveCurriculum(grade, syllabus);
  const chapters = CURRICULUM[lookupSyllabus]?.[lookupGrade]?.[subject] || [];
  if (!chapters.length) return subject; // fallback to subject name
  return chapters[Math.floor(Math.random() * chapters.length)];
}

// ─── POST /api/quiz/generate ──────────────────────────────────────
router.post('/generate', protect, async (req, res) => {
  try {
    const {
      subject, grade, syllabus, chapter, topic,
      difficulty = 'medium', count = 5, language = 'English',
    } = req.body;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    // chapter is now OPTIONAL — pick randomly if empty
    const resolvedChapter = resolveChapter(chapter, grade, syllabus, subject);

    const isExam    = grade === 'NEET Preparation' || grade === 'KCET Preparation';
    const examLabel = grade === 'NEET Preparation' ? 'NEET UG' : 'Karnataka CET (KCET)';

    const examContext = isExam
      ? `This is an entrance exam preparation quiz for ${examLabel}.
- Questions should match actual ${examLabel} MCQ style
- Include numerical/application-based questions where appropriate
- Distractors should be common misconceptions seen in competitive exams`
      : `This is a school curriculum quiz for ${grade} ${syllabus} students.
- Questions should be age-appropriate and curriculum-aligned
- Use simple, clear language suitable for school students`;

    const prompt = `Generate exactly ${count} multiple choice questions for:
- Grade / Exam: ${grade}
- Syllabus / Board: ${syllabus}
- Subject: ${subject}
- Chapter / Topic: ${resolvedChapter}${topic ? `\n- Specific topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Language: ${language}

${examContext}

Return ONLY a valid JSON array (no markdown, no explanation, no preamble) with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Rules:
- correctIndex is 0–3 (zero-based index of the correct option)
- All 4 options must be distinct and plausible
- Explanation must be educational and mention the key concept
- If language is Kannada/Hindi/Telugu/Tamil, write questions and options in that language
- DO NOT wrap output in markdown code fences`;

    const anthropic = getClient();
    const response  = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content[0].text.trim();
    // Strip any accidental markdown fences
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (parseErr) {
      console.error('[quiz] JSON parse failed. Raw response:\n', text.slice(0, 500));
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'AI returned empty quiz. Please try again.' });
    }

    res.json({ questions, chapter: resolvedChapter, subject, grade, syllabus, difficulty });
  } catch (err) {
    console.error('[quiz] generate error:', err.message);
    const userMsg = err.message.includes('ANTHROPIC_API_KEY')
      ? err.message
      : err.status === 401 ? 'Invalid Anthropic API key.'
      : err.status === 429 ? 'Rate limit reached. Please wait a moment and try again.'
      : 'Failed to generate quiz: ' + err.message;
    res.status(500).json({ error: userMsg });
  }
});

// ─── POST /api/quiz/submit ────────────────────────────────────────
router.post('/submit', protect, async (req, res) => {
  try {
    const { subject, grade, syllabus, chapter, topic, difficulty, questions, answers, timeTaken } = req.body;

    let correct = 0;
    const processedAnswers = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctIndex;
      if (isCorrect) correct++;
      return {
        questionIndex: i, question: q.question, options: q.options,
        selectedOption: answers[i], correctOption: q.correctIndex,
        isCorrect, explanation: q.explanation,
      };
    });
    const score = Math.round((correct / questions.length) * 100);

    const attempt = await QuizAttempt.create({
      userId: req.user._id, grade, syllabus, subject, chapter, topic,
      difficulty, totalQuestions: questions.length, correctAnswers: correct,
      score, timeTaken, answers: processedAnswers,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalQuizzesTaken: 1, totalQuizScore: score },
    });

    // Achievements
    const userStats = await User.findById(req.user._id);
    const newAchievements = [];
    if (score === 100 && !userStats.achievements.find(a => a.name === 'Perfect Score'))
      newAchievements.push({ name: 'Perfect Score', icon: '🏆', earnedAt: new Date() });
    if (userStats.totalQuizzesTaken === 1)
      newAchievements.push({ name: 'First Quiz', icon: '🎯', earnedAt: new Date() });
    if (userStats.totalQuizzesTaken === 10)
      newAchievements.push({ name: 'Quiz Master', icon: '🌟', earnedAt: new Date() });
    if (newAchievements.length > 0)
      await User.findByIdAndUpdate(req.user._id, { $push: { achievements: { $each: newAchievements } } });

    res.json({ attempt, score, correct, total: questions.length, newAchievements });
  } catch (err) {
    console.error('[quiz] submit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/quiz/history ────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
  try {
    const { subject, chapter, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    const attempts = await QuizAttempt.find(query).sort({ completedAt: -1 }).limit(parseInt(limit));
    const stats = {
      total: attempts.length,
      avgScore:  attempts.length ? Math.round(attempts.reduce((s,a)=>s+a.score,0)/attempts.length) : 0,
      bestScore: attempts.length ? Math.max(...attempts.map(a=>a.score)) : 0,
      subjects:  [...new Set(attempts.map(a=>a.subject))],
    };
    res.json({ attempts, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/quiz/leaderboard ────────────────────────────────────
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { grade, subject } = req.query;
    const match = {};
    if (grade)   match.grade   = grade;
    if (subject) match.subject = subject;
    const top = await QuizAttempt.aggregate([
      { $match: match },
      { $group: { _id:'$userId', avgScore:{$avg:'$score'}, totalQuizzes:{$sum:1}, bestScore:{$max:'$score'} } },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $lookup: { from:'users', localField:'_id', foreignField:'_id', as:'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name':1,'user.grade':1,'user.avatar':1, avgScore:{$round:['$avgScore',1]}, totalQuizzes:1, bestScore:1 } },
    ]);
    res.json({ leaderboard: top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
