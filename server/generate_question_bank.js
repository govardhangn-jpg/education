/**
 * generate_question_bank.js
 * Run ONCE from server/ directory:  node generate_question_bank.js
 *
 * Generates static question banks for ALL CBSE/ICSE/Karnataka State chapters.
 * Output: client/public/questionBank/{Syllabus}/{class-N}.json
 *
 * Options:
 *   --syllabus "CBSE"     one syllabus only
 *   --grade "Class 10"    one grade only  
 *   --subject "Science"   one subject only
 *   --resume              skip already-done chapters
 *   --workers 3           parallel workers (default 3)
 */
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const args = process.argv.slice(2);
const getArg = (n) => { const i = args.indexOf(n); return i !== -1 ? args[i+1] : null; };

const FILTER_SYL  = getArg('--syllabus');
const FILTER_GRD  = getArg('--grade');
const FILTER_SUB  = getArg('--subject');
const RESUME      = args.includes('--resume');
const WORKERS     = parseInt(getArg('--workers') || '3');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY not set in .env'); process.exit(1);
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OUT_DIR = path.join(__dirname, '..', 'client', 'public', 'questionBank');
fs.mkdirSync(OUT_DIR, { recursive: true });

const { CURRICULUM } = await import('./data/curriculum.js');

// Build work queue
const queue = [];
for (const [syl, grades] of Object.entries(CURRICULUM)) {
  if (!['CBSE','ICSE','Karnataka State'].includes(syl)) continue;
  if (FILTER_SYL && syl !== FILTER_SYL) continue;
  for (const [grade, subjects] of Object.entries(grades)) {
    if (FILTER_GRD && grade !== FILTER_GRD) continue;
    for (const [subj, chapters] of Object.entries(subjects)) {
      if (FILTER_SUB && subj !== FILTER_SUB) continue;
      for (const ch of chapters) queue.push({ syl, grade, subj, ch });
    }
  }
}

console.log(`Chapters: ${queue.length} | Workers: ${WORKERS} | Resume: ${RESUME}`);
console.log(`Cost estimate: $${(queue.length * 700 * 0.25/1e6).toFixed(3)} | Time: ~${Math.ceil(queue.length/WORKERS/60)}min`);

// File helpers
const fileCache = {};
function getPath(syl, grade) {
  const d = path.join(OUT_DIR, syl.replace(/\s+/g,'_'));
  fs.mkdirSync(d, {recursive:true});
  return path.join(d, grade.toLowerCase().replace(/\s+/g,'-')+'.json');
}
function load(syl, grade) {
  const k = syl+'|'+grade;
  if (fileCache[k]) return fileCache[k];
  const p = getPath(syl, grade);
  fileCache[k] = (RESUME && fs.existsSync(p)) ? JSON.parse(fs.readFileSync(p,'utf8')) : {};
  return fileCache[k];
}
function save(syl, grade) {
  fs.writeFileSync(getPath(syl,grade), JSON.stringify(fileCache[syl+'|'+grade]));
}

// Generate one chapter
async function gen(syl, grade, subj, ch, tries=3) {
  const n = parseInt(grade.replace('Class ','')) || 1;
  const hasLong = n >= 6;
  const p = `Generate a question bank. Return ONLY valid JSON, no markdown.
Syllabus:${syl} Grade:${grade} Subject:${subj} Chapter:"${ch}"

{"mcq":[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."},{"question":"...","options":["A","B","C","D"],"correctIndex":1,"explanation":"..."},{"question":"...","options":["A","B","C","D"],"correctIndex":2,"explanation":"..."},{"question":"...","options":["A","B","C","D"],"correctIndex":3,"explanation":"..."},{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}],"short":[{"question":"...","modelAnswer":"complete answer in 3-5 sentences","markingPoints":["point1","point2","point3"],"marks":3},{"question":"...","modelAnswer":"complete answer","markingPoints":["point1","point2","point3"],"marks":3}],"long":${hasLong?'[{"question":"...","modelAnswer":"detailed paragraphs","markingPoints":["p1","p2","p3","p4","p5"],"marks":5,"hints":["hint1","hint2"]},{"question":"...","modelAnswer":"detailed paragraphs","markingPoints":["p1","p2","p3","p4","p5"],"marks":5,"hints":["hint1","hint2"]}]':'[]'},"keyPoints":["must-know fact 1","must-know fact 2","must-know fact 3","must-know fact 4"],"formula":["formula if any, else empty array"],"remembertip":"one memorable mnemonic"}

All content must be strictly accurate and aligned to ${syl} ${grade} curriculum.`;

  for (let t=0; t<tries; t++) {
    try {
      const r = await anthropic.messages.create({
        model:'claude-haiku-4-5-20251001', max_tokens:2000,
        messages:[{role:'user',content:p}]
      });
      let txt = r.content[0].text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'').trim();
      const d = JSON.parse(txt);
      if (!Array.isArray(d.mcq) || d.mcq.length < 3) throw new Error('too few MCQs');
      return d;
    } catch(e) {
      if (t < tries-1) await new Promise(r=>setTimeout(r, 2000*(t+1)));
    }
  }
  return null;
}

// Stats
let done=0, ok=0, skip=0, fail=0;
const total=queue.length;
const start=Date.now();

function progress() {
  const p=(done/total*100).toFixed(1);
  process.stdout.write(`\r[${'█'.repeat(Math.floor(done/total*40))}${'░'.repeat(40-Math.floor(done/total*40))}] ${p}% | ✓${ok} ⏭${skip} ✗${fail}`);
}

// Worker
let qi=0;
async function worker() {
  while (qi < queue.length) {
    const {syl,grade,subj,ch} = queue[qi++];
    const cache = load(syl, grade);
    if (!cache[subj]) cache[subj]={};

    if (RESUME && cache[subj][ch]?.mcq?.length > 0) {
      skip++; done++; progress(); continue;
    }

    const data = await gen(syl, grade, subj, ch);
    if (data) { cache[subj][ch]=data; ok++; }
    else { cache[subj][ch]={mcq:[],short:[],long:[],keyPoints:[],formula:[],remembertip:''}; fail++; }

    done++;
    save(syl, grade);
    progress();
    await new Promise(r=>setTimeout(r,400));
  }
}

await Promise.all(Array(WORKERS).fill(0).map(()=>worker()));

process.stdout.write('\n');
const mins = ((Date.now()-start)/60000).toFixed(1);
console.log(`\nDone in ${mins}min | Generated:${ok} Skipped:${skip} Failed:${fail}`);
console.log(`Files saved to: client/public/questionBank/`);
if (fail > 0) console.log(`Retry failed: node generate_question_bank.js --resume`);
