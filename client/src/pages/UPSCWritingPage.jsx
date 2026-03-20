/**
 * UPSCWritingPage.jsx
 * ───────────────────
 * UPSC Mains Answer Writing + Essay Writing with AI evaluation
 *
 * Three modes:
 *   1. MAINS ANSWER WRITING  — GS I/II/III/IV + Optional papers
 *      • Question bank (previous year + AI-generated)
 *      • Student writes answer (word-limited)
 *      • AI evaluates on UPSC rubric: Content, Structure, Language, Balance
 *      • Model answer shown with annotations
 *
 *   2. ESSAY WRITING  — Full essay practice
 *      • Topic selection (previous year + generated)
 *      • Student writes essay (800–1200 words)
 *      • AI evaluates: Introduction, Dimensions, Balance, Language, Conclusion
 *      • Annotated model introduction + outline
 *
 *   3. PRACTICE HISTORY  — All attempts with scores and feedback
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { canAccessUPSCWriting } from '../utils/access';
import { useSearchParams, useNavigate } from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────

const UPSC_ORANGE = '#e67e22';
const UPSC_DIM    = 'rgba(230,126,34,0.12)';
const UPSC_BDR    = 'rgba(230,126,34,0.28)';
const CARD        = 'rgba(255,255,255,0.03)';

const GS_PAPERS = [
  { id:'GS1', label:'GS Paper I',   sub:'History, Geography & Society',       color:'#3498db' },
  { id:'GS2', label:'GS Paper II',  sub:'Polity, Governance & IR',            color:'#9b59b6' },
  { id:'GS3', label:'GS Paper III', sub:'Economy, Environment & Security',    color:'#27ae60' },
  { id:'GS4', label:'GS Paper IV',  sub:'Ethics, Integrity & Aptitude',       color:'#e74c3c' },
];

const OPTIONAL_SUBJECTS = [
  'History','Geography','Political Science & IR','Sociology','Philosophy',
  'Psychology','Public Administration','Economics','Law','Anthropology',
  'Mathematics','Physics','Chemistry','Zoology','Botany',
];

const ESSAY_SECTIONS = [
  { id:'A', label:'Section A', desc:'Abstract/Philosophical topics' },
  { id:'B', label:'Section B', desc:'Socio-economic/Current affairs topics' },
];

// Previous-year and sample question bank
const QUESTION_BANK = {
  GS1: [
    { q:'Examine the role of women in the freedom struggle especially during the non-cooperation movement and thereafter. (250 words, 15 marks)', marks:15 },
    { q:'Discuss the main contributions of the Gupta period to Indian culture. (150 words, 10 marks)', marks:10 },
    { q:'"The agrarian unrest in India in the 19th century found political expression in various movements." Discuss. (250 words, 15 marks)', marks:15 },
    { q:'Assess the impact of urbanization on socio-cultural life in India. (250 words, 15 marks)', marks:15 },
    { q:'Describe the characteristics and distribution of North Indian Plain. (250 words, 15 marks)', marks:15 },
    { q:'Discuss the role of land reforms in changing the agrarian structure of India. (150 words, 10 marks)', marks:10 },
  ],
  GS2: [
    { q:'"The parliamentary system of government in India is not simply a transplant from England." Discuss. (250 words, 15 marks)', marks:15 },
    { q:'Discuss the changing role of the Supreme Court in India in recent times. (150 words, 10 marks)', marks:10 },
    { q:'"The Right to Privacy is protected as an intrinsic part of Right to Life." Explain with relevant cases. (250 words, 15 marks)', marks:15 },
    { q:'How is the Government of India implementing schemes for improving the status of women in rural areas? (150 words, 10 marks)', marks:10 },
    { q:'What are the challenges India faces in tackling cross-border terrorism? Suggest measures. (250 words, 15 marks)', marks:15 },
    { q:'Discuss India\'s foreign policy towards its immediate neighbours. (250 words, 15 marks)', marks:15 },
  ],
  GS3: [
    { q:'What are the key features of the National Food Security Act, 2013? How has its implementation helped in reducing hunger and poverty in India? (250 words, 15 marks)', marks:15 },
    { q:'Discuss the impact of digital economy on India\'s economic growth. (150 words, 10 marks)', marks:10 },
    { q:'"Climate change is a global challenge that requires a global solution." Discuss in the context of India\'s commitments. (250 words, 15 marks)', marks:15 },
    { q:'What is the significance of the PM GatiShakti Master Plan for India\'s infrastructure development? (150 words, 10 marks)', marks:10 },
    { q:'Discuss the internal security challenges posed by left-wing extremism. How does poverty contribute to it? (250 words, 15 marks)', marks:15 },
    { q:'What is the role of biotechnology in food security? Discuss the ethical issues involved. (150 words, 10 marks)', marks:10 },
  ],
  GS4: [
    { q:'What is meant by foundational values for civil services? Illustrate any three such values with suitable examples. (250 words, 15 marks)', marks:15 },
    { q:'A civil servant must be politically neutral and yet be sensitive to political aspirations. Comment. (150 words, 10 marks)', marks:10 },
    { q:'Case Study: You are a District Collector. During a drought, you discover relief funds have been misappropriated by a local politician who is also an influential community leader. What would you do? (250 words, 20 marks)', marks:20 },
    { q:'What are the factors that lead to ethical dilemmas in governance? Suggest ways to resolve them. (150 words, 10 marks)', marks:10 },
    { q:'Discuss the role of attitude in determining the ethical behaviour of a civil servant. (250 words, 15 marks)', marks:15 },
    { q:'Distinguish between laws and ethics. Which do you think is a more effective instrument for governance? (150 words, 10 marks)', marks:10 },
  ],
};

const ESSAY_TOPICS_BANK = {
  A: [
    'Mindless pursuit of technological progress is a threat to humanity.',
    'The crisis of governance is fundamentally a moral crisis.',
    'Philosophy of wantlessness is Utopian; while materialism is a chimera.',
    'The past is a permanent reality; the future is only a probability.',
    'Life is a long journey between human being and being humane.',
    'Courage to accept and dedication to improve are the two keys to success.',
  ],
  B: [
    'India\'s foreign policy must be realist and not moralist.',
    'Poverty anywhere is a threat to prosperity everywhere.',
    'Education without values, as useful as it is, seems rather to make man a more clever devil.',
    'Social media is inherently a selfish medium.',
    'Innovation is the key driver of economic growth.',
    'Digital India: empowering citizens or creating digital divide?',
  ],
};

const WORD_LIMITS = { 10: 150, 15: 250, 20: 300, 25: 350 };

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

// ── History storage ────────────────────────────────────────────────────────

const LS_HISTORY = 'upsc_writing_history';
const loadHistory = (uid) => {
  try { return JSON.parse(localStorage.getItem(`${LS_HISTORY}_${uid}`) || '[]'); }
  catch { return []; }
};
const saveHistory = (uid, arr) => {
  try { localStorage.setItem(`${LS_HISTORY}_${uid}`, JSON.stringify(arr.slice(-50))); }
  catch {}
};

// ── Word counter ────────────────────────────────────────────────────────────

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function UPSCWritingPage() {
  const { user }   = useAuth();
  const [params]   = useSearchParams();
  const navigate   = useNavigate();

  // Access check — UPSC students and admin/teacher only
  if (user && !canAccessUPSCWriting(user)) {
    return (
      <div style={{ padding:'40px 20px', textAlign:'center', maxWidth:500, margin:'0 auto' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <div style={{ color:'white', fontSize:18, fontWeight:800, marginBottom:8 }}>Access Restricted</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.7, marginBottom:20 }}>
          UPSC Writing Practice is available for students registered under a UPSC course.<br />
          You are registered for <strong style={{color:'white'}}>{user?.grade}</strong>.
        </div>
        <button onClick={() => navigate('/quiz')}
          style={{ padding:'12px 24px', background:UPSC_DIM, border:`1.5px solid ${UPSC_BDR}`, borderRadius:12, color:UPSC_ORANGE, fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:800, cursor:'pointer' }}>
          ← Back to Quiz
        </button>
      </div>
    );
  }

  const initMode = params.get('mode') === 'essay' ? 'essay' : 'mains';
  const [mode, setMode]     = useState(initMode);
  const [tab, setTab]       = useState('practice'); // 'practice' | 'history'
  const [history, setHistory] = useState(() => loadHistory(user?._id || user?.username || 'guest'));

  const addHistory = (entry) => {
    const uid = user?._id || user?.username || 'guest';
    const updated = [{ ...entry, id: Date.now(), at: new Date().toISOString() }, ...history];
    setHistory(updated);
    saveHistory(uid, updated);
  };

  const avgScore = history.length
    ? Math.round(history.reduce((s,h) => s + (h.scorePercent || 0), 0) / history.length)
    : 0;

  return (
    <div style={{ padding:'16px', maxWidth:920, margin:'0 auto', fontFamily:"'Nunito',sans-serif", paddingBottom:80 }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .upsc-card{animation:fadein 0.3s ease}
        textarea::placeholder{color:rgba(255,255,255,0.2)!important}
        .eval-section{padding:14px 16px;border-radius:12px;margin-bottom:10px;}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={() => navigate('/quiz')}
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 12px', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>
          ← Quiz
        </button>
        <div>
          <div style={{ color:'white', fontSize:20, fontWeight:900, lineHeight:1.1 }}>🇮🇳 UPSC Writing Practice</div>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:2 }}>
            Mains Answer Writing  ·  Essay Paper  ·  AI Evaluation
          </div>
        </div>
        {history.length > 0 && (
          <div style={{ marginLeft:'auto', textAlign:'center', padding:'8px 14px', background:UPSC_DIM, border:`1px solid ${UPSC_BDR}`, borderRadius:12 }}>
            <div style={{ color:UPSC_ORANGE, fontSize:18, fontWeight:900 }}>{avgScore}%</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10 }}>avg score</div>
          </div>
        )}
      </div>

      {/* Mode + Tab bar */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {[['mains','📚','Mains Answer Writing'],['essay','✍️','Essay Writing']].map(([id,icon,lbl]) => (
          <button key={id} onClick={() => { setMode(id); setTab('practice'); }}
            style={{ padding:'10px 18px', borderRadius:20, border:`1.5px solid ${mode===id ? UPSC_ORANGE : 'rgba(255,255,255,0.1)'}`, background:mode===id ? UPSC_DIM : 'transparent', color:mode===id ? UPSC_ORANGE : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <span>{icon}</span><span>{lbl}</span>
          </button>
        ))}
        <div style={{ flex:1 }} />
        {[['practice','✏️ Practice'],['history',`📋 History (${history.length})`]].map(([id,lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, background:tab===id ? 'rgba(255,255,255,0.07)' : 'transparent', color:tab===id ? 'white' : 'rgba(255,255,255,0.4)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'practice' && mode === 'mains' && (
        <MainsWriting user={user} addHistory={addHistory} />
      )}
      {tab === 'practice' && mode === 'essay' && (
        <EssayWriting user={user} addHistory={addHistory} />
      )}
      {tab === 'history' && (
        <WritingHistory history={history} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAINS ANSWER WRITING
// ═══════════════════════════════════════════════════════════════════════════

function MainsWriting({ user, addHistory }) {
  const [paper, setPaper]         = useState('GS1');
  const [optional, setOptional]   = useState('');
  const [useOptional, setUseOptional] = useState(false);
  const [question, setQuestion]   = useState('');
  const [customQ, setCustomQ]     = useState('');
  const [useCustomQ, setUseCustomQ] = useState(false);
  const [marks, setMarks]         = useState(15);
  const [answer, setAnswer]       = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [generatingQ, setGeneratingQ] = useState(false);

  const effectivePaper = useOptional ? `Optional – ${optional}` : paper;
  const wordLimit = WORD_LIMITS[marks] || 250;
  const wc        = wordCount(answer);
  const wcColor   = wc > wordLimit * 1.15 ? '#e74c3c' : wc >= wordLimit * 0.85 ? '#52b788' : UPSC_ORANGE;
  const currentPaper = GS_PAPERS.find(p => p.id === paper) || GS_PAPERS[0];

  const selectQuestion = (q) => { setQuestion(q.q); setMarks(q.marks); setUseCustomQ(false); setEvaluation(null); setAnswer(''); };

  const generateQuestion = async () => {
    setGeneratingQ(true);
    try {
      const token = localStorage.getItem('samarthaa_token');
      const paperLabel = useOptional ? `Optional – ${optional}` : currentPaper.label + ' — ' + currentPaper.sub;
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
        body: JSON.stringify({
          message: `Generate one UPSC Mains ${marks}-mark question for ${paperLabel}. Return ONLY the question in this format:\nQUESTION: [question text here] (${wordLimit} words, ${marks} marks)`,
          subject: paperLabel, grade:'UPSC Mains – GS', syllabus:'UPSC', language:'English',
          systemPrompt: 'You are a UPSC question paper setter. Generate realistic UPSC Mains questions. Return ONLY the question, no other text.',
        }),
      });
      const data = await res.json();
      const raw = data.reply || data.message || '';
      const match = raw.match(/QUESTION:\s*(.+)/s);
      const extracted = match ? match[1].trim() : raw.trim();
      if (extracted.length > 20) { setQuestion(extracted); setUseCustomQ(false); setEvaluation(null); setAnswer(''); }
    } catch (e) { console.error(e); }
    setGeneratingQ(false);
  };

  const evaluate = async () => {
    if (!answer.trim() || answer.trim().length < 50) return;
    setLoading(true);
    setEvaluation(null);

    const q = useCustomQ ? customQ : question;
    const paperLabel = useOptional
      ? `UPSC Mains Optional – ${optional}`
      : `UPSC Mains ${currentPaper.label} (${currentPaper.sub})`;

    const evalPrompt = `You are a senior UPSC examiner evaluating a Mains answer paper.

PAPER: ${paperLabel}
QUESTION (${marks} marks, ${wordLimit} words limit): ${q}
STUDENT'S ANSWER (${wc} words):
${answer}

Evaluate this answer STRICTLY as a UPSC examiner would. Respond in this EXACT JSON format only:

{
  "totalScore": <number out of ${marks}>,
  "scorePercent": <number 0-100>,
  "dimensions": [
    {"name": "Content & Knowledge", "score": <out of ${Math.round(marks*0.4)}>, "max": ${Math.round(marks*0.4)}, "comment": "<2-3 sentences>"},
    {"name": "Structure & Flow",    "score": <out of ${Math.round(marks*0.25)}>, "max": ${Math.round(marks*0.25)}, "comment": "<2-3 sentences>"},
    {"name": "Analytical Depth",   "score": <out of ${Math.round(marks*0.2)}>, "max": ${Math.round(marks*0.2)}, "comment": "<2-3 sentences>"},
    {"name": "Language & Clarity", "score": <out of ${Math.round(marks*0.15)}>, "max": ${Math.round(marks*0.15)}, "comment": "<2-3 sentences>"}
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "wordCountFeedback": "<comment on word usage>",
  "examinersNote": "<1-2 sentences as the examiner's overall note>",
  "modelAnswer": "<Write a model ${marks}-mark answer in ${wordLimit} words following ideal UPSC structure: strong introduction, multiple dimensions covered, relevant facts/examples, balanced conclusion with way forward>"
}`;

    try {
      const token = localStorage.getItem('samarthaa_token');
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
        body: JSON.stringify({
          message: evalPrompt,
          subject: paperLabel, grade:'UPSC Mains – GS', syllabus:'UPSC', language:'English',
          systemPrompt: 'You are a UPSC examiner. Always respond with valid JSON only. No markdown, no extra text.',
        }),
      });
      const data = await res.json();
      const raw = (data.reply || data.message || '').replace(/```json|```/g,'').trim();
      const evalData = JSON.parse(raw);
      setEvaluation(evalData);
      addHistory({
        type: 'mains', paper: paperLabel, question: q.slice(0,100),
        marks, wc, totalScore: evalData.totalScore, scorePercent: evalData.scorePercent,
        examinersNote: evalData.examinersNote,
      });
    } catch (e) {
      setEvaluation({ error: 'Could not parse evaluation. Try again.', raw: '' });
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="upsc-card">

      {/* Paper selector */}
      <div style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
        <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800, marginBottom:12 }}>Select Paper</div>

        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {GS_PAPERS.map(p => (
            <button key={p.id} onClick={() => { setPaper(p.id); setUseOptional(false); setQuestion(''); setEvaluation(null); setAnswer(''); }}
              style={{ padding:'8px 14px', borderRadius:12, border:`1.5px solid ${!useOptional&&paper===p.id ? p.color : 'rgba(255,255,255,0.1)'}`, background:!useOptional&&paper===p.id ? `${p.color}18` : 'transparent', color:!useOptional&&paper===p.id ? p.color : 'rgba(255,255,255,0.45)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              <div>{p.label}</div>
              <div style={{ fontSize:9, opacity:0.7, marginTop:2 }}>{p.sub}</div>
            </button>
          ))}
        </div>

        {/* Optional toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: useOptional ? 10 : 0 }}>
          <button onClick={() => setUseOptional(o => !o)}
            style={{ padding:'6px 12px', borderRadius:10, border:`1.5px solid ${useOptional ? '#9b59b6' : 'rgba(255,255,255,0.1)'}`, background:useOptional ? 'rgba(155,89,182,0.15)' : 'transparent', color:useOptional ? '#c39bd3' : 'rgba(255,255,255,0.4)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            Optional Subject
          </button>
          {useOptional && (
            <select value={optional} onChange={e => { setOptional(e.target.value); setQuestion(''); setEvaluation(null); setAnswer(''); }}
              style={{ background:'#1a1528', border:'1.5px solid rgba(155,89,182,0.3)', borderRadius:9, padding:'7px 12px', color:'white', fontFamily:'inherit', fontSize:12, outline:'none', cursor:'pointer' }}>
              <option value="">Select optional…</option>
              {OPTIONAL_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Question selector */}
      <div style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800 }}>Question</div>
          <div style={{ display:'flex', gap:6 }}>
            <select value={marks} onChange={e => setMarks(Number(e.target.value))}
              style={{ background:'#1a1528', border:`1px solid ${UPSC_BDR}`, borderRadius:8, padding:'5px 10px', color:UPSC_ORANGE, fontFamily:'inherit', fontSize:12, fontWeight:700, outline:'none', cursor:'pointer' }}>
              {[10,15,20,25].map(m => <option key={m} value={m}>{m} marks ({WORD_LIMITS[m]} words)</option>)}
            </select>
            <button onClick={generateQuestion} disabled={generatingQ}
              style={{ padding:'6px 12px', background:UPSC_DIM, border:`1px solid ${UPSC_BDR}`, borderRadius:8, color:UPSC_ORANGE, fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              {generatingQ ? <span style={{ fontSize:12, animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> : '✦'} Generate
            </button>
          </div>
        </div>

        {/* Previous year questions */}
        {!useOptional && QUESTION_BANK[paper] && (
          <div style={{ marginBottom:12 }}>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Previous Year Questions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {QUESTION_BANK[paper].map((q,i) => (
                <button key={i} onClick={() => selectQuestion(q)}
                  style={{ padding:'10px 14px', background: question===q.q ? UPSC_DIM : 'rgba(255,255,255,0.02)', border:`1.5px solid ${question===q.q ? UPSC_ORANGE : 'rgba(255,255,255,0.07)'}`, borderRadius:10, color: question===q.q ? UPSC_ORANGE : 'rgba(255,255,255,0.65)', fontFamily:'inherit', fontSize:12, fontWeight: question===q.q ? 700 : 400, cursor:'pointer', textAlign:'left', lineHeight:1.5 }}>
                  {q.q.slice(0, 120)}{q.q.length > 120 ? '…' : ''}
                  <span style={{ display:'block', color: question===q.q ? UPSC_ORANGE : 'rgba(255,255,255,0.2)', fontSize:10, marginTop:3 }}>
                    {q.marks} marks · {WORD_LIMITS[q.marks]} words
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active question display */}
        {question && !useCustomQ && (
          <div style={{ padding:'14px 16px', background:UPSC_DIM, border:`1.5px solid ${UPSC_BDR}`, borderRadius:12 }}>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Active Question</div>
            <div style={{ color:'white', fontSize:13, lineHeight:1.8, fontWeight:600 }}>{question}</div>
          </div>
        )}

        {/* Custom question */}
        <div style={{ marginTop:10 }}>
          <button onClick={() => setUseCustomQ(o => !o)}
            style={{ padding:'6px 12px', borderRadius:8, border:`1px solid ${useCustomQ ? UPSC_ORANGE : 'rgba(255,255,255,0.1)'}`, background: useCustomQ ? UPSC_DIM : 'transparent', color: useCustomQ ? UPSC_ORANGE : 'rgba(255,255,255,0.35)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            ✏️ Type your own question
          </button>
          {useCustomQ && (
            <textarea value={customQ} onChange={e => setCustomQ(e.target.value)} placeholder="Paste your question here…" rows={3}
              style={{ marginTop:8, width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${UPSC_BDR}`, borderRadius:10, padding:'12px 14px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.6 }} />
          )}
        </div>
      </div>

      {/* Answer writing area */}
      {(question || (useCustomQ && customQ.trim())) && (
        <div style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800 }}>Write Your Answer</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ color:wcColor, fontSize:13, fontWeight:800 }}>{wc}</span>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>/ {wordLimit} words</span>
            </div>
          </div>

          {/* Writing tips bar */}
          <div style={{ padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, marginBottom:10, color:'rgba(255,255,255,0.35)', fontSize:11, lineHeight:1.6 }}>
            💡 Structure: <strong style={{color:UPSC_ORANGE}}>Intro</strong> (definition/context) → <strong style={{color:UPSC_ORANGE}}>Body</strong> (dimensions: historical, social, economic, political, constitutional) → <strong style={{color:UPSC_ORANGE}}>Conclusion</strong> (way forward). Use data, schemes, cases.
          </div>

          <textarea value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder={`Write your ${marks}-mark answer here in approximately ${wordLimit} words.\n\nIntroduction (20-30 words):\n\nMain body:\n  • Point 1\n  • Point 2\n  ...\n\nConclusion with Way Forward (20-30 words):`}
            rows={18}
            style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1.5px solid ${wc > wordLimit*1.15 ? '#e74c3c' : wc >= wordLimit*0.85 ? 'rgba(82,183,136,0.4)' : UPSC_BDR}`, borderRadius:12, padding:'14px 16px', color:'white', fontSize:14, fontFamily:"'Nunito',sans-serif", outline:'none', resize:'vertical', lineHeight:1.9 }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <div style={{ fontSize:11 }}>
              <span style={{ color:wcColor, fontWeight:700 }}>{wc} words</span>
              {wc > wordLimit*1.15 && <span style={{ color:'#e74c3c', marginLeft:8 }}>⚠ Exceeds limit — examiners penalise this</span>}
              {wc >= wordLimit*0.85 && wc <= wordLimit*1.15 && <span style={{ color:'#52b788', marginLeft:8 }}>✓ Good word count</span>}
              {wc < wordLimit*0.85 && wc > 0 && <span style={{ color:UPSC_ORANGE, marginLeft:8 }}>Aim for {Math.round(wordLimit*0.85)}+ words</span>}
            </div>
            <button onClick={evaluate} disabled={loading || wc < 30}
              style={{ padding:'12px 24px', background: wc >= 30 && !loading ? `linear-gradient(135deg,${UPSC_ORANGE},#f39c12)` : 'rgba(255,255,255,0.06)', border:'none', borderRadius:12, color: wc >= 30 && !loading ? '#0d0d0d' : 'rgba(255,255,255,0.2)', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor: wc >= 30 && !loading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:8 }}>
              {loading ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> Evaluating…</> : '📊 Evaluate My Answer'}
            </button>
          </div>
        </div>
      )}

      {/* Evaluation result */}
      {evaluation && !evaluation.error && (
        <EvaluationResult evaluation={evaluation} marks={marks} type="mains" />
      )}
      {evaluation?.error && (
        <div style={{ padding:'16px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.25)', borderRadius:14, color:'#e74c3c', fontSize:13 }}>
          {evaluation.error}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ESSAY WRITING
// ═══════════════════════════════════════════════════════════════════════════

function EssayWriting({ user, addHistory }) {
  const [section, setSection]     = useState('A');
  const [topic, setTopic]         = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [essay, setEssay]         = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [generating, setGenerating] = useState(false);

  const wc        = wordCount(essay);
  const WC_MIN    = 800;
  const WC_MAX    = 1200;
  const WC_TARGET = 1000;
  const wcColor   = wc > WC_MAX ? '#e74c3c' : wc >= WC_MIN ? '#52b788' : UPSC_ORANGE;

  const generateTopic = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('samarthaa_token');
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
        body: JSON.stringify({
          message: `Generate one UPSC Essay paper topic for Section ${section} (${section === 'A' ? 'Abstract/Philosophical' : 'Socio-economic/Current affairs'}). Return ONLY the topic title, nothing else.`,
          subject:'Essay', grade:'UPSC Mains – Essay', syllabus:'UPSC', language:'English',
          systemPrompt:'You are a UPSC paper setter. Generate a realistic UPSC essay topic. Return ONLY the topic text.',
        }),
      });
      const data = await res.json();
      const t = (data.reply || data.message || '').trim().replace(/^["']|["']$/g,'');
      if (t.length > 10) { setTopic(t); setUseCustom(false); setEvaluation(null); setEssay(''); }
    } catch {}
    setGenerating(false);
  };

  const evaluate = async () => {
    if (wc < 200) return;
    setLoading(true);
    setEvaluation(null);
    const t = useCustom ? customTopic : topic;

    const evalPrompt = `You are a senior UPSC examiner evaluating an Essay paper (125 marks per essay).

TOPIC: "${t}"
STUDENT'S ESSAY (${wc} words):
${essay}

Evaluate strictly on UPSC Essay rubric. Respond in EXACT JSON format only:

{
  "totalScore": <number out of 125>,
  "scorePercent": <number 0-100>,
  "dimensions": [
    {"name": "Introduction & Hook",      "score": <out of 15>, "max": 15, "comment": "<specific 2-sentence feedback>"},
    {"name": "Multidimensional Coverage","score": <out of 35>, "max": 35, "comment": "<which dimensions covered/missing>"},
    {"name": "Balance & Objectivity",    "score": <out of 20>, "max": 20, "comment": "<bias assessment>"},
    {"name": "Use of Examples & Data",   "score": <out of 20>, "max": 20, "comment": "<quality of illustrations>"},
    {"name": "Language & Expression",    "score": <out of 20>, "max": 20, "comment": "<prose quality>"},
    {"name": "Conclusion & Vision",      "score": <out of 15>, "max": 15, "comment": "<conclusion quality>"}
  ],
  "dimensionsCovered": ["historical", "social"],
  "dimensionsMissing": ["economic", "constitutional"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "quoteSuggestions": ["<relevant quote 1 that would strengthen this essay>", "<quote 2>"],
  "examinersNote": "<2-3 sentences overall examiner comment>",
  "modelIntro": "<Write a model 120-word introduction for this essay topic that would score full marks: powerful hook, definition of key terms, thesis statement, roadmap of essay>",
  "modelOutline": "<Write a 6-point outline showing ideal paragraph structure for this essay>"
}`;

    try {
      const token = localStorage.getItem('samarthaa_token');
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
        body: JSON.stringify({
          message: evalPrompt,
          subject:'Essay Writing', grade:'UPSC Mains – Essay', syllabus:'UPSC', language:'English',
          systemPrompt:'You are a UPSC examiner. Always respond with valid JSON only. No markdown fences.',
        }),
      });
      const data = await res.json();
      const raw = (data.reply || data.message || '').replace(/```json|```/g,'').trim();
      const evalData = JSON.parse(raw);
      setEvaluation(evalData);
      addHistory({
        type:'essay', topic: t.slice(0,80), section,
        wc, totalScore: evalData.totalScore, scorePercent: evalData.scorePercent,
        examinersNote: evalData.examinersNote,
      });
    } catch (e) {
      setEvaluation({ error:'Could not parse evaluation. Try again.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="upsc-card">

      {/* Essay info */}
      <div style={{ padding:'14px 16px', background:'rgba(155,89,182,0.08)', border:'1px solid rgba(155,89,182,0.25)', borderRadius:14 }}>
        <div style={{ color:'#c39bd3', fontSize:13, fontWeight:800, marginBottom:4 }}>Essay Paper — 250 marks (2 essays × 125 marks each)</div>
        <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.7 }}>
          3 hours · 1000–1200 words per essay · No bullet points — write in continuous prose · Cover 6–7 dimensions · Start with a powerful hook
        </div>
      </div>

      {/* Section + Topic */}
      <div style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
        <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800, marginBottom:12 }}>Select Topic</div>

        {/* Section toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {ESSAY_SECTIONS.map(s => (
            <button key={s.id} onClick={() => { setSection(s.id); setTopic(''); setEvaluation(null); setEssay(''); }}
              style={{ flex:1, padding:'10px', borderRadius:12, border:`1.5px solid ${section===s.id ? UPSC_ORANGE : 'rgba(255,255,255,0.1)'}`, background:section===s.id ? UPSC_DIM : 'transparent', color:section===s.id ? UPSC_ORANGE : 'rgba(255,255,255,0.4)', fontFamily:'inherit', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:12, fontWeight:800 }}>{s.label}</div>
              <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Previous year topics */}
        <div style={{ marginBottom:12 }}>
          <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Previous Year Topics</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {ESSAY_TOPICS_BANK[section].map((t,i) => (
              <button key={i} onClick={() => { setTopic(t); setUseCustom(false); setEvaluation(null); setEssay(''); }}
                style={{ padding:'10px 14px', background: topic===t ? UPSC_DIM : 'rgba(255,255,255,0.02)', border:`1.5px solid ${topic===t ? UPSC_ORANGE : 'rgba(255,255,255,0.07)'}`, borderRadius:10, color: topic===t ? UPSC_ORANGE : 'rgba(255,255,255,0.65)', fontFamily:'inherit', fontSize:12, fontWeight: topic===t ? 700 : 400, cursor:'pointer', textAlign:'left', lineHeight:1.5 }}>
                "{t}"
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={generateTopic} disabled={generating}
            style={{ padding:'7px 14px', background:UPSC_DIM, border:`1px solid ${UPSC_BDR}`, borderRadius:8, color:UPSC_ORANGE, fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
            {generating ? <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> : '✦'} Generate Topic
          </button>
          <button onClick={() => setUseCustom(o => !o)}
            style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${useCustom ? UPSC_ORANGE : 'rgba(255,255,255,0.1)'}`, background: useCustom ? UPSC_DIM : 'transparent', color: useCustom ? UPSC_ORANGE : 'rgba(255,255,255,0.35)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
            ✏️ Custom topic
          </button>
        </div>

        {useCustom && (
          <input value={customTopic} onChange={e => setCustomTopic(e.target.value)}
            placeholder="Type your essay topic here…"
            style={{ marginTop:10, width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${UPSC_BDR}`, borderRadius:9, padding:'10px 14px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
        )}
      </div>

      {/* Essay writing area */}
      {(topic || (useCustom && customTopic.trim())) && (
        <div style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
          <div style={{ padding:'12px 16px', background:UPSC_DIM, border:`1.5px solid ${UPSC_BDR}`, borderRadius:12, marginBottom:14 }}>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Essay Topic</div>
            <div style={{ color:'white', fontSize:14, fontWeight:700, lineHeight:1.6 }}>"{useCustom ? customTopic : topic}"</div>
          </div>

          {/* Essay structure guide */}
          <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.02)', borderRadius:8, marginBottom:12, fontSize:11, lineHeight:1.7, color:'rgba(255,255,255,0.35)' }}>
            <strong style={{color:UPSC_ORANGE}}>Essay dimensions to cover:</strong> Historical · Social · Economic · Political · Constitutional · Ethical · Environmental · International · Way Forward
          </div>

          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800 }}>Write Your Essay</div>
            <div style={{ color:wcColor, fontSize:13, fontWeight:800 }}>{wc} / {WC_TARGET} words (min {WC_MIN})</div>
          </div>

          <textarea value={essay} onChange={e => setEssay(e.target.value)}
            placeholder={`Write your essay in continuous prose (no bullet points).\n\nParagraph 1 — Introduction: Powerful hook + define key terms + thesis\n\nParagraph 2 — Historical dimension:\n\nParagraph 3 — Social dimension:\n\nParagraph 4 — Economic dimension:\n\nParagraph 5 — Political/Constitutional dimension:\n\nParagraph 6 — Ethical dimension:\n\nConclusion — Vision + Way Forward + Memorable closing line:`}
            rows={25}
            style={{ width:'100%', background:'rgba(255,255,255,0.03)', border:`1.5px solid ${wc > WC_MAX ? '#e74c3c' : wc >= WC_MIN ? 'rgba(82,183,136,0.4)' : UPSC_BDR}`, borderRadius:12, padding:'14px 16px', color:'white', fontSize:14, fontFamily:"'Nunito',sans-serif", outline:'none', resize:'vertical', lineHeight:2.0 }} />

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <div style={{ fontSize:11 }}>
              <span style={{ color:wcColor, fontWeight:700 }}>{wc} words</span>
              {wc < WC_MIN && wc > 0 && <span style={{ color:UPSC_ORANGE, marginLeft:8 }}>Need {WC_MIN - wc} more words minimum</span>}
              {wc >= WC_MIN && wc <= WC_MAX && <span style={{ color:'#52b788', marginLeft:8 }}>✓ Good length</span>}
              {wc > WC_MAX && <span style={{ color:'#e74c3c', marginLeft:8 }}>⚠ Trim to under {WC_MAX} words</span>}
            </div>
            <button onClick={evaluate} disabled={loading || wc < 200}
              style={{ padding:'12px 24px', background: wc >= 200 && !loading ? `linear-gradient(135deg,${UPSC_ORANGE},#f39c12)` : 'rgba(255,255,255,0.06)', border:'none', borderRadius:12, color: wc >= 200 && !loading ? '#0d0d0d' : 'rgba(255,255,255,0.2)', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor: wc >= 200 && !loading ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', gap:8 }}>
              {loading ? <><span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span> Evaluating…</> : '📊 Evaluate My Essay'}
            </button>
          </div>
        </div>
      )}

      {evaluation && !evaluation.error && (
        <EvaluationResult evaluation={evaluation} marks={125} type="essay" />
      )}
      {evaluation?.error && (
        <div style={{ padding:'16px', background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.25)', borderRadius:14, color:'#e74c3c', fontSize:13 }}>
          {evaluation.error}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EVALUATION RESULT — shared for both mains and essay
// ═══════════════════════════════════════════════════════════════════════════

function EvaluationResult({ evaluation: ev, marks, type }) {
  const [showModel, setShowModel] = useState(false);
  const pct     = ev.scorePercent || 0;
  const scoreColor = pct >= 70 ? '#52b788' : pct >= 50 ? UPSC_ORANGE : '#e74c3c';
  const grade   = pct >= 70 ? 'Strong Answer' : pct >= 55 ? 'Average' : pct >= 40 ? 'Below Average' : 'Needs Major Work';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }} className="upsc-card">

      {/* Score header */}
      <div style={{ padding:'20px', background:`${scoreColor}10`, border:`2px solid ${scoreColor}40`, borderRadius:18, textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>
          UPSC Examiner's Score
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:8 }}>
          <span style={{ color:scoreColor, fontSize:56, fontWeight:900, lineHeight:1 }}>{ev.totalScore}</span>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:24 }}>/ {marks}</span>
        </div>
        <div style={{ color:scoreColor, fontSize:16, fontWeight:800, marginTop:6 }}>{grade}</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:4 }}>{pct}% — {pct >= 60 ? 'Competitive range' : pct >= 40 ? 'Below competitive range' : 'Significant revision needed'}</div>
      </div>

      {/* Dimension scores */}
      <div style={{ padding:'18px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:16 }}>
        <div style={{ color:UPSC_ORANGE, fontSize:13, fontWeight:800, marginBottom:14 }}>Dimension-wise Scores</div>
        {(ev.dimensions || []).map(d => {
          const dpct = d.max > 0 ? (d.score / d.max) * 100 : 0;
          const dc   = dpct >= 70 ? '#52b788' : dpct >= 50 ? UPSC_ORANGE : '#e74c3c';
          return (
            <div key={d.name} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:700 }}>{d.name}</span>
                <span style={{ color:dc, fontSize:13, fontWeight:800 }}>{d.score} / {d.max}</span>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:3, marginBottom:6, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${dpct}%`, background:dc, borderRadius:3, transition:'width 0.6s ease' }} />
              </div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.6 }}>{d.comment}</div>
            </div>
          );
        })}
      </div>

      {/* Examiner's note */}
      <div style={{ padding:'14px 16px', background:'rgba(230,126,34,0.07)', border:`1px solid ${UPSC_BDR}`, borderRadius:14 }}>
        <div style={{ color:UPSC_ORANGE, fontSize:11, fontWeight:800, textTransform:'uppercase', marginBottom:6 }}>Examiner's Note</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.8, fontStyle:'italic' }}>"{ev.examinersNote}"</div>
      </div>

      {/* Strengths + Improvements */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ padding:'14px', background:'rgba(82,183,136,0.07)', border:'1px solid rgba(82,183,136,0.2)', borderRadius:14 }}>
          <div style={{ color:'#52b788', fontSize:12, fontWeight:800, marginBottom:10 }}>✓ Strengths</div>
          {(ev.strengths || []).map((s,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <span style={{ color:'#52b788', fontSize:11, flexShrink:0 }}>▸</span>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.5 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px', background:'rgba(231,76,60,0.07)', border:'1px solid rgba(231,76,60,0.2)', borderRadius:14 }}>
          <div style={{ color:'#e74c3c', fontSize:12, fontWeight:800, marginBottom:10 }}>⚡ To Improve</div>
          {(ev.improvements || []).map((s,i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:6 }}>
              <span style={{ color:'#e74c3c', fontSize:11, flexShrink:0 }}>▸</span>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Essay-specific: dimensions coverage + quote suggestions */}
      {type === 'essay' && ev.dimensionsCovered && (
        <div style={{ padding:'14px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:14 }}>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ color:'#52b788', fontSize:11, fontWeight:700, marginBottom:6 }}>Dimensions Covered</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {(ev.dimensionsCovered || []).map(d => (
                  <span key={d} style={{ padding:'3px 8px', background:'rgba(82,183,136,0.12)', border:'1px solid rgba(82,183,136,0.25)', borderRadius:8, color:'#52b788', fontSize:11, fontWeight:700 }}>{d}</span>
                ))}
              </div>
            </div>
            {(ev.dimensionsMissing || []).length > 0 && (
              <div>
                <div style={{ color:UPSC_ORANGE, fontSize:11, fontWeight:700, marginBottom:6 }}>Missing Dimensions</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {(ev.dimensionsMissing || []).map(d => (
                    <span key={d} style={{ padding:'3px 8px', background:UPSC_DIM, border:`1px solid ${UPSC_BDR}`, borderRadius:8, color:UPSC_ORANGE, fontSize:11, fontWeight:700 }}>{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(ev.quoteSuggestions || []).length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:6 }}>💬 Quotes That Would Strengthen This Essay</div>
              {(ev.quoteSuggestions || []).map((q,i) => (
                <div key={i} style={{ color:'rgba(255,255,255,0.65)', fontSize:12, lineHeight:1.7, marginBottom:4, fontStyle:'italic' }}>"{q}"</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Model answer / outline */}
      <div>
        <button onClick={() => setShowModel(o => !o)}
          style={{ width:'100%', padding:'13px 16px', background:UPSC_DIM, border:`1.5px solid ${UPSC_BDR}`, borderRadius:14, color:UPSC_ORANGE, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>📖 {type === 'essay' ? 'Model Introduction + Outline' : 'Model Answer'}</span>
          <span style={{ fontSize:11, opacity:0.7 }}>{showModel ? '▲ Hide' : '▼ Show'}</span>
        </button>
        {showModel && (
          <div style={{ padding:'18px', background:'rgba(230,126,34,0.05)', border:`1px solid ${UPSC_BDR}`, borderRadius:14, marginTop:4 }}>
            {type === 'essay' ? (
              <>
                <div style={{ color:UPSC_ORANGE, fontSize:12, fontWeight:800, textTransform:'uppercase', marginBottom:8 }}>Model Introduction (120 words)</div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.9, marginBottom:18, whiteSpace:'pre-wrap' }}>{ev.modelIntro}</div>
                <div style={{ color:UPSC_ORANGE, fontSize:12, fontWeight:800, textTransform:'uppercase', marginBottom:8 }}>Ideal Essay Outline</div>
                <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{ev.modelOutline}</div>
              </>
            ) : (
              <>
                <div style={{ color:UPSC_ORANGE, fontSize:12, fontWeight:800, textTransform:'uppercase', marginBottom:8 }}>Model Answer ({marks} marks)</div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:13, lineHeight:1.9, whiteSpace:'pre-wrap' }}>{ev.modelAnswer}</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Word count feedback */}
      {ev.wordCountFeedback && (
        <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.6 }}>
          📏 {ev.wordCountFeedback}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WRITING HISTORY
// ═══════════════════════════════════════════════════════════════════════════

function WritingHistory({ history }) {
  if (history.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
        <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
        No practice attempts yet. Start writing to build your history.
      </div>
    );
  }

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return ''; }
  };

  const mainsAttempts = history.filter(h => h.type === 'mains');
  const essayAttempts = history.filter(h => h.type === 'essay');

  const avgMains = mainsAttempts.length ? Math.round(mainsAttempts.reduce((s,h) => s + h.scorePercent, 0) / mainsAttempts.length) : 0;
  const avgEssay = essayAttempts.length ? Math.round(essayAttempts.reduce((s,h) => s + h.scorePercent, 0) / essayAttempts.length) : 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'Total attempts', value:history.length, color:'white' },
          { label:'Mains avg', value:avgMains ? `${avgMains}%` : '—', color: avgMains >= 60 ? '#52b788' : UPSC_ORANGE },
          { label:'Essay avg', value:avgEssay ? `${avgEssay}%` : '—', color: avgEssay >= 60 ? '#52b788' : UPSC_ORANGE },
        ].map(s => (
          <div key={s.label} style={{ padding:'14px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:12, textAlign:'center' }}>
            <div style={{ color:s.color, fontSize:22, fontWeight:900 }}>{s.value}</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Attempt list */}
      {history.map(h => {
        const sc = h.scorePercent || 0;
        const col = sc >= 70 ? '#52b788' : sc >= 50 ? UPSC_ORANGE : '#e74c3c';
        return (
          <div key={h.id} style={{ padding:'16px', background:CARD, border:`1px solid ${UPSC_BDR}`, borderRadius:14, display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ width:48, height:48, borderRadius:12, background:`${col}18`, border:`1.5px solid ${col}40`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:col, fontSize:15, fontWeight:900 }}>{sc}%</span>
              <span style={{ color:'rgba(255,255,255,0.25)', fontSize:9 }}>{h.type}</span>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                <span style={{ padding:'2px 8px', background:h.type==='mains'?'rgba(52,152,219,0.15)':'rgba(155,89,182,0.15)', border:`1px solid ${h.type==='mains'?'rgba(52,152,219,0.3)':'rgba(155,89,182,0.3)'}`, borderRadius:6, color:h.type==='mains'?'#3498db':'#c39bd3', fontSize:10, fontWeight:700 }}>
                  {h.type === 'mains' ? '📚 Mains' : '✍️ Essay'}
                </span>
                {h.paper && <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{h.paper}</span>}
                {h.section && <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>Section {h.section}</span>}
                {h.marks && <span style={{ color:UPSC_ORANGE, fontSize:11, fontWeight:700 }}>{h.totalScore}/{h.marks}</span>}
                <span style={{ color:'rgba(255,255,255,0.2)', fontSize:10, marginLeft:'auto' }}>{formatDate(h.at)} · {h.wc}w</span>
              </div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.5, marginBottom:4 }}>
                {h.question || h.topic}
              </div>
              {h.examinersNote && (
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, lineHeight:1.5, fontStyle:'italic' }}>
                  "{h.examinersNote.slice(0,120)}{h.examinersNote.length > 120 ? '…' : ''}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
