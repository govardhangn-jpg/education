/**
 * access.js — Course Access Control
 * ──────────────────────────────────
 * Rules:
 *   • Admin / Teacher  → all modes, all courses, all grades
 *   • School student   → school mode only, their own grade only
 *   • NEET student     → NEET Preparation + NEET PG only
 *   • KCET student     → KCET Preparation only
 *   • IIT-JEE student  → IIT-JEE only
 *   • UPSC student     → UPSC modes + UPSC writing practice
 *   • LLB student      → LLB years only (their year and adjacent)
 *   • RGUHS student    → RGUHS programme only (their year and adjacent)
 *   • Life Skills      → open to ALL users
 *   • Digital Legacy   → open to ALL users
 */

import {
  GRADES, EXAM_MODES, LLB_MODES, RGUHS_MODES, UPSC_GRADES,
  ALL_PROFESSIONAL_MODES,
} from './constants';

// ── Role helpers ───────────────────────────────────────────────────────────

export const isAdminOrTeacher = (user) =>
  user?.role === 'admin' || user?.role === 'teacher';

export const isAdmin = (user) => user?.role === 'admin';

// ── Grade family ────────────────────────────────────────────────────────────
// Each family maps to exactly one quiz mode button

export const gradeFamily = (grade) => {
  if (!grade) return 'school';
  if (GRADES.includes(grade))           return 'school';
  if (grade === 'NEET Preparation')     return 'neet';
  if (grade === 'NEET PG')              return 'neet';
  if (grade === 'KCET Preparation')     return 'kcet';
  if (grade === 'IIT-JEE')              return 'iit';
  if (EXAM_MODES.includes(grade))       return 'neet'; // catch-all for any other exam mode
  if (UPSC_GRADES.includes(grade))      return 'upsc';
  if (LLB_MODES.includes(grade))        return 'llb';
  if (RGUHS_MODES.includes(grade))      return 'rguhs';
  return 'school';
};

// ── Mode access ─────────────────────────────────────────────────────────────
// Returns array of mode IDs the user is allowed to see/use in Quiz and Chat.
// Each entrance exam is its OWN mode — NEET students cannot access IIT-JEE and vice versa.

export const getAccessibleModes = (user) => {
  if (!user) return [];
  if (isAdminOrTeacher(user)) return ['school', 'neet', 'kcet', 'iit', 'upsc', 'llb', 'rguhs'];
  const f = gradeFamily(user.grade);
  const map = {
    school: ['school'],
    neet:   ['neet'],
    kcet:   ['kcet'],
    iit:    ['iit'],
    upsc:   ['upsc'],
    llb:    ['llb'],
    rguhs:  ['rguhs'],
  };
  return map[f] || ['school'];
};

// ── Grade access ─────────────────────────────────────────────────────────────

export const canAccessGrade = (user, targetGrade) => {
  if (!user) return false;
  if (isAdminOrTeacher(user)) return true;
  return user.grade === targetGrade;
};

export const getAccessibleGrades = (user) => {
  if (!user) return [];
  if (isAdminOrTeacher(user)) return [...GRADES, ...ALL_PROFESSIONAL_MODES];
  return [user.grade];
};

// ── UPSC Writing access ──────────────────────────────────────────────────────

export const canAccessUPSCWriting = (user) => {
  if (!user) return false;
  if (isAdminOrTeacher(user)) return true;
  return gradeFamily(user.grade) === 'upsc';
};

// ── Chat grade options ───────────────────────────────────────────────────────

export const getChatGradeOptions = (user) => {
  if (!user) return GRADES;
  if (isAdminOrTeacher(user)) return [...GRADES, ...ALL_PROFESSIONAL_MODES];
  return [user.grade];
};

// ── Display helpers ──────────────────────────────────────────────────────────

export const accessLabel = (user) => {
  if (!user) return '';
  if (isAdminOrTeacher(user)) return 'Full access — all courses';
  return user.grade || 'Unknown course';
};

export const getAccessibleSchoolGrades = (user) => {
  if (!user) return GRADES;
  if (isAdminOrTeacher(user)) return GRADES;
  if (GRADES.includes(user.grade)) return [user.grade];
  return [];
};

export const checkPageAccess = (user, page) => {
  if (!user) return { allowed: false, message: 'Please log in.' };
  if (['lifeskills', 'legacy', 'progress', 'dashboard'].includes(page)) return { allowed: true };
  if (page === 'upsc-writing') {
    if (canAccessUPSCWriting(user)) return { allowed: true };
    return { allowed: false, message: `UPSC Writing is for UPSC aspirants only. You are registered for ${user.grade}.` };
  }
  return { allowed: true };
};
