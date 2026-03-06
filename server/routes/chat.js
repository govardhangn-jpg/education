import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { protect } from '../middleware/auth.js';
import ChatSession from '../models/ChatSession.js';
import User from '../models/User.js';
import { CURRICULUM } from '../data/curriculum.js';

// Load .env explicitly using this file's directory — works even with spaces in path
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const router = express.Router();

// Create Anthropic client once at module load time (after dotenv)
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
console.log('[chat.js] ANTHROPIC_API_KEY:', ANTHROPIC_KEY ? ANTHROPIC_KEY.slice(0,16) + '...' : 'MISSING!');

if (!ANTHROPIC_KEY) {
  console.error('[chat.js] ERROR: ANTHROPIC_API_KEY not found. Chat will not work.');
}

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

function buildSystemPrompt(user, subject, grade, syllabus, chapter, language) {
  const chapters = CURRICULUM[syllabus]?.[grade]?.[subject] || [];
  const chapterContext = chapter
    ? `Current Chapter: ${chapter}`
    : `Available Chapters: ${chapters.slice(0, 10).join(', ')}${chapters.length > 10 ? '...' : ''}`;
  return `You are SamarthaaEdu, a warm, encouraging and highly knowledgeable AI tutor for Indian school students.

STUDENT INFO:
- Name: ${user.name}
- Grade: ${grade}
- Syllabus: ${syllabus}
- Subject: ${subject}
- ${chapterContext}
- Preferred Language: ${language}

YOUR ROLE:
- Teach ${grade} ${syllabus} ${subject} curriculum with depth and clarity
- Always respond in ${language} (use native script: ಕನ್ನಡ/हिंदी/తెలుగు/தமிழ் as appropriate)
- Be warm, patient, and encouraging
- Use real-life Indian examples: cricket, festivals, food, local geography
- Break down complex topics step by step
- Use analogies, stories, and mnemonics
- For Math: show step-by-step working
- For Science: use experiments and real-world examples
- For Languages: grammar rules with fun sentences
- For Social Studies: stories and historical context
- For Computer Science: simple analogies and practical examples
- Keep responses focused (3-5 paragraphs), use bullet points for clarity
- End with a question or encouragement

Always be SamarthaaEdu — a trusted, knowledgeable, and caring learning companion!`;
}

// POST /api/chat/message
router.post('/message', protect, async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured in server/.env — please add it and restart the server.' });
    }

    const { sessionId, message, subject, grade, syllabus, chapter, language } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user._id });
    }
    if (!session) {
      session = await ChatSession.create({
        userId: req.user._id,
        grade: grade || req.user.grade,
        syllabus: syllabus || req.user.syllabus,
        subject: subject || 'Mathematics',
        chapter,
        language: language || req.user.preferredLanguage,
        title: message.slice(0, 60),
      });
    }

    session.messages.push({ role: 'user', content: message });
    session.lastActivity = new Date();

    const recentMessages = session.messages.slice(-20).map(m => ({ role: m.role, content: m.content }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(
        req.user,
        subject || session.subject,
        grade || session.grade,
        syllabus || session.syllabus,
        chapter || session.chapter,
        language || session.language
      ),
      messages: recentMessages,
    });

    const reply = response.content[0].text;
    session.messages.push({ role: 'assistant', content: reply });
    await session.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalChatMessages: 2 },
      $addToSet: { subjectsStudied: subject || session.subject },
      lastActiveDate: new Date(),
    });

    res.json({ reply, sessionId: session._id, messageCount: session.messages.length });
  } catch (err) {
    console.error('=== CHAT ERROR ===', err.message);
    const userMsg = err.status === 401 ? 'Invalid Anthropic API key.'
      : err.status === 429 ? 'Rate limit reached. Please wait and try again.'
      : 'AI error: ' + err.message;
    res.status(500).json({ error: userMsg });
  }
});

// GET /api/chat/sessions
router.get('/sessions', protect, async (req, res) => {
  try {
    const { subject, limit = 20, page = 1 } = req.query;
    const query = { userId: req.user._id };
    if (subject) query.subject = subject;
    const sessions = await ChatSession.find(query)
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-messages');
    const total = await ChatSession.countDocuments(query);
    res.json({ sessions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
