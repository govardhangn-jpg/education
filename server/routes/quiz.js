import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { protect } from '../middleware/auth.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/quiz/generate — generate quiz questions using AI
router.post('/generate', protect, async (req, res) => {
  try {
    const { subject, grade, syllabus, chapter, topic, difficulty = 'medium', count = 5, language = 'English' } = req.body;
    if (!subject || !grade || !chapter) return res.status(400).json({ error: 'Subject, grade, and chapter required' });

    const prompt = `Generate exactly ${count} multiple choice questions for:
- Grade: ${grade}
- Syllabus: ${syllabus}
- Subject: ${subject}
- Chapter: ${chapter}
${topic ? `- Topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Language: ${language}

Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Rules:
- Questions must be age-appropriate for ${grade} students
- Use Indian context and examples where relevant
- correctIndex is 0-3 (index of correct option in options array)
- Make distractors plausible but clearly wrong
- Explanation should be educational and encouraging
- If language is Kannada/Hindi/Telugu/Tamil, write in that language`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content[0].text.trim();
    // Strip any markdown fences
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const questions = JSON.parse(text);

    res.json({ questions, chapter, subject, grade, syllabus, difficulty });
  } catch (err) {
    console.error('Quiz generate error:', err);
    res.status(500).json({ error: 'Failed to generate quiz: ' + err.message });
  }
});

// POST /api/quiz/submit — submit quiz answers
router.post('/submit', protect, async (req, res) => {
  try {
    const { subject, grade, syllabus, chapter, topic, difficulty, questions, answers, timeTaken } = req.body;
    // answers is array of selected option indices
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

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalQuizzesTaken: 1, totalQuizScore: score },
    });

    // Check for achievements
    const userStats = await User.findById(req.user._id);
    const newAchievements = [];
    if (score === 100 && !userStats.achievements.find(a => a.name === 'Perfect Score')) {
      newAchievements.push({ name: 'Perfect Score', icon: '🏆', earnedAt: new Date() });
    }
    if (userStats.totalQuizzesTaken === 1) newAchievements.push({ name: 'First Quiz', icon: '🎯', earnedAt: new Date() });
    if (userStats.totalQuizzesTaken === 10) newAchievements.push({ name: 'Quiz Master', icon: '🌟', earnedAt: new Date() });
    if (newAchievements.length > 0) {
      await User.findByIdAndUpdate(req.user._id, { $push: { achievements: { $each: newAchievements } } });
    }

    res.json({ attempt, score, correct, total: questions.length, newAchievements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz/history — user's quiz history
router.get('/history', protect, async (req, res) => {
  try {
    const { subject, chapter, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    if (subject) query.subject = subject;
    if (chapter) query.chapter = chapter;
    const attempts = await QuizAttempt.find(query).sort({ completedAt: -1 }).limit(parseInt(limit));
    const stats = {
      total: attempts.length,
      avgScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0,
      bestScore: attempts.length ? Math.max(...attempts.map(a => a.score)) : 0,
      subjects: [...new Set(attempts.map(a => a.subject))],
    };
    res.json({ attempts, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quiz/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const { grade, subject } = req.query;
    const match = {};
    if (grade) match.grade = grade;
    if (subject) match.subject = subject;
    const top = await QuizAttempt.aggregate([
      { $match: match },
      { $group: { _id: '$userId', avgScore: { $avg: '$score' }, totalQuizzes: { $sum: 1 }, bestScore: { $max: '$score' } } },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.grade': 1, 'user.avatar': 1, avgScore: { $round: ['$avgScore', 1] }, totalQuizzes: 1, bestScore: 1 } }
    ]);
    res.json({ leaderboard: top });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
