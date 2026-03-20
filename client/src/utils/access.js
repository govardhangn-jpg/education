/**
 * access.js — Course Access Control
 * ──────────────────────────────────
 * Rules:
 *   • Admin / Teacher  → can access ALL grades, courses, and modes
 *   • Student          → can access ONLY their registered grade/course
 *   • Life Skills      → open to everyone (no restriction)
 *   • Digital Legacy   → open to everyone (no restriction)
 *   • UPSC Writing     → open only to UPSC-registered users (+ admin/teacher)
 *
 * Usage:
 *   import { canAccessGrade, getAccessibleGrades, isAdminOrTeacher } from '../utils/access';
 */

import {
  GRADES, EXAM_MODES, LLB_MODES, RGUHS_MODES, UPSC_GRADES,
  ALL_PROFESSIONAL_MODES,
} from './constants';

// ── Role helpers ───────────────────────────────────────────────────────────

export const isAdminOrTeacher = (user) =>
  user?.role === 'admin' || user?.role === 'teacher';

export const isAdmin = (user) => user?.role === 'admin';

// ── Grade family helpers ────────────────────────────────────────────────────

const SCHOOL_GRADES  = GRADES; // Class 1–12
const NEET_FAMILY    = ['NEET Preparation', 'NEET PG'];
const KCET_FAMILY    = ['KCET Preparation'];
const IIT_FAMILY     = ['IIT-JEE'];
const UPSC_FAMILY    = UPSC_GRADES;
const LLB_FAMILY     = LLB_MODES;
const RGUHS_FAMILY   = RGUHS_MODES;

/**
 * Returns the "family" (course group) a grade belongs to.
 * Two grades in the same family can be accessed by users of that family.
 */
export const gradeFamily = (grade) => {
  if (!grade) return 'school';
  if (SCHOOL_GRADES.includes(grade))  return 'school';
  if (NEET_FAMILY.includes(grade))    return 'neet';
  if (KCET_FAMILY.includes(grade))    return 'kcet';
  if (IIT_FAMILY.includes(grade))     return 'iit';
  if (UPSC_FAMILY.includes(grade))    return 'upsc';
  if (LLB_FAMILY.includes(grade))     return 'llb';
  if (RGUHS_FAMILY.includes(grade))   return 'rguhs';
  return 'school';
};

/**
 * Can a user access a particular grade/course?
 *
 * Admin/Teacher → always yes
 * Student → only if the target grade is in the same family as their registered grade
 */
export const canAccessGrade = (user, targetGrade) => {
  if (!user) return false;
  if (isAdminOrTeacher(user)) return true;
  if (!targetGrade) return true;
  // Same grade
  if (user.grade === targetGrade) return true;
  // Same family (e.g. MBBS Year 1 can access MBBS Year 2 content for preview? No — strict.)
  // Actually enforce strict: student sees ONLY their grade
  return user.grade === targetGrade;
};

/**
 * Returns the list of grades the user is allowed to see/switch to.
 * Admin/Teacher → all grades
 * Student → only their own grade
 */
export const getAccessibleGrades = (user) => {
  if (!user) return [];
  if (isAdminOrTeacher(user)) return [...SCHOOL_GRADES, ...ALL_PROFESSIONAL_MODES];
  return [user.grade];
};

/**
 * Returns which quiz/chat modes the user can access.
 * Admin/Teacher → all modes
 * Student → only their family's mode
 */
export const getAccessibleModes = (user) => {
  if (!user) return [];
  if (isAdminOrTeacher(user)) {
    return ['school', 'exam', 'upsc', 'llb', 'rguhs'];
  }
  const family = gradeFamily(user.grade);
  if (family === 'school')  return ['school'];
  if (family === 'neet' || family === 'kcet' || family === 'iit') return ['exam'];
  if (family === 'upsc')    return ['upsc'];
  if (family === 'llb')     return ['llb'];
  if (family === 'rguhs')   return ['rguhs'];
  return ['school'];
};

/**
 * Can this user access UPSC writing practice?
 */
export const canAccessUPSCWriting = (user) => {
  if (!user) return false;
  if (isAdminOrTeacher(user)) return true;
  return gradeFamily(user.grade) === 'upsc';
};

/**
 * For the Chat page — returns which school grades the user can select.
 * Admin/Teacher → all Class 1–12
 * School student → only their own grade
 * Professional/exam student → no school grades (they use exam mode)
 */
export const getAccessibleSchoolGrades = (user) => {
  if (!user) return SCHOOL_GRADES;
  if (isAdminOrTeacher(user)) return SCHOOL_GRADES;
  if (SCHOOL_GRADES.includes(user.grade)) return [user.grade];
  return []; // professional students don't access school grades
};

/**
 * For the Chat page grade select — returns all grades the user can chat about.
 * Admin/Teacher → everything
 * Student → their own grade only (but same family for professional)
 */
export const getChatGradeOptions = (user) => {
  if (!user) return SCHOOL_GRADES;
  if (isAdminOrTeacher(user)) {
    return [
      ...SCHOOL_GRADES,
      ...EXAM_MODES,
      ...UPSC_GRADES,
      ...LLB_MODES,
      ...RGUHS_MODES,
    ];
  }
  // Student sees only their own grade
  return [user.grade];
};

/**
 * Returns a human-readable description of a user's access level.
 */
export const accessLabel = (user) => {
  if (!user) return '';
  if (user.role === 'admin')   return 'Full access — all courses';
  if (user.role === 'teacher') return 'Full access — all courses';
  const family = gradeFamily(user.grade);
  const labels = {
    school: `${user.grade} · ${user.syllabus}`,
    neet:   user.grade,
    kcet:   user.grade,
    iit:    user.grade,
    upsc:   user.grade,
    llb:    user.grade,
    rguhs:  user.grade,
  };
  return labels[family] || user.grade;
};

/**
 * Access-locked component wrapper helper.
 * Returns { allowed: bool, message: string }
 */
export const checkPageAccess = (user, page) => {
  if (!user) return { allowed: false, message: 'Please log in.' };

  // These pages are always open
  if (['lifeskills', 'legacy', 'progress', 'dashboard'].includes(page)) {
    return { allowed: true };
  }

  // UPSC writing — only UPSC students + admin/teacher
  if (page === 'upsc-writing') {
    if (canAccessUPSCWriting(user)) return { allowed: true };
    return { allowed: false, message: `UPSC Writing Practice is available for UPSC aspirants only. You are registered for ${user.grade}.` };
  }

  return { allowed: true };
};
