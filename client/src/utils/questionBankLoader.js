/**
 * questionBankLoader.js  —  client/src/utils/questionBankLoader.js
 * Lazy-loads pre-generated question bank JSON from /public/questionBank/
 * Falls back gracefully when data not available.
 */

const cache = {};

export async function loadGradeBank(syllabus, grade) {
  const key = `${syllabus}|${grade}`;
  if (key in cache) return cache[key];
  const slug = `${syllabus.replace(/\s+/g,'_')}/${grade.toLowerCase().replace(/\s+/g,'-')}.json`;
  try {
    const r = await fetch(`/questionBank/${slug}`);
    if (!r.ok) { cache[key]=null; return null; }
    cache[key] = await r.json();
    return cache[key];
  } catch { cache[key]=null; return null; }
}

export async function getChapterData(syllabus, grade, subject, chapter) {
  const bank = await loadGradeBank(syllabus, grade);
  if (!bank) return null;
  return bank[subject]?.[chapter] || null;
}

export function pickRandom(arr, n) {
  if (!arr?.length) return [];
  return [...arr].sort(()=>Math.random()-0.5).slice(0, Math.min(n, arr.length));
}

export async function hasStaticBank(syllabus, grade) {
  const bank = await loadGradeBank(syllabus, grade);
  return bank !== null;
}
