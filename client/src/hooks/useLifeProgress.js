/**
 * useLifeProgress — persistent life skills journey hook
 *
 * Stores the user's entire life skills state in MongoDB via the backend.
 * Also mirrors to localStorage as an offline backup.
 *
 * Features:
 * - Loads from server on mount (or localStorage if offline)
 * - Auto-saves to server with 2-second debounce on any change
 * - Tracks: profile, lastModule, per-module tabs/journals/checkins, streaks, milestones
 * - Computes wellness score server-side, returns it to the UI
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || '/api';
const LS_KEY = 'samarthaa_lifeprogress';
const LS_SCORE_KEY = 'samarthaa_wellnessscore';

// ── API helpers ────────────────────────────────────────────────────────────
const authHeader = () => {
  const token = localStorage.getItem('samarthaa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function serverLoad() {
  const r = await fetch(`${BASE}/lifeskills/progress`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
  });
  if (!r.ok) throw new Error('server load failed');
  return r.json(); // { progress, wellnessScore }
}

async function serverSave(progress) {
  const r = await fetch(`${BASE}/lifeskills/progress`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ progress }),
  });
  if (!r.ok) throw new Error('server save failed');
  return r.json(); // { ok, wellnessScore, milestones }
}

async function serverCheckin(module, checkedItems) {
  const r = await fetch(`${BASE}/lifeskills/checkin`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ module, checkedItems }),
  });
  if (!r.ok) throw new Error('checkin failed');
  return r.json(); // { ok, streak, wellnessScore, newMilestones }
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useLifeProgress() {
  const [progress,      setProgress]      = useState(null);   // null = still loading
  const [wellnessScore, setWellnessScore] = useState(() => {
    try { return parseInt(localStorage.getItem(LS_SCORE_KEY) || '0'); } catch { return 0; }
  });
  const [serverOnline,  setServerOnline]  = useState(true);
  const [newMilestones, setNewMilestones] = useState([]);
  const saveTimer = useRef(null);

  // ── Load on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    const localRaw = localStorage.getItem(LS_KEY);
    const local = localRaw ? JSON.parse(localRaw) : {};

    serverLoad()
      .then(({ progress: serverProgress, wellnessScore: ws }) => {
        // Merge: server is authoritative, but if local is newer keep local
        // (happens when user worked offline)
        const merged = mergeProgress(serverProgress || {}, local);
        setProgress(merged);
        setWellnessScore(ws || 0);
        localStorage.setItem(LS_KEY, JSON.stringify(merged));
        localStorage.setItem(LS_SCORE_KEY, String(ws || 0));
        setServerOnline(true);
      })
      .catch(() => {
        // Server unavailable — use localStorage
        setProgress(local);
        setServerOnline(false);
      });
  }, []);

  // ── Debounced save to server ───────────────────────────────────────────
  const scheduleSave = useCallback((newProgress) => {
    localStorage.setItem(LS_KEY, JSON.stringify(newProgress)); // immediate local save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const result = await serverSave(newProgress);
        setWellnessScore(result.wellnessScore || 0);
        localStorage.setItem(LS_SCORE_KEY, String(result.wellnessScore || 0));
        if (result.milestones?.length) {
          // Find new ones by checking what wasn't there before
          const prevIds = (newProgress.milestones || []).map(m => m.id);
          const fresh = result.milestones.filter(m => !prevIds.includes(m.id));
          if (fresh.length > 0) setNewMilestones(fresh);
        }
        setServerOnline(true);
      } catch {
        setServerOnline(false);
      }
    }, 2000);
  }, []);

  // ── Update profile ─────────────────────────────────────────────────────
  const updateProfile = useCallback((profile) => {
    setProgress(prev => {
      const next = { ...prev, profile };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Set active module (remembers where user left off) ──────────────────
  const setLastModule = useCallback((moduleId) => {
    setProgress(prev => {
      if (!prev || prev.lastModule === moduleId) return prev;
      const next = { ...prev, lastModule: moduleId };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Set active tab within a module ────────────────────────────────────
  const setModuleTab = useCallback((moduleId, tab) => {
    setProgress(prev => {
      if (!prev) return prev;
      const mp = prev.moduleProgress || {};
      const next = {
        ...prev,
        moduleProgress: {
          ...mp,
          [moduleId]: { ...(mp[moduleId] || {}), lastTab: tab },
        },
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Save journal entry ─────────────────────────────────────────────────
  const saveJournal = useCallback((moduleId, promptIdx, text) => {
    setProgress(prev => {
      if (!prev) return prev;
      const mp = prev.moduleProgress || {};
      const mod = mp[moduleId] || {};
      const next = {
        ...prev,
        moduleProgress: {
          ...mp,
          [moduleId]: {
            ...mod,
            journalEntries: { ...(mod.journalEntries || {}), [promptIdx]: text },
          },
        },
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Save module-specific data (BMI, budget, etc.) ─────────────────────
  const saveModuleData = useCallback((moduleId, key, value) => {
    setProgress(prev => {
      if (!prev) return prev;
      const mp = prev.moduleProgress || {};
      const next = {
        ...prev,
        moduleProgress: {
          ...mp,
          [moduleId]: { ...(mp[moduleId] || {}), [key]: value },
        },
      };
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Save daily check-in for a module ─────────────────────────────────
  const saveCheckin = useCallback(async (moduleId, checkedItems) => {
    const today = new Date().toDateString();

    // Optimistic local update first
    setProgress(prev => {
      if (!prev) return prev;
      const mp = prev.moduleProgress || {};
      const mod = mp[moduleId] || {};
      const history = { ...(mod.checkinHistory || {}), [today]: checkedItems };
      const next = {
        ...prev,
        lastModule: moduleId,
        lastActiveDate: new Date().toISOString(),
        moduleProgress: { ...mp, [moduleId]: { ...mod, checkinHistory: history } },
      };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });

    // Server check-in (handles streak + milestone logic)
    try {
      const result = await serverCheckin(moduleId, checkedItems);
      setWellnessScore(result.wellnessScore || 0);
      localStorage.setItem(LS_SCORE_KEY, String(result.wellnessScore || 0));

      // Update streak in local state
      setProgress(prev => {
        if (!prev) return prev;
        const next = {
          ...prev,
          streaks: { ...(prev.streaks || {}), [moduleId]: result.streak || 0 },
        };
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        return next;
      });

      if (result.newMilestones?.length) setNewMilestones(result.newMilestones);
    } catch { /* server offline — local update already done */ }
  }, []);

  // ── Dismiss milestone toast ────────────────────────────────────────────
  const dismissMilestones = useCallback(() => setNewMilestones([]), []);

  // ── Computed getters ───────────────────────────────────────────────────
  const getModuleProgress = useCallback((moduleId) => {
    return progress?.moduleProgress?.[moduleId] || {};
  }, [progress]);

  const getStreak = useCallback((moduleId) => {
    return progress?.streaks?.[moduleId] || 0;
  }, [progress]);

  const getTodayCheckin = useCallback((moduleId) => {
    const today = new Date().toDateString();
    return progress?.moduleProgress?.[moduleId]?.checkinHistory?.[today] || [];
  }, [progress]);

  const getJournal = useCallback((moduleId, promptIdx) => {
    return progress?.moduleProgress?.[moduleId]?.journalEntries?.[promptIdx] || '';
  }, [progress]);

  return {
    progress,
    loading:         progress === null,
    profile:         progress?.profile || {},
    lastModule:      progress?.lastModule || null,
    wellnessScore,
    serverOnline,
    newMilestones,
    milestones:      progress?.milestones || [],
    totalDaysActive: progress?.totalDaysActive || 0,
    streaks:         progress?.streaks || {},
    // actions
    updateProfile,
    setLastModule,
    setModuleTab,
    saveJournal,
    saveModuleData,
    saveCheckin,
    dismissMilestones,
    // getters
    getModuleProgress,
    getStreak,
    getTodayCheckin,
    getJournal,
  };
}

// ── Merge helper ───────────────────────────────────────────────────────────
// Merges server + local progress, keeping the richer data for each field.
// Strategy: for checkinHistory, union all dates. For streaks, take max.
// For journals, prefer whichever has more content. Server wins for milestones.
function mergeProgress(server, local) {
  if (!local || Object.keys(local).length === 0) return server;
  if (!server || Object.keys(server).length === 0) return local;

  const merged = { ...server };

  // Profile: prefer local (user may have updated offline)
  if (local.profile && Object.keys(local.profile).length > Object.keys(server.profile || {}).length) {
    merged.profile = local.profile;
  }

  // Last module: most recent wins
  if (local.lastActiveDate > (server.lastActiveDate || '')) {
    merged.lastModule = local.lastModule || server.lastModule;
    merged.lastActiveDate = local.lastActiveDate;
  }

  // Module progress: merge each module
  const allMods = new Set([
    ...Object.keys(server.moduleProgress || {}),
    ...Object.keys(local.moduleProgress || {}),
  ]);
  merged.moduleProgress = {};
  allMods.forEach(mod => {
    const s = server.moduleProgress?.[mod] || {};
    const l = local.moduleProgress?.[mod] || {};
    // Checkin history: union
    const history = { ...(s.checkinHistory || {}), ...(l.checkinHistory || {}) };
    // Journals: prefer non-empty, local wins on conflict
    const journals = { ...(s.journalEntries || {}), ...(l.journalEntries || {}) };
    // Last tab: local wins (more recent UI state)
    const lastTab = l.lastTab || s.lastTab;
    merged.moduleProgress[mod] = { ...s, ...l, checkinHistory: history, journalEntries: journals, lastTab };
  });

  // Streaks: take max (most encouraging)
  merged.streaks = {};
  const allStreakMods = new Set([...Object.keys(server.streaks || {}), ...Object.keys(local.streaks || {})]);
  allStreakMods.forEach(m => {
    merged.streaks[m] = Math.max(server.streaks?.[m] || 0, local.streaks?.[m] || 0);
  });

  // Milestones: server is authoritative (computed server-side)
  merged.milestones = server.milestones || local.milestones || [];

  return merged;
}
