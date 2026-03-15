/**
 * Life Skills Progress Routes
 * Stores the complete life skills journey for each user in MongoDB.
 * Every habit check-in, journal entry, profile detail, and streak
 * is persisted here so the app remembers where the user left off.
 */
import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── Helper: compute wellness score 0–100 ────────────────────────────────
// Weighted average of:
// - Profile completeness (10%)
// - Streak depth across modules (40%)
// - Journal engagement (20%)
// - Check-in consistency last 7 days (30%)
function computeWellnessScore(progress) {
  if (!progress) return 0;
  const modules = ['finance','ethics','relationships','fitness','grooming','lifestyle','etiquette'];

  // Profile completeness
  const p = progress.profile || {};
  const profileFields = ['gender','age','income','city','goals'];
  const profileScore = (profileFields.filter(f => p[f]).length / profileFields.length) * 10;

  // Streak score — avg streak, capped at 30 days = 100%
  const streaks = progress.streaks || {};
  const avgStreak = modules.reduce((sum, m) => sum + (streaks[m] || 0), 0) / modules.length;
  const streakScore = Math.min(avgStreak / 30, 1) * 40;

  // Journal engagement — how many entries across all modules
  const mp = progress.moduleProgress || {};
  let journalCount = 0;
  modules.forEach(m => {
    const entries = mp[m]?.journalEntries || {};
    journalCount += Object.values(entries).filter(v => v && v.trim().length > 10).length;
  });
  const journalScore = Math.min(journalCount / 20, 1) * 20; // 20 entries = full score

  // Check-in last 7 days
  const today = new Date();
  let checkinDays = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today - i * 86400000).toDateString();
    const anyModule = modules.some(m => {
      const h = mp[m]?.checkinHistory || {};
      return h[d] && h[d].length > 0;
    });
    if (anyModule) checkinDays++;
  }
  const checkinScore = (checkinDays / 7) * 30;

  return Math.round(profileScore + streakScore + journalScore + checkinScore);
}

// ── Helper: update streak for a module ──────────────────────────────────
function updateStreak(streaks = {}, module, checkinHistory = {}) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const h = checkinHistory || {};
  const todayDone = h[today] && h[today].length > 0;
  const yesterdayDone = h[yesterday] && h[yesterday].length > 0;
  const current = streaks[module] || 0;
  if (todayDone && yesterdayDone) return { ...streaks, [module]: current };
  if (todayDone && !yesterdayDone) return { ...streaks, [module]: 1 }; // reset if gap
  return streaks; // no change yet for today
}

// ── Helper: check for new milestones ────────────────────────────────────
function checkMilestones(progress) {
  const existing = (progress.milestones || []).map(m => m.id);
  const newOnes = [];
  const add = (id, label, icon) => {
    if (!existing.includes(id)) newOnes.push({ id, label, icon, earnedAt: new Date() });
  };

  const mp = progress.moduleProgress || {};
  const streaks = progress.streaks || {};
  const modules = ['finance','ethics','relationships','fitness','grooming','lifestyle','etiquette'];

  // First check-in ever
  const anyCheckin = modules.some(m => Object.keys(mp[m]?.checkinHistory || {}).length > 0);
  if (anyCheckin) add('first_checkin', 'First daily practice completed', '🌱');

  // Used all 7 modules at least once
  const usedModules = modules.filter(m => mp[m] && Object.keys(mp[m]).length > 0);
  if (usedModules.length >= 7) add('all_modules', 'Explored all 7 life skills areas', '🗺️');

  // 7-day streak in any module
  const hasWeekStreak = modules.some(m => (streaks[m] || 0) >= 7);
  if (hasWeekStreak) add('week_streak', '7-day practice streak', '🔥');

  // 30-day streak
  const hasMonthStreak = modules.some(m => (streaks[m] || 0) >= 30);
  if (hasMonthStreak) add('month_streak', '30-day practice streak', '⚡');

  // Profile complete
  const p = progress.profile || {};
  if (['gender','age','income','city'].every(f => p[f])) add('profile_complete', 'Personal profile completed', '👤');

  // 5 journal entries
  let totalJournal = 0;
  modules.forEach(m => { totalJournal += Object.values(mp[m]?.journalEntries || {}).filter(v => v?.trim().length > 10).length; });
  if (totalJournal >= 5) add('journal_5', '5 reflection journal entries written', '📓');
  if (totalJournal >= 20) add('journal_20', '20 reflection journal entries written', '📚');

  // Wellness score milestones
  const ws = computeWellnessScore(progress);
  if (ws >= 25) add('ws_25', 'Wellness score reached 25', '🌿');
  if (ws >= 50) add('ws_50', 'Wellness score reached 50 — halfway there', '⭐');
  if (ws >= 75) add('ws_75', 'Wellness score reached 75 — strong foundation', '🏆');

  return [...(progress.milestones || []), ...newOnes];
}

// ── GET /api/lifeskills/progress ─────────────────────────────────────────
router.get('/progress', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('lifeProgress');
    const progress = user?.lifeProgress || {};
    const wellnessScore = computeWellnessScore(progress);
    res.json({ progress, wellnessScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/lifeskills/progress ────────────────────────────────────────
// Full save — client sends entire progress object
router.post('/progress', protect, async (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress) return res.status(400).json({ error: 'progress required' });

    // Check milestones
    const milestones = checkMilestones(progress);
    const toSave = { ...progress, milestones };

    await User.findByIdAndUpdate(req.user._id, { lifeProgress: toSave });
    const wellnessScore = computeWellnessScore(toSave);
    res.json({ ok: true, wellnessScore, milestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/lifeskills/checkin ─────────────────────────────────────────
// Saves today's check-in for a specific module and updates its streak
router.post('/checkin', protect, async (req, res) => {
  try {
    const { module: mod, checkedItems } = req.body;
    if (!mod) return res.status(400).json({ error: 'module required' });

    const user = await User.findById(req.user._id).select('lifeProgress');
    const progress = user?.lifeProgress || {};
    const mp = progress.moduleProgress || {};
    const modProgress = mp[mod] || {};
    const history = modProgress.checkinHistory || {};

    const today = new Date().toDateString();
    history[today] = checkedItems || [];

    // Update streak
    const newStreaks = updateStreak(progress.streaks || {}, mod, history);

    // Update longest streak per module
    const longest = progress.longestStreaks || {};
    if ((newStreaks[mod] || 0) > (longest[mod] || 0)) longest[mod] = newStreaks[mod] || 0;

    // Update total active days
    const activeDates = new Set();
    Object.values(mp).forEach(m => { Object.keys(m.checkinHistory || {}).forEach(d => activeDates.add(d)); });
    activeDates.add(today);

    const updated = {
      ...progress,
      moduleProgress: { ...mp, [mod]: { ...modProgress, checkinHistory: history } },
      streaks: newStreaks,
      longestStreaks: longest,
      totalDaysActive: activeDates.size,
      lastActiveDate: new Date().toISOString(),
      lastModule: mod,
    };

    const milestones = checkMilestones(updated);
    updated.milestones = milestones;

    await User.findByIdAndUpdate(req.user._id, { lifeProgress: updated });

    const wellnessScore = computeWellnessScore(updated);
    const newMilestones = milestones.filter(m => !((progress.milestones || []).find(x => x.id === m.id)));

    res.json({ ok: true, streak: newStreaks[mod] || 0, wellnessScore, newMilestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
