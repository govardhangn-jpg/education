import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateQuiz, submitQuiz, getQuizHistory, getCurriculum, getLeaderboard, evaluateAnswer } from '../utils/api';
import { getChapterData, pickRandom } from '../utils/questionBankLoader';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE, DIFFICULTY_META, LANGUAGES, GRADES, SYLLABI,
         EXAM_META, EXAM_MODES, LLB_META, LLB_MODES, RGUHS_META, RGUHS_MODES,
         UPSC_META, UPSC_GRADES,
         ALL_PROFESSIONAL_MODES, getSyllabusKey } from '../utils/constants';
import { isAdminOrTeacher, getAccessibleModes } from '../utils/access';

export default function QuizPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const accessibleModes = getAccessibleModes(user);
  const [tab, setTab] = useState('setup');

  const [config, setConfig] = useState(() => {
    const urlMode = params.get('examMode');
    if (urlMode && ALL_PROFESSIONAL_MODES.includes(urlMode)) {
      const syllabus = getSyllabusKey(urlMode) || 'CBSE';
      const subs = SUBJECTS_BY_GRADE[urlMode] || [];
      return { grade: urlMode, syllabus, subject: subs[0] || '', chapter: '', difficulty: 'medium', count: 5, language: user?.preferredLanguage || 'English', questionType: 'mcq' };
    }
    // Admin starts at Class 7 (neutral), students start at their registered grade
    const isPriv = user?.role === 'admin' || user?.role === 'teacher';
    const grade    = isPriv ? 'Class 7' : (user?.grade || 'Class 7');
    const syllabus = getSyllabusKey(grade) || user?.syllabus || 'CBSE';
    const subs     = SUBJECTS_BY_GRADE[grade] || [];
    return { grade, syllabus, subject: subs[0] || '', chapter: '', difficulty: 'medium', count: 5, language: user?.preferredLanguage || 'English', questionType: 'mcq' };
  });

  const [chapters, setChapters]       = useState([]);
  const [questions, setQuestions]     = useState([]);
  const [answers, setAnswers]         = useState({});
  const [result, setResult]           = useState(null);
  const [generating, setGenerating]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [history, setHistory]         = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQ, setCurrentQ]       = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [evaluations, setEvaluations]       = useState({});
  const [evaluating, setEvaluating]         = useState(null);
  const [usingStatic, setUsingStatic]       = useState(false); // true when using pre-built bank
  const startTime = useRef(null);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  // Classify current mode
  const isExamMode  = EXAM_MODES.includes(config.grade);  // neet/kcet/iit/neetpg
  const isLLBMode   = LLB_MODES.includes(config.grade);
  const isRGUHSMode = RGUHS_MODES.includes(config.grade);
  const isUPSCMode  = UPSC_GRADES.includes(config.grade);
  const isProfMode  = isExamMode || isLLBMode || isRGUHSMode || isUPSCMode;

  const examMeta = isExamMode ? EXAM_META[config.grade] : null;

  // Effective syllabus key for curriculum lookup
  const effectiveSyllabus = getSyllabusKey(config.grade) || config.syllabus;

  // Subjects for current grade
  const subjects = SUBJECTS_BY_GRADE[config.grade] || [];

  // When grade changes, reset subject only if current subject isn't valid for new grade
  const prevGradeRef = useRef(config.grade);
  useEffect(() => {
    if (prevGradeRef.current === config.grade) return; // skip on first render
    prevGradeRef.current = config.grade;
    const subs = SUBJECTS_BY_GRADE[config.grade] || [];
    if (subs.length && !subs.includes(config.subject)) {
      set('subject', subs[0]);
    }
    set('chapter', '');
  }, [config.grade]);

  // Load chapters
  useEffect(() => {
    if (!config.subject || !config.grade) return;
    getCurriculum({ grade: config.grade, syllabus: effectiveSyllabus, subject: config.subject })
      .then(r => setChapters(r.data.chapters || []))
      .catch(() => setChapters([]));
  }, [config.subject, config.grade, effectiveSyllabus]);

  useEffect(() => {
    if (tab === 'history')     getQuizHistory({ subject: config.subject, limit: 20 }).then(r => setHistory(r.data.attempts || [])).catch(() => {});
    if (tab === 'leaderboard') getLeaderboard({ grade: config.grade }).then(r => setLeaderboard(r.data.leaderboard || [])).catch(() => {});
  }, [tab]);

  // School syllabi: try static question bank first, fall back to LLM
  const isSchoolSyllabus = ['CBSE','ICSE','Karnataka State'].includes(effectiveSyllabus);

  const startQuiz = async () => {
    if (!config.subject) return alert('Please select a subject first.');
    setGenerating(true);
    setUsingStatic(false);

    try {
      // ── Try static question bank first (school mode only) ──────────────
      if (isSchoolSyllabus && config.chapter) {
        const bankData = await getChapterData(
          effectiveSyllabus, config.grade, config.subject, config.chapter
        );

        if (bankData) {
          const typeKey = config.questionType || 'mcq';
          const pool = bankData[typeKey] || [];

          if (pool.length > 0) {
            const picked = pickRandom(pool, config.count || 5);
            setQuestions(picked);
            setAnswers({}); setResult(null); setCurrentQ(0);
            setStudentAnswers({}); setEvaluations({});
            setUsingStatic(true);
            startTime.current = Date.now();
            setTab('quiz');
            return; // ← no LLM call needed
          }
        }
      }

      // ── Fall back to LLM generation ────────────────────────────────────
      const clientTimeoutMs = 30000 + ((config.count || 5) * 3500); // matches server
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Quiz generation timed out. Try fewer questions or try again.')), clientTimeoutMs)
      );
      const r = await Promise.race([
        generateQuiz({ ...config, syllabus: effectiveSyllabus }),
        timeoutPromise,
      ]);
      setQuestions(r.data.questions);
      setAnswers({}); setResult(null); setCurrentQ(0);
      setStudentAnswers({}); setEvaluations({});
      startTime.current = Date.now();
      setTab('quiz');

    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.error || err.message || 'Failed to generate quiz.';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleEvaluate = async (idx) => {
    const q = questions[idx];
    const ans = studentAnswers[idx] || '';
    if (!ans.trim() || ans.trim().length < 20) return alert('Please write at least a sentence before evaluating.');
    setEvaluating(idx);
    try {
      const r = await evaluateAnswer({
        question: q.question,
        studentAnswer: ans,
        modelAnswer: q.modelAnswer,
        markingPoints: q.markingPoints,
        marks: q.marks,
        grade: config.grade,
        subject: config.subject,
        syllabus: config.syllabus,
      });
      setEvaluations(e => ({ ...e, [idx]: r.data }));
    } catch (err) {
      alert(err.response?.data?.error || 'Evaluation failed. Try again.');
    } finally {
      setEvaluating(null);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const ansArr = questions.map((_, i) => answers[i] !== undefined ? answers[i] : -1);
      const r = await submitQuiz({ ...config, syllabus: effectiveSyllabus, questions, answers: ansArr, timeTaken });
      setResult(r.data); setTab('result');
    } catch (err) {
      alert('Submit failed: ' + (err.response?.data?.error || err.message));
    }
    setSubmitting(false);
  };

  const meta = SUBJECT_META[config.subject] || SUBJECT_META.Mathematics || Object.values(SUBJECT_META)[0];

  return (
    <div style={{ padding: '14px', paddingBottom: '80px', maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        /* font-size:16px prevents iOS auto-zoom */
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:white;font-family:'Nunito',sans-serif;font-size:16px;outline:none;cursor:pointer;width:100%;-webkit-appearance:none;}
        select option{background:#1a1a2e;}
        .q-tab{padding:11px 14px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;min-height:44px;}
        .q-tab.active{color:#ffd700;border-bottom-color:#ffd700;}
        .option-btn{width:100%;text-align:left;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:13px 14px;color:white;font-family:'Nunito',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;margin-bottom:10px;display:flex;align-items:center;gap:10px;min-height:50px;}
        .option-btn:hover,.option-btn:active{background:rgba(255,255,255,0.08);}
        .option-btn.selected{border-color:#4f8ef7;background:rgba(79,142,247,0.12);}
        .quiz-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .quiz-mode-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:12px;}
        @media(max-width:640px){
          .quiz-setup-grid{grid-template-columns:1fr!important;}
          .q-tab{padding:9px 10px;font-size:11px;}
          .quiz-mode-grid{grid-template-columns:repeat(3,1fr)!important;}
        }
        @media(max-width:360px){
          .quiz-mode-grid{grid-template-columns:repeat(3,1fr)!important;}
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ fontSize: 24 }}>📝</div>
        <div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 800 }}>Quiz Center</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>AI-generated quizzes for every chapter</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 20, overflowX: 'auto' }}>
        {[['setup','Take Quiz'],['history','My History'],['leaderboard','🏆 Leaders']].map(([t,lbl]) =>
          <button key={t} className={`q-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>{lbl}</button>
        )}
      </div>

      {/* ── SETUP ── */}
      {tab === 'setup' && (
        <div className="quiz-setup-grid">

          {/* Left: Settings */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 16 }}>⚙️ Settings</div>

            {/* Mode toggle — only show modes the user is registered for */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8 }}>MODE</label>
              <div className="quiz-mode-grid">
                {[
                  { id:'school', icon:'🏫', label:'School',   active: !isProfMode,  color:'#4f8ef7',  defaultGrade: isAdminOrTeacher(user) ? 'Class 7' : user?.grade, defaultSyl: 'CBSE' },
                  { id:'neet',   icon:'🩺', label:'NEET',      active: EXAM_MODES.includes(config.grade) && (config.grade.includes('NEET')), color:'#e74c3c', defaultGrade: 'NEET Preparation', defaultSyl: 'NEET' },
                  { id:'kcet',   icon:'🎯', label:'KCET',      active: config.grade === 'KCET Preparation', color:'#ffd700', defaultGrade: 'KCET Preparation', defaultSyl: 'KCET' },
                  { id:'iit',    icon:'⚙️', label:'IIT-JEE',   active: config.grade === 'IIT-JEE', color:'#4cc9f0', defaultGrade: 'IIT-JEE', defaultSyl: 'IIT-JEE' },
                  { id:'upsc',   icon:'🇮🇳', label:'UPSC',     active: isUPSCMode,   color:'#e67e22',  defaultGrade: 'UPSC Prelims', defaultSyl: 'UPSC' },
                  { id:'llb',    icon:'⚖️', label:'LLB',       active: isLLBMode,    color:'#c0392b',  defaultGrade: 'LLB Year 1', defaultSyl: 'LLB' },
                  { id:'rguhs',  icon:'🏥', label:'RGUHS',     active: isRGUHSMode,  color:'#16a085',  defaultGrade: 'MBBS Year 1', defaultSyl: 'RGUHS' },
                ]
                  // Students only see their own mode; admin sees all
                  .filter(m => isAdminOrTeacher(user) || accessibleModes.includes(m.id))
                  .map(m => {
                  const canUse = isAdminOrTeacher(user) || accessibleModes.includes(m.id);
                  return (
                    <button key={m.id}
                      disabled={!canUse}
                      onClick={() => {
                        if (!canUse) return;
                        const g = m.defaultGrade;
                        const s = m.defaultSyl;
                        setConfig(c => ({ ...c, grade: g, syllabus: s, subject: SUBJECTS_BY_GRADE[g]?.[0] || '', chapter: '' }));
                      }}
                      style={{ padding:'8px 4px', background: m.active ? m.color+'28' : 'rgba(255,255,255,0.04)', border:`1.5px solid ${m.active ? m.color : 'rgba(255,255,255,0.1)'}`, borderRadius:10, color: m.active ? m.color : 'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                      <span style={{ fontSize:14 }}>{m.icon}</span>
                      <span style={{ fontSize:10 }}>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* School: grade + syllabus dropdowns */}
              {!isProfMode && (
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:4 }}>GRADE</label>
                    {isAdminOrTeacher(user) ? (
                      <select value={config.grade} onChange={e => setConfig(c => ({ ...c, grade:e.target.value, subject:'', chapter:'' }))}>
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : (
                      <div style={{ padding:'9px 12px', background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10, color:'rgba(255,255,255,0.75)', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:12 }}>🔒</span> {user?.grade}
                      </div>
                    )}
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:4 }}>SYLLABUS</label>
                    <select value={config.syllabus} onChange={e => set('syllabus', e.target.value)}>
                      {SYLLABI.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Entrance exam sub-selector — admin sees all, student sees only their exam */}
              {isExamMode && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {EXAM_MODES
                    .filter(em => isAdminOrTeacher(user) || user?.grade === em || (em === 'NEET PG' && user?.grade === 'NEET Preparation'))
                    .map(em => {
                    const em_meta = EXAM_META[em];
                    const active  = config.grade === em;
                    const syllabusMap = { 'NEET Preparation':'NEET','KCET Preparation':'KCET','NEET PG':'NEET PG','IIT-JEE':'IIT-JEE' };
                    const firstSub = SUBJECTS_BY_GRADE[em]?.[0] || '';
                    return (
                      <button key={em} onClick={() => setConfig(c => ({ ...c, grade:em, syllabus:syllabusMap[em], subject:firstSub, chapter:'' }))}
                        style={{ padding:'10px 8px', background: active?em_meta.bg:'rgba(255,255,255,0.04)', border:`2px solid ${active?em_meta.color:'rgba(255,255,255,0.1)'}`, borderRadius:12, color: active?em_meta.color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                        <span style={{ fontSize:18 }}>{em_meta.icon}</span>
                        <span>{em_meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* UPSC: stage + optional selector */}
              {isUPSCMode && (
                <div>
                  <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:6 }}>UPSC STAGE</label>
                  <div style={{ display:'flex', gap:6, marginBottom:8 }}>
                    {[
                      ['UPSC Prelims',      'UPSC','📝 Prelims'],
                      ['UPSC Mains – GS',   'UPSC','📚 Mains GS'],
                      ['UPSC Mains – Essay','UPSC','✍️ Essay'],
                    ].map(([g,s,lbl]) => {
                      const active = config.grade === g;
                      return (
                        <button key={g} onClick={() => setConfig(c => ({ ...c, grade:g, syllabus:s, subject:SUBJECTS_BY_GRADE[g]?.[0]||'', chapter:'' }))}
                          style={{ flex:1, padding:'8px 4px', background: active?'rgba(230,126,34,0.2)':'rgba(255,255,255,0.04)', border:`1.5px solid ${active?'#e67e22':'rgba(255,255,255,0.1)'}`, borderRadius:10, color: active?'#e67e22':'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                  {/* Direct access to Mains/Essay writing practice */}
                  {(config.grade === 'UPSC Mains – GS' || config.grade === 'UPSC Mains – Essay') && (
                    <div style={{ padding:'12px 14px', background:'rgba(230,126,34,0.1)', border:'1.5px solid rgba(230,126,34,0.35)', borderRadius:12, marginBottom:8 }}>
                      <div style={{ color:'#e67e22', fontSize:12, fontWeight:800, marginBottom:6 }}>
                        {config.grade === 'UPSC Mains – GS' ? '📚 Mains Answer Writing Practice' : '✍️ Essay Writing Practice'}
                      </div>
                      <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, lineHeight:1.5, marginBottom:10 }}>
                        {config.grade === 'UPSC Mains – GS'
                          ? 'Write descriptive answers to 10/15/20-mark questions. Get AI evaluation with scores, model answers, and detailed feedback.'
                          : 'Write full essays on previous-year and AI-generated topics. Get dimension-wise scores, examiner notes, and model introductions.'}
                      </div>
                      <button onClick={() => navigate(`/upsc-writing?mode=${config.grade === 'UPSC Mains – Essay' ? 'essay' : 'mains'}`)}
                        style={{ width:'100%', padding:'10px', background:'linear-gradient(135deg,#e67e22,#f39c12)', border:'none', borderRadius:10, color:'#0d0d0d', fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:800, cursor:'pointer' }}>
                        Open {config.grade === 'UPSC Mains – Essay' ? 'Essay' : 'Mains'} Writing Practice →
                      </button>
                    </div>
                  )}

                  <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:6 }}>OPTIONAL SUBJECT</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {UPSC_META.stages.optional.grades.map(g => {
                      const lbl = UPSC_META.stages.optional.labels[g];
                      const active = config.grade === g;
                      return (
                        <button key={g} onClick={() => setConfig(c => ({ ...c, grade:g, syllabus:'UPSC', subject:SUBJECTS_BY_GRADE[g]?.[0]||'', chapter:'' }))}
                          style={{ padding:'6px 8px', background: active?'rgba(155,89,182,0.2)':'rgba(255,255,255,0.04)', border:`1.5px solid ${active?'#9b59b6':'rgba(255,255,255,0.1)'}`, borderRadius:8, color: active?'#c39bd3':'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LLB year selector */}
              {isLLBMode && (
                <div>
                  <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:6 }}>LLB YEAR</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {LLB_META.years.map(y => {
                      const active = config.grade === y;
                      return (
                        <button key={y} onClick={() => setConfig(c => ({ ...c, grade:y, syllabus:'LLB', subject:SUBJECTS_BY_GRADE[y]?.[0]||'', chapter:'' }))}
                          style={{ padding:'7px 10px', background: active?'rgba(192,57,43,0.2)':'rgba(255,255,255,0.04)', border:`1.5px solid ${active?'#c0392b':'rgba(255,255,255,0.1)'}`, borderRadius:10, color: active?'#e74c3c':'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          {LLB_META.yearLabels[y]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RGUHS programme + year selector */}
              {isRGUHSMode && (
                <div>
                  <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:6 }}>PROGRAMME</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                    {Object.entries(RGUHS_META.programs).map(([key, prog]) => {
                      const isActiveProg = prog.years.includes(config.grade);
                      return (
                        <button key={key} onClick={() => setConfig(c => ({ ...c, grade:prog.years[0], syllabus:'RGUHS', subject:SUBJECTS_BY_GRADE[prog.years[0]]?.[0]||'', chapter:'' }))}
                          style={{ padding:'7px 10px', background: isActiveProg?prog.color+'25':'rgba(255,255,255,0.04)', border:`1.5px solid ${isActiveProg?prog.color:'rgba(255,255,255,0.1)'}`, borderRadius:10, color: isActiveProg?prog.color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                          {prog.icon} {prog.label}
                        </button>
                      );
                    })}
                  </div>
                  <label style={{ color:'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, display:'block', marginBottom:6 }}>YEAR</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {(() => {
                      const activeProg = Object.values(RGUHS_META.programs).find(p => p.years.includes(config.grade));
                      if (!activeProg) return null;
                      return activeProg.years.map(y => {
                        const active = config.grade === y;
                        return (
                          <button key={y} onClick={() => setConfig(c => ({ ...c, grade:y, syllabus:'RGUHS', subject:SUBJECTS_BY_GRADE[y]?.[0]||'', chapter:'' }))}
                            style={{ padding:'7px 10px', background: active?activeProg.color+'25':'rgba(255,255,255,0.04)', border:`1.5px solid ${active?activeProg.color:'rgba(255,255,255,0.1)'}`, borderRadius:10, color: active?activeProg.color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                            {y}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>LANGUAGE</label>
              <select value={config.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>QUESTIONS</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5,10,15].map(n => (
                  <button key={n} onClick={() => set('count', n)}
                    style={{ flex: 1, padding: '9px', background: config.count===n?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.05)', border: `1.5px solid ${config.count===n?'#ffd700':'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: config.count===n?'#ffd700':'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
              {config.count === 15 && (
                <div style={{ fontSize:10, color:'rgba(255,215,0,0.5)', marginTop:4 }}>
                  ⚠ 15Q may take ~45s to generate
                </div>
              )}
            </div>

            {/* Question Type — course-aware options */}
            {(() => {
              const isEntranceOnly = ['NEET Preparation','KCET Preparation','NEET PG','IIT-JEE'].includes(config.grade);
              const isUPSCMains = ['UPSC Mains – GS','UPSC Mains – Essay'].includes(config.grade) || config.grade?.startsWith('Optional –');
              const isUPSCPrelims = config.grade === 'UPSC Prelims';
              const isLLB  = config.grade?.startsWith('LLB');
              const isRGUHS = isRGUHSMode;

              if (isEntranceOnly || isUPSCPrelims) return null; // objective only

              const qtOptions = isUPSCMains ? [
                { id:'mcq',       icon:'🔘', label:'MCQ',      desc:'4 options' },
                { id:'short',     icon:'✏️', label:'10 Mark',  desc:'150 words' },
                { id:'long',      icon:'📝', label:'15 Mark',  desc:'250 words' },
                { id:'extralong', icon:'📜', label:'20 Mark',  desc:'350 words' },
              ] : isLLB ? [
                { id:'mcq',   icon:'🔘', label:'MCQ',      desc:'4 options' },
                { id:'short', icon:'⚖️', label:'5 Mark',   desc:'IRAC format' },
                { id:'long',  icon:'📝', label:'10 Mark',  desc:'Legal essay' },
              ] : isRGUHS ? [
                { id:'mcq',   icon:'🔘', label:'MCQ',      desc:'4 options' },
                { id:'short', icon:'🩺', label:'5 Mark',   desc:'Clinical ans' },
                { id:'long',  icon:'📝', label:'10 Mark',  desc:'Essay answer' },
              ] : [
                { id:'mcq',   icon:'🔘', label:'MCQ',      desc:'4 options' },
                { id:'short', icon:'✏️', label:'Short Ans', desc:'3 marks' },
                { id:'long',  icon:'📝', label:'Long Ans',  desc:'5 marks' },
              ];

              return (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 6 }}>QUESTION TYPE</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {qtOptions.map(qt => (
                      <button key={qt.id} onClick={() => set('questionType', qt.id)}
                        style={{ flex: 1, padding: '8px 4px', background: config.questionType === qt.id ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${config.questionType === qt.id ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: config.questionType === qt.id ? '#ffd700' : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 14 }}>{qt.icon}</span>
                        <span>{qt.label}</span>
                        <span style={{ fontSize: 9, opacity: 0.6 }}>{qt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div style={{ marginBottom: 4 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>DIFFICULTY</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(DIFFICULTY_META).map(([k,v]) => (
                  <button key={k} onClick={() => set('difficulty', k)}
                    style={{ flex: 1, padding: '9px', background: config.difficulty===k?v.bg:'rgba(255,255,255,0.05)', border: `1.5px solid ${config.difficulty===k?v.color:'rgba(255,255,255,0.1)'}`, borderRadius: 10, color: config.difficulty===k?v.color:'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{v.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Subject + Chapter */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: 15, marginBottom: 14 }}>📚 Subject & Chapter</div>

            {/* Subject grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: 7, marginBottom: 16 }}>
              {subjects.map(sub => {
                const m = SUBJECT_META[sub] || { icon: '📖', color: '#fff', bg: '#ffffff18' };
                const active = config.subject === sub;
                return (
                  <button key={sub} onClick={() => set('subject', sub)}
                    style={{ padding: '8px 4px', background: active?m.bg:'rgba(255,255,255,0.04)', border: `1.5px solid ${active?m.color:'rgba(255,255,255,0.1)'}`, borderRadius: 12, color: active?m.color:'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <span style={{ lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Chapter dropdown */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>CHAPTER / TOPIC <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional — random if blank)</span></label>
              <select value={config.chapter} onChange={e => set('chapter', e.target.value)}>
                <option value="">🎲 Random chapter</option>
                {chapters.map(ch => <option key={ch} value={ch}>{ch.length > 55 ? ch.slice(0,55)+'…' : ch}</option>)}
              </select>
            </div>

            {/* Summary + Start */}
            <div style={{ marginTop: 'auto' }}>
              {config.subject ? (
                <div style={{ background: meta.bg, border: `1px solid ${meta.color}40`, borderRadius: 14, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{meta.icon}</span>
                  <div>
                    <div style={{ color: meta.color, fontWeight: 800, fontSize: 14 }}>{config.subject}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                      {config.grade} • {isExamMode ? examMeta?.label : config.syllabus} • {config.count}Q • {config.difficulty}
                    </div>
                    {config.chapter && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 2 }}>📌 {config.chapter.slice(0,45)}{config.chapter.length>45?'…':''}</div>}
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 14, color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' }}>
                  ← Select a subject to begin
                </div>
              )}
              <button onClick={startQuiz} disabled={generating || !config.subject}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 14, color: '#1a1a2e', fontSize: 15, fontWeight: 800, cursor: 'pointer', opacity: (generating||!config.subject)?0.6:1, fontFamily: "'Nunito',sans-serif" }}>
                {usingStatic ? '⚡ Start Instantly' : generating ? '⏳ Generating… (may take ~15s)' : isSchoolSyllabus && config.chapter ? '⚡ Start Quiz' : '🚀 Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {tab === 'quiz' && questions.length > 0 && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {questions.map((_, i) => (
              <div key={i} onClick={() => setCurrentQ(i)}
                style={{ flex: 1, height: 5, borderRadius: 3, cursor: 'pointer', transition: 'background 0.2s',
                  background: config.questionType === 'mcq'
                    ? (answers[i] !== undefined ? meta.color : 'rgba(255,255,255,0.12)')
                    : (evaluations[i] ? '#27ae60' : studentAnswers[i] ? meta.color : 'rgba(255,255,255,0.12)') }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Q {currentQ+1} of {questions.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {usingStatic && (
                <span style={{ padding: '2px 8px', background: 'rgba(82,183,136,0.12)', border: '1px solid rgba(82,183,136,0.3)', borderRadius: 8, color: '#52b788', fontSize: 10, fontWeight: 800 }}>
                  ⚡ Instant
                </span>
              )}
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                {config.questionType === 'mcq'
                  ? `${Object.keys(answers).length} answered`
                  : `${Object.keys(evaluations).length} evaluated`}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 16px', marginBottom: 16 }}>
            {/* Marks badge for descriptive */}
            {config.questionType !== 'mcq' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }}>
                  {config.questionType === 'short' ? 'SHORT ANSWER' : 'LONG ANSWER'} — Question {currentQ+1}
                </span>
                <span style={{ padding: '2px 10px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 8, color: '#ffd700', fontSize: 11, fontWeight: 800 }}>
                  {questions[currentQ]?.marks || (config.questionType === 'short' ? 3 : 5)} marks
                </span>
              </div>
            )}
            {config.questionType === 'mcq' && (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Question {currentQ+1}</div>
            )}

            <div style={{ color: 'white', fontSize: 15, fontWeight: 700, lineHeight: 1.6, marginBottom: 16 }}>
              {questions[currentQ]?.question}
            </div>

            {/* MCQ options */}
            {config.questionType === 'mcq' && questions[currentQ]?.options?.map((opt, i) => (
              <button key={i} className={`option-btn ${answers[currentQ]===i?'selected':''}`}
                onClick={() => setAnswers(a => ({...a,[currentQ]:i}))}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: answers[currentQ]===i?meta.color:'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: answers[currentQ]===i?'white':'rgba(255,255,255,0.6)', flexShrink: 0 }}>{['A','B','C','D'][i]}</span>
                <span style={{ lineHeight: 1.4, flex: 1, textAlign: 'left' }}>{opt}</span>
              </button>
            ))}

            {/* Descriptive answer textarea */}
            {config.questionType !== 'mcq' && (
              <div>
                {/* Hints */}
                {questions[currentQ]?.hints?.length > 0 && (
                  <div style={{ padding: '8px 12px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 10, marginBottom: 10 }}>
                    <div style={{ color: 'rgba(255,215,0,0.7)', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>💡 Hints</div>
                    {questions[currentQ].hints.map((h, i) => (
                      <div key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6 }}>• {h}</div>
                    ))}
                  </div>
                )}

                <textarea data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false"
                  value={studentAnswers[currentQ] || ''}
                  onChange={e => setStudentAnswers(a => ({...a, [currentQ]: e.target.value}))}
                  placeholder={
                    config.questionType === 'short' && ['UPSC Mains – GS','UPSC Mains – Essay'].includes(config.grade) ? 'Write your 10-mark answer (150 words)…'
                    : config.questionType === 'long' && ['UPSC Mains – GS','UPSC Mains – Essay'].includes(config.grade) ? 'Write your 15-mark answer (250 words)…'
                    : config.questionType === 'extralong' ? 'Write your 20-mark answer (300–350 words)…'
                    : config.questionType === 'short' ? 'Write your answer here (3–5 sentences)…'
                    : 'Write your detailed answer here (use paragraphs, cover all key points)…'}
                  style={{ width: '100%', minHeight: config.questionType === 'extralong' ? 320 : config.questionType === 'short' ? 140 : 240, padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: 14, lineHeight: 1.7, fontFamily: "'Nunito',sans-serif", resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                    {(studentAnswers[currentQ] || '').split(/\s+/).filter(Boolean).length} words
                  </span>
                  <button onClick={() => handleEvaluate(currentQ)} disabled={evaluating === currentQ}
                    style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 10, color: '#1a1a2e', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                    {evaluating === currentQ ? '⏳ Evaluating…' : '📊 Evaluate My Answer'}
                  </button>
                </div>

                {/* Evaluation result */}
                {evaluations[currentQ] && (
                  <div style={{ marginTop: 14, padding: '14px 16px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>Your Score</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: evaluations[currentQ].percentage >= 70 ? '#27ae60' : evaluations[currentQ].percentage >= 40 ? '#f39c12' : '#e74c3c' }}>
                        {evaluations[currentQ].score}/{questions[currentQ]?.marks || (config.questionType === 'short' ? 3 : 5)}
                      </span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>
                      {evaluations[currentQ].feedback}
                    </div>
                    {evaluations[currentQ].pointsCovered?.length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ color: '#27ae60', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>✓ Points covered</div>
                        {evaluations[currentQ].pointsCovered.map((p, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>• {p}</div>)}
                      </div>
                    )}
                    {evaluations[currentQ].pointsMissed?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ color: '#e74c3c', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>✗ Points missed</div>
                        {evaluations[currentQ].pointsMissed.map((p, i) => <div key={i} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>• {p}</div>)}
                      </div>
                    )}
                    <div style={{ padding: '8px 12px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 10 }}>
                      <span style={{ color: '#ffd700', fontSize: 11, fontWeight: 800 }}>💡 Improvement: </span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{evaluations[currentQ].improvement}</span>
                    </div>
                    {evaluations[currentQ].examinerNote && (
                      <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800 }}>🧑‍🏫 Examiner: </span>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontStyle: 'italic' }}>{evaluations[currentQ].examinerNote}</span>
                      </div>
                    )}
                    {/* Model answer toggle */}
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>📖 View model answer</summary>
                      <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.8 }}>
                        {questions[currentQ]?.modelAnswer}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(q=>q-1)} style={{ flex: 1, padding: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>← Prev</button>
            )}
            {currentQ < questions.length-1
              ? <button onClick={() => setCurrentQ(q=>q+1)} style={{ flex: 2, padding: 13, background: `linear-gradient(135deg,${meta.color},${meta.color}cc)`, border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Next →</button>
              : config.questionType === 'mcq'
                ? <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 12, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: submitting?0.7:1, fontFamily: "'Nunito',sans-serif" }}>{submitting?'Submitting...':'Submit ✓'}</button>
                : <button onClick={() => setTab('setup')} style={{ flex: 2, padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 12, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>✓ Done</button>
            }
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {tab === 'result' && result && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '24px 20px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 52, marginBottom: 10 }}>{result.score>=80?'🏆':result.score>=60?'🌟':result.score>=40?'📚':'💪'}</div>
            <div style={{ color: 'white', fontSize: 36, fontWeight: 900 }}>{result.score}%</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>{result.correct} / {result.total} correct</div>
            <div style={{ color: result.score>=80?'#27ae60':result.score>=60?'#f39c12':'#e74c3c', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
              {result.score>=80?'Excellent! Mastered this topic!':result.score>=60?'Good job! Keep practicing.':result.score>=40?'Getting there! Review and retry.':'Study the chapter and try again.'}
            </div>
            {result.newAchievements?.length > 0 && (
              <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 12, padding: '10px 16px', marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                {result.newAchievements.map((a,i) => <span key={i} style={{ fontSize: 13, color: '#ffd700' }}>{a.icon} {a.name}</span>)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {result.attempt?.answers?.map((a, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${a.isCorrect?'rgba(39,174,96,0.3)':'rgba(231,76,60,0.3)'}`, borderRadius: 16, padding: '16px 14px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{a.isCorrect?'✅':'❌'}</span>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>{a.question}</span>
                </div>
                {a.options.map((opt, j) => {
                  const isCorrect  = j === a.correctOption;
                  const isSelected = j === a.selectedOption;
                  const isWrong    = isSelected && !a.isCorrect;
                  const optExpl    = a.optionExplanations?.[j];
                  // Strip leading "Option X: " prefix that Claude adds
                  const cleanExpl  = optExpl ? optExpl.replace(/^Option\s+[A-D]:\s*/i, '') : '';
                  return (
                    <div key={j} style={{ marginBottom: 8 }}>
                      {/* Option row */}
                      <div style={{ padding: '8px 12px', borderRadius: 10, background: isCorrect ? 'rgba(39,174,96,0.1)' : isWrong ? 'rgba(231,76,60,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isCorrect ? 'rgba(39,174,96,0.4)' : isWrong ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: isCorrect ? '#27ae60' : isWrong ? '#e74c3c' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: (isCorrect||isWrong) ? 'white' : 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
                          {isCorrect ? '✓' : isWrong ? '✗' : ['A','B','C','D'][j]}
                        </span>
                        <span style={{ flex: 1, color: isCorrect ? '#52b788' : isWrong ? '#ff6b6b' : 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: isCorrect ? 700 : 400 }}>{opt}</span>
                        {isCorrect && <span style={{ fontSize: 10, color: '#52b788', fontWeight: 800, flexShrink: 0 }}>CORRECT</span>}
                        {isWrong  && <span style={{ fontSize: 10, color: '#ff6b6b', fontWeight: 800, flexShrink: 0 }}>YOUR ANSWER</span>}
                      </div>
                      {/* Per-option explanation */}
                      {cleanExpl && (
                        <div style={{ marginTop: 4, marginLeft: 10, padding: '7px 10px', borderLeft: `2px solid ${isCorrect ? 'rgba(39,174,96,0.4)' : 'rgba(255,255,255,0.1)'}`, color: isCorrect ? 'rgba(82,183,136,0.85)' : 'rgba(255,255,255,0.4)', fontSize: 11, lineHeight: 1.6 }}>
                          {cleanExpl}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Overall explanation */}
                {a.explanation && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 12 }}>
                    <div style={{ color: '#4f8ef7', fontSize: 11, fontWeight: 800, marginBottom: 4 }}>📖 Concept Explanation</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.65 }}>{a.explanation}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setTab('setup')} style={{ flex: 1, padding: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 13, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>New Quiz</button>
            <button onClick={startQuiz} disabled={generating} style={{ flex: 2, padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 13, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>{generating?'Generating… (~15s)':'Retry 🔄'}</button>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === 'history' && (
        <div>
          {history.length === 0
            ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>No quiz history yet. Take your first quiz!</div>
            : history.map(a => {
                const sm = SUBJECT_META[a.subject] || { icon:'📖', color:'#fff', bg:'#ffffff18' };
                const color = a.score>=80?'#27ae60':a.score>=50?'#f39c12':'#e74c3c';
                return (
                  <div key={a._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: sm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{sm.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.chapter || a.subject}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{a.subject} • {a.grade} • {new Date(a.completedAt).toLocaleDateString()}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color, fontSize: 18, fontWeight: 800 }}>{a.score}%</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{a.correctAnswers}/{a.totalQuestions}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {tab === 'leaderboard' && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>Top students for {config.grade}</div>
          {leaderboard.map((entry, i) => (
            <div key={i} style={{ background: i<3?'rgba(255,215,0,0.07)':'rgba(255,255,255,0.03)', border: `1px solid ${i<3?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '12px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20, minWidth: 28, textAlign: 'center' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
              <div style={{ fontSize: 20 }}>{entry.user?.avatar||'🧑‍🎓'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.user?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{entry.user?.grade} • {entry.totalQuizzes} quizzes</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#ffd700', fontSize: 18, fontWeight: 800 }}>{entry.avgScore}%</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>avg</div>
              </div>
            </div>
          ))}
          {leaderboard.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>No data yet. Be the first!</div>}
        </div>
      )}
    </div>
  );
}
