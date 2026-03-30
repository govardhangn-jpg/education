import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { protect } from '../middleware/auth.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { CURRICULUM } from '../data/curriculum.js';

// Load .env explicitly (same pattern as chat.js — handles spaces in path)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

// GET /api/quiz/health — quick check that API key is configured
router.get('/health', (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  res.json({
    ok: !!key,
    keyPrefix: key ? key.slice(0,16)+'...' : 'NOT SET',
    model: 'claude-sonnet-4-6',
  });
});

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
      questionType = 'mcq',  // 'mcq' | 'short' | 'long'
    } = req.body;

    if (!subject || !grade) {
      return res.status(400).json({ error: 'Subject and grade are required' });
    }

    // chapter is now OPTIONAL — pick randomly if empty
    const resolvedChapter = resolveChapter(chapter, grade, syllabus, subject);

    const isExam    = grade === 'NEET Preparation' || grade === 'KCET Preparation';
    const examLabel = grade === 'NEET Preparation' ? 'NEET UG' : 'Karnataka CET (KCET)';

    const examContext = isExam
      ? `This is an entrance exam preparation quiz for ${examLabel}.`
      : `This is a school curriculum quiz for ${grade} ${syllabus} students.`;

    // Build prompt based on question type
    let prompt;

    if (questionType === 'short') {
      prompt = `Generate exactly ${count} short-answer questions for:
- Grade / Exam: ${grade}
- Syllabus / Board: ${syllabus}
- Subject: ${subject}
- Chapter / Topic: ${resolvedChapter}${topic ? `\n- Specific topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Language: ${language}

${examContext}
- Questions should require 3–5 sentence answers (2–3 marks style)
- Suitable for board exam short-answer format
- Test conceptual understanding, not just recall

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "markingPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "modelAnswer": "A complete model answer in 3-5 sentences.",
    "marks": 3
  }
]
- DO NOT wrap in markdown code fences`;

    } else if (questionType === 'long') {
      prompt = `Generate exactly ${count} long-answer / essay questions for:
- Grade / Exam: ${grade}
- Syllabus / Board: ${syllabus}
- Subject: ${subject}
- Chapter / Topic: ${resolvedChapter}${topic ? `\n- Specific topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Language: ${language}

${examContext}
- Questions should require detailed paragraph answers (5–8 marks style)
- Include questions that ask to "explain", "describe", "compare", "discuss", or "analyse"
- Suitable for board exam long-answer / essay format

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "markingPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
    "modelAnswer": "A detailed model answer covering all key points in well-structured paragraphs.",
    "marks": 5,
    "hints": ["Hint 1 to structure the answer", "Hint 2"]
  }
]
- DO NOT wrap in markdown code fences`;

    } else {
      // Default: MCQ
      prompt = `Generate exactly ${count} multiple choice questions for:
- Grade / Exam: ${grade}
- Syllabus / Board: ${syllabus}
- Subject: ${subject}
- Chapter / Topic: ${resolvedChapter}${topic ? `\n- Specific topic: ${topic}` : ''}
- Difficulty: ${difficulty}
- Language: ${language}

${examContext}
- Questions should be age-appropriate and curriculum-aligned
- All 4 options must be distinct and plausible
- Include numerical/application questions where appropriate

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]
- DO NOT wrap in markdown code fences`;
    }

    const anthropic = getClient();

    // Scale max_tokens by question count (15Q needs ~4000 tokens)
    const maxTok = Math.min(4096, 800 + (count * 200));

    // Raise timeout based on question count — 15Q at hard difficulty can take ~60s
    const timeoutMs = 30000 + (count * 3000); // 30s base + 3s per question
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (!res.headersSent) res.status(504).json({ error: `Quiz generation timed out after ${Math.round(timeoutMs/1000)}s. Try fewer questions or try again.` });
    }, timeoutMs);

    // Use streaming so Render does not kill the idle connection
    let text = '';
    try {
      const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: maxTok,
        system: 'You are a quiz generator. Return ONLY valid JSON arrays. No explanations, no markdown, no preamble. Start your response with [ and end with ].',
        messages: [{ role: 'user', content: prompt }],
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          text += event.delta.text;
        }
      }
    } catch (streamErr) {
      clearTimeout(timer);
      if (!res.headersSent) {
        const msg = streamErr.status === 429 ? 'Rate limit reached. Please wait a moment.'
          : streamErr.status === 401 ? 'Invalid Anthropic API key.'
          : 'Failed to generate quiz: ' + streamErr.message;
        res.status(500).json({ error: msg });
      }
      return;
    }

    clearTimeout(timer);
    if (timedOut || res.headersSent) return;

    // Strip markdown fences
    text = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (parseErr) {
      console.error('[quiz] JSON parse failed. Raw:\n', text.slice(0, 500));
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(500).json({ error: 'AI returned empty quiz. Please try again.' });
    }

    res.json({ questions, chapter: resolvedChapter, subject, grade, syllabus, difficulty, questionType });
  } catch (err) {
    console.error('[quiz] generate error:', JSON.stringify({
      message: err.message,
      status: err.status,
      type: err.error?.type,
      detail: err.error?.error?.message || err.error?.message,
    }));
    if (!res.headersSent) {
      const userMsg = err.message?.includes('ANTHROPIC_API_KEY') ? err.message
        : err.status === 401 ? 'Invalid Anthropic API key — check Render env vars.'
        : err.status === 429 ? 'Rate limit reached. Please wait a moment.'
        : err.status === 529 ? 'Anthropic API overloaded. Please try again.'
        : err.status === 400 ? 'Bad request to AI: ' + (err.error?.error?.message || err.message)
        : 'Failed to generate quiz: ' + err.message;
      res.status(500).json({ error: userMsg });
    }
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


// ─── POST /api/quiz/evaluate-answer ─────────────────────────────────────────
router.post('/evaluate-answer', protect, async (req, res) => {
  const { question, studentAnswer, modelAnswer, markingPoints, marks, grade, subject } = req.body;
  if (!question || !studentAnswer) return res.status(400).json({ error: 'question and studentAnswer required' });

  const prompt = `You are a ${grade} ${subject} teacher evaluating a student's written answer.

QUESTION: ${question}
TOTAL MARKS: ${marks}
MARKING POINTS: ${(markingPoints||[]).join(' | ')}
MODEL ANSWER: ${modelAnswer}
STUDENT ANSWER: ${studentAnswer.slice(0,1500)}

Evaluate strictly. Return ONLY valid JSON (no markdown):
{"score":N,"percentage":N,"feedback":"2-3 sentences of specific feedback","pointsCovered":["point covered"],"pointsMissed":["point missed"],"improvement":"one specific suggestion"}`;

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    if (!res.headersSent) res.status(504).json({ error: 'Evaluation timed out. Please try again.' });
  }, 45000);

  try {
    const anthropic = getClient();
    let text = '';
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        text += event.delta.text;
      }
    }
    clearTimeout(timer);
    if (timedOut || res.headersSent) return;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse evaluation. Try again.' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    clearTimeout(timer);
    if (!res.headersSent) res.status(500).json({ error: 'Evaluation failed: ' + err.message });
  }
});

export default router;
