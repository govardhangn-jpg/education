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

    // Language flags — calculated early so prompts can use them
    const isRegionalLang = !['English'].includes(language);
    const includeOptionExplanations = !(isRegionalLang && count > 8);

    // ── Classify the course for context-aware prompts ────────────────────
    const EXAM_GRADES   = ['NEET Preparation','KCET Preparation','NEET PG','IIT-JEE'];
    const UPSC_LIST     = ['UPSC Prelims','UPSC Mains – GS','UPSC Mains – Essay',
      'Optional – History','Optional – Geography','Optional – Political Science & IR',
      'Optional – Public Administration','Optional – Sociology','Optional – Philosophy',
      'Optional – Economics','Optional – Anthropology','Optional – Psychology',
      'Optional – Law','Optional – Mathematics'];
    const LLB_LIST      = ['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'];
    const isExamGrade   = EXAM_GRADES.includes(grade);
    const isUPSCGrade   = UPSC_LIST.includes(grade);
    const isUPSCMains   = isUPSCGrade && grade !== 'UPSC Prelims';
    const isLLBGrade    = LLB_LIST.includes(grade);
    const isRGUHSGrade  = !isExamGrade && !isUPSCGrade && !isLLBGrade &&
      !['CBSE','ICSE','Karnataka State'].includes(syllabus) && syllabus !== 'NEET' &&
      syllabus !== 'KCET' && syllabus !== 'IIT-JEE';
    const isSchool      = !isExamGrade && !isUPSCGrade && !isLLBGrade && !isRGUHSGrade;

    // Course-specific context for prompts
    const courseCtx = isExamGrade
      ? `Entrance exam: ${grade}. Questions must match actual exam MCQ style with precise scientific accuracy.`
      : isUPSCGrade
        ? `UPSC Civil Services (${grade}). Questions must match UPSC exam pattern. Use UPSC answer-writing standards.`
        : isLLBGrade
          ? `LLB (${grade}). Questions must test legal reasoning, case laws, sections and statutes.`
          : isRGUHSGrade
            ? `RGUHS Health Sciences (${grade}). Questions must follow clinical/medical education standards.`
            : `${grade} ${syllabus} school curriculum. Questions must be age-appropriate and board-exam aligned.`;

    // Descriptive mark schemes vary by course
    const shortMarks = isUPSCMains ? 10 : (isLLBGrade || isRGUHSGrade) ? 5 : 3;
    const longMarks  = isUPSCMains ? 15 : (isLLBGrade || isRGUHSGrade) ? 10 : 5;
    const extraLongMarks = isUPSCMains ? 20 : null;

    const shortDesc = isUPSCMains
      ? '10-mark answer (150 words): Introduction, 4-5 substantive points, conclusion'
      : isLLBGrade
        ? '5-mark legal answer: Issue, Rule, Application, Conclusion (IRAC format)'
        : isRGUHSGrade
          ? '5-mark clinical answer: Definition, aetiology/mechanism, features, management'
          : '3-mark short answer: 3-5 sentences covering key points';

    const longDesc = isUPSCMains
      ? '15-mark answer (250 words): Intro, multi-dimensional analysis, conclusion with way forward'
      : isLLBGrade
        ? '10-mark legal essay: Detailed IRAC, case law citations, statutory provisions'
        : isRGUHSGrade
          ? '10-mark essay: Full clinical presentation, investigations, treatment, complications'
          : '5-mark long answer: Structured paragraphs covering all marking points';

    // Build prompt based on question type
    let prompt;

    // ── Course-specific model answer structure ──────────────────────────
    const modelAnswerStructure = isUPSCMains
      ? `MANDATORY STRUCTURE:
1. INTRODUCTION (2-3 lines): Define the key term, give current context or data point, state relevance.
2. BODY — cover relevant dimensions with subheadings (use only those applicable):
   • Historical background & evolution
   • Constitutional / Legal provisions (Article numbers, Acts, amendments)
   • Social dimensions (impact on communities, gender, marginalised groups)
   • Economic dimensions (GDP, employment, growth data)
   • Political / Governance dimensions (policy failures, federalism)
   • Schemes & programmes (cite real scheme names and year launched)
   • Judicial pronouncements (landmark case names and year)
   • International / Comparative perspective
3. CONCLUSION (2-3 lines): Specific way forward (committee recommendation or policy), balanced statement, end with forward-looking quote or vision.
Use at least 2 real data points, 1 scheme, and 1 case or constitutional provision.`
      : isLLBGrade
        ? `MANDATORY STRUCTURE (IRAC):
1. ISSUE: State the precise legal question raised
2. RULE: Cite the specific Section/Article and legal principle verbatim
3. APPLICATION: Apply rule to facts — cite 2 landmark cases with year and court
4. CONCLUSION: Give the legal answer with reasoned justification`
        : isRGUHSGrade
          ? `MANDATORY STRUCTURE:
1. DEFINITION / CLASSIFICATION (with types/grades if applicable)
2. AETIOLOGY / RISK FACTORS / PATHOPHYSIOLOGY
3. CLINICAL FEATURES: Symptoms and Signs (tabulate if possible)
4. INVESTIGATIONS: Relevant tests with normal values
5. MANAGEMENT: Medical / Surgical / Nursing care with drug names and doses
6. COMPLICATIONS and PROGNOSIS`
          : `STRUCTURE: Clear introduction → core concept explanation → examples → conclusion.`;

    if (questionType === 'short') {
      const wl = isUPSCMains ? '150 words' : (isLLBGrade || isRGUHSGrade) ? '120 words' : '4-6 sentences';
      prompt = `Generate exactly ${count} short-answer questions.
Course: ${grade} | Syllabus: ${syllabus} | Subject: ${subject}
Topic: ${resolvedChapter}${topic ? ' — '+topic : ''} | Difficulty: ${difficulty} | Language: ${language}
Context: ${courseCtx}
${isRegionalLang ? `IMPORTANT: Write ALL content (questions, marking points, model answers) entirely in ${language} script.` : ''}

${modelAnswerStructure}
Model answer word limit: ${wl}

Return ONLY a valid JSON array — start with [ end with ]:
[{"question":"...","markingPoints":["point 1","point 2","point 3"],"modelAnswer":"Structured model answer following the mandatory structure above. Include real data, schemes, cases where applicable.","marks":${shortMarks}}]`;

    } else if (questionType === 'long') {
      const wl = isUPSCMains ? '250 words' : (isLLBGrade || isRGUHSGrade) ? '200 words' : '3-4 paragraphs';
      prompt = `Generate exactly ${count} long-answer questions.
Course: ${grade} | Syllabus: ${syllabus} | Subject: ${subject}
Topic: ${resolvedChapter}${topic ? ' — '+topic : ''} | Difficulty: ${difficulty} | Language: ${language}
Context: ${courseCtx}
${isRegionalLang ? `IMPORTANT: Write ALL content entirely in ${language} script.` : ''}

${modelAnswerStructure}
Model answer word limit: ${wl}

Return ONLY a valid JSON array — start with [ end with ]:
[{"question":"...","markingPoints":["intro with data","dimension 1","dimension 2","dimension 3","conclusion"],"modelAnswer":"Fully structured model answer following the mandatory structure. Cite real data, schemes, cases, articles.","marks":${longMarks},"hints":["How to write the introduction","Which dimensions to cover","How to structure the conclusion"]}]`;

    } else if (questionType === 'extralong' && isUPSCMains) {
      prompt = `Generate exactly ${count} 20-mark UPSC Mains questions.
Course: ${grade} | Subject: ${subject} | Topic: ${resolvedChapter} | Difficulty: ${difficulty}

${modelAnswerStructure}
Model answer word limit: 350 words

Return ONLY a valid JSON array — start with [ end with ]:
[{"question":"...","markingPoints":["intro with current data","historical evolution","constitutional provisions","social dimension","economic dimension","governance/political","global perspective","way forward with schemes"],"modelAnswer":"350-word fully structured answer covering all 8 dimensions. Cite: at least 3 data points, 2 schemes with year, 2 constitutional articles, 1 landmark judgment.","marks":20,"hints":["Open with definition + recent event/data","Cover 5-6 dimensions in separate paragraphs","Close with committee recommendation and quote"]}]`;

    } else {
    } else {
      // MCQ (default, and only option for entrance exams)
      const langNote = isRegionalLang
        ? `IMPORTANT: Write ALL content (questions, options, explanations) entirely in ${language} script.`
        : '';
      const optExplField = includeOptionExplanations ? `,
  "optionExplanations":["Option A: why correct/wrong","Option B: why wrong","Option C: why wrong","Option D: why wrong"]` : '';
      const optExplRule = includeOptionExplanations
        ? 'The optionExplanations array must have exactly 4 entries, each starting with the option letter, explaining why correct or why a distractor.'
        : '';

      prompt = `Generate exactly ${count} multiple choice questions.
Course: ${grade} | Syllabus: ${syllabus} | Subject: ${subject}
Topic: ${resolvedChapter}${topic ? ' — '+topic : ''} | Difficulty: ${difficulty} | Language: ${language}
Context: ${courseCtx}
${langNote}

Return ONLY a valid JSON array — start with [ and end with ]:
[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"2-3 sentences explaining why the correct answer is correct and the key concept it tests."${optExplField}}]
${optExplRule}`;
    }

    const anthropic = getClient();

    // Scale max_tokens properly for language and count
    // Regional languages tokenise ~1.8x less efficiently
    const langMultiplier = isRegionalLang ? 1.8 : 1.0;
    // Per question: question(50) + 4 options(80) + explanation(80) + optionExplanations(240)
    const tokensPerQ = Math.ceil(450 * langMultiplier);
    const maxTok = Math.min(8000, 500 + (count * tokensPerQ));

    // Raise timeout: regional languages take longer to generate
    // 60s base accounts for cold start; regional languages get more per-question time
    const timeoutMs = 60000 + (count * (isRegionalLang ? 5000 : 3000));
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
        optionExplanations: q.optionExplanations || [],
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
  const { question, studentAnswer, modelAnswer, markingPoints, marks, grade, subject, syllabus } = req.body;
  if (!question || !studentAnswer) return res.status(400).json({ error: 'question and studentAnswer required' });

  // Course-specific evaluator persona
  const UPSC_GRADES = ['UPSC Prelims','UPSC Mains – GS','UPSC Mains – Essay'];
  const LLB_GRADES  = ['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'];
  const isUPSC = UPSC_GRADES.includes(grade) || (grade||'').startsWith('Optional –');
  const isLLB  = LLB_GRADES.includes(grade);
  const isRGUHS = ['RGUHS','MBBS','BDS','B.Pharm','BSc Nursing','BMLT','BPT','BOT'].some(k => (grade||'').includes(k) || (syllabus||'').includes(k));

  const persona = isUPSC
    ? `You are a senior UPSC examiner who has evaluated thousands of IAS answer scripts.`
    : isLLB
      ? `You are a law professor evaluating an LLB student's answer using IRAC method.`
      : isRGUHS
        ? `You are an RGUHS examiner evaluating a health sciences student's clinical answer.`
        : `You are an experienced ${grade} ${subject} teacher evaluating a student's answer.`;

  const rubric = isUPSC
    ? 'Evaluate on: Content accuracy (40%), Structure & flow (25%), Analytical depth (20%), Language (15%). Provide UPSC-specific feedback.'
    : isLLB
      ? 'Evaluate on: Issue identification, Rule statement, Application, Conclusion, Case citations.'
      : isRGUHS
        ? 'Evaluate on: Clinical accuracy, Completeness, Investigations mentioned, Management protocol.'
        : 'Evaluate on: Conceptual accuracy, Coverage of marking points, Language clarity.';

  const prompt = `${persona}

QUESTION: ${question}
TOTAL MARKS: ${marks}
MARKING POINTS: ${(markingPoints||[]).join(' | ')}
MODEL ANSWER: ${modelAnswer}
STUDENT ANSWER: ${studentAnswer.slice(0,2000)}

${rubric}

Return ONLY valid JSON (no markdown):
{"score":N,"percentage":N,"feedback":"3 sentences of specific actionable feedback mentioning what was good and what was missing","pointsCovered":["specific point the student covered well"],"pointsMissed":["specific point the student missed"],"improvement":"one concrete suggestion to improve this answer","examinerNote":"one sentence as the examiner — what this answer tells you about the student's understanding"}`;

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


// ─── POST /api/quiz/evaluate-scan ────────────────────────────────────────────
// Evaluates a handwritten/scanned answer image using Claude Vision
router.post('/evaluate-scan', protect, async (req, res) => {
  const { question, modelAnswer, markingPoints, marks, grade, subject, syllabus, imageBase64, mediaType = 'image/jpeg' } = req.body;
  if (!question)    return res.status(400).json({ error: 'question is required' });
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });
  if (imageBase64.length > 7_000_000) return res.status(400).json({ error: 'Image too large. Use a file under 5MB.' });

  const UPSC_GRADES = ['UPSC Prelims','UPSC Mains – GS','UPSC Mains – Essay'];
  const LLB_GRADES  = ['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'];
  const isUPSC  = UPSC_GRADES.includes(grade) || (grade||'').startsWith('Optional –');
  const isLLB   = LLB_GRADES.includes(grade);
  const isRGUHS = ['RGUHS','MBBS','BDS'].some(k => (grade||'').includes(k) || (syllabus||'').includes(k));

  const persona = isUPSC ? 'You are a senior UPSC examiner who evaluates IAS answer scripts.'
    : isLLB   ? 'You are a law professor evaluating an LLB answer using IRAC method.'
    : isRGUHS ? 'You are an RGUHS examiner evaluating a health sciences answer.'
    :           `You are an experienced ${grade} ${subject} teacher.`;

  const rubric = isUPSC ? 'Evaluate on: Content accuracy (40%), Structure (25%), Analysis (20%), Language (15%).'
    : isLLB   ? 'Evaluate on: Issue, Rule, Application, Conclusion, Case citations.'
    : isRGUHS ? 'Evaluate on: Clinical accuracy, Completeness, Investigations, Management.'
    :           'Evaluate on: Conceptual accuracy, Coverage of marking points, Clarity.';

  const prompt = `${persona}

You are given an IMAGE of a student's handwritten answer. Your tasks:
1. Read and transcribe the handwritten text from the image
2. Evaluate it based on the question and marking scheme
3. Return JSON only

QUESTION: ${question}
TOTAL MARKS: ${marks || 5}
MARKING POINTS: ${(markingPoints||[]).join(' | ')}
MODEL ANSWER: ${modelAnswer || 'Not provided'}
${rubric}

Return ONLY valid JSON, no markdown:
{"transcribedText":"exact text read from handwriting","handwritingNote":"brief legibility note","score":N,"percentage":N,"feedback":"3 sentences of specific feedback","pointsCovered":["points covered"],"pointsMissed":["points missed"],"improvement":"one specific suggestion","examinerNote":"one sentence examiner observation","presentationNote":"note on handwriting and presentation"}`;

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    if (!res.headersSent) res.status(504).json({ error: 'Scan evaluation timed out. Try again.' });
  }, 60000);

  try {
    const anthropic = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imgType = ['image/jpeg','image/png','image/gif','image/webp'].includes(mediaType) ? mediaType : 'image/jpeg';

    let text = '';
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: imgType, data: base64Data } },
        { type: 'text', text: prompt },
      ]}],
    });
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') text += event.delta.text;
    }
    clearTimeout(timer);
    if (timedOut || res.headersSent) return;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'Could not parse evaluation. Try again.' });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    clearTimeout(timer);
    console.error('[evaluate-scan]', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Scan evaluation failed: ' + err.message });
  }
});

export default router;
