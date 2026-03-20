import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateQuiz, submitQuiz, getQuizHistory, getCurriculum, getLeaderboard } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE, DIFFICULTY_META, LANGUAGES, GRADES, SYLLABI,
         EXAM_META, EXAM_MODES, LLB_META, LLB_MODES, RGUHS_META, RGUHS_MODES,
         UPSC_META, UPSC_GRADES,
         ALL_PROFESSIONAL_MODES, getSyllabusKey } from '../utils/constants';
import { isAdminOrTeacher, getAccessibleModes, accessLabel } from '../utils/access';

export default function QuizPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const accessibleModes = getAccessibleModes(user);
  const [tab, setTab] = useState('setup');

  const [config, setConfig] = useState(() => {
    // URL param ?examMode=... takes highest priority (works for NEET/KCET/LLB/RGUHS)
    const urlMode = params.get('examMode');
    if (urlMode && ALL_PROFESSIONAL_MODES.includes(urlMode)) {
      const syllabus = getSyllabusKey(urlMode) || 'CBSE';
      const subs = SUBJECTS_BY_GRADE[urlMode] || [];
      return { grade: urlMode, syllabus, subject: subs[0] || '', chapter: '', difficulty: 'medium', count: 5, language: user?.preferredLanguage || 'English' };
    }
    const grade    = user?.grade    || 'Class 7';
    const syllabus = getSyllabusKey(grade) || user?.syllabus || 'CBSE';
    const subs     = SUBJECTS_BY_GRADE[grade] || [];
    return { grade, syllabus, subject: subs[0] || '', chapter: '', difficulty: 'medium', count: 5, language: user?.preferredLanguage || 'English' };
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
  const startTime = useRef(null);

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }));

  // Classify current mode
  const isExamMode  = EXAM_MODES.includes(config.grade);
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

  const startQuiz = async () => {
    if (!config.subject) return alert('Please select a subject first.');
    setGenerating(true);
    try {
      // 50s client-side timeout — matches server timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Quiz generation timed out. Please try again.')), 50000)
      );
      const r = await Promise.race([
        generateQuiz({ ...config, syllabus: effectiveSyllabus }),
        timeoutPromise,
      ]);
      setQuestions(r.data.questions);
      setAnswers({}); setResult(null); setCurrentQ(0);
      startTime.current = Date.now();
      setTab('quiz');
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.error || err.message || 'Failed to generate quiz.';
      alert(msg);
    } finally {
      setGenerating(false);
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

            {/* Mode toggle: 5 modes */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 8 }}>MODE</label>
              <div className="quiz-mode-grid">
                {[
                  { id:'school', icon:'🏫', label:'School',  active: !isProfMode,  color:'#4f8ef7' },
                  { id:'exam',   icon:'🎯', label:'Entrance', active: isExamMode,  color:'#ffd700' },
                  { id:'upsc',   icon:'🇮🇳', label:'UPSC',    active: isUPSCMode,  color:'#e67e22' },
                  { id:'llb',    icon:'⚖️', label:'LLB',      active: isLLBMode,   color:'#c0392b' },
                  { id:'rguhs',  icon:'🏥', label:'RGUHS',    active: isRGUHSMode, color:'#16a085' },
                ].map(m => (
                  <button key={m.id}
                    disabled={!accessibleModes.includes(m.id)}
                    title={!accessibleModes.includes(m.id) ? `Locked to ${accessLabel(user)}` : ''}
                    onClick={() => {
                    if (!accessibleModes.includes(m.id)) return;
                    if (m.id === 'school') setConfig(c => ({ ...c, grade: isAdminOrTeacher(user) ? 'Class 7' : user.grade, syllabus:'CBSE', subject:'', chapter:'' }));
                    if (m.id === 'exam')   setConfig(c => ({ ...c, grade:'IIT-JEE',     syllabus:'IIT-JEE', subject:'Physics', chapter:'' }));
                    if (m.id === 'upsc')   setConfig(c => ({ ...c, grade:'UPSC Prelims',syllabus:'UPSC',    subject:SUBJECTS_BY_GRADE['UPSC Prelims'][0], chapter:'' }));
                    if (m.id === 'llb')    setConfig(c => ({ ...c, grade:'LLB Year 1',  syllabus:'LLB',     subject:SUBJECTS_BY_GRADE['LLB Year 1'][0], chapter:'' }));
                    if (m.id === 'rguhs')  setConfig(c => ({ ...c, grade:'MBBS Year 1', syllabus:'RGUHS',   subject:SUBJECTS_BY_GRADE['MBBS Year 1'][0], chapter:'' }));
                  }} style={{ padding:'8px 4px', background: m.active ? m.color+'28' : 'rgba(255,255,255,0.04)', border:`1.5px solid ${m.active ? m.color : 'rgba(255,255,255,0.1)'}`, borderRadius:10, color: m.active ? m.color : !accessibleModes.includes(m.id) ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, cursor:accessibleModes.includes(m.id) ? 'pointer' : 'not-allowed', display:'flex', flexDirection:'column', alignItems:'center', gap:3, opacity: accessibleModes.includes(m.id) ? 1 : 0.4, position:'relative' }}>
                    <span style={{ fontSize:14 }}>{m.icon}</span>
                    <span style={{ fontSize:10 }}>{m.label}</span>
                  </button>
                ))}
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

              {/* Entrance exam selector: IIT-JEE / NEET / KCET / NEET PG */}
              {isExamMode && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {EXAM_MODES.map(em => {
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
            </div>

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
                {generating ? '⏳ Generating… (may take ~15s)' : '🚀 Start Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {tab === 'quiz' && questions.length > 0 && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {questions.map((_, i) => (
              <div key={i} onClick={() => setCurrentQ(i)}
                style={{ flex: 1, height: 5, borderRadius: 3, background: answers[i]!==undefined ? meta.color : 'rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'background 0.2s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Q {currentQ+1} of {questions.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{Object.keys(answers).length} answered</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px 16px', marginBottom: 16 }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Question {currentQ+1}</div>
            <div style={{ color: 'white', fontSize: 15, fontWeight: 700, lineHeight: 1.6, marginBottom: 20 }}>{questions[currentQ]?.question}</div>
            {questions[currentQ]?.options?.map((opt, i) => (
              <button key={i} className={`option-btn ${answers[currentQ]===i?'selected':''}`} onClick={() => setAnswers(a => ({...a,[currentQ]:i}))}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: answers[currentQ]===i?meta.color:'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: answers[currentQ]===i?'white':'rgba(255,255,255,0.6)', flexShrink: 0 }}>{['A','B','C','D'][i]}</span>
                <span style={{ lineHeight: 1.4, flex: 1, textAlign: 'left' }}>{opt}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {currentQ > 0 && (
              <button onClick={() => setCurrentQ(q=>q-1)} style={{ flex: 1, padding: 13, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>← Prev</button>
            )}
            {currentQ < questions.length-1
              ? <button onClick={() => setCurrentQ(q=>q+1)} style={{ flex: 2, padding: 13, background: `linear-gradient(135deg,${meta.color},${meta.color}cc)`, border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>Next →</button>
              : <button onClick={submit} disabled={submitting} style={{ flex: 2, padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 12, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', opacity: submitting?0.7:1, fontFamily: "'Nunito',sans-serif" }}>{submitting?'Submitting...':'Submit ✓'}</button>
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
                {a.options.map((opt, j) => (
                  <div key={j} style={{ padding: '7px 10px', borderRadius: 9, marginBottom: 5, background: j===a.correctOption?'rgba(39,174,96,0.12)':j===a.selectedOption&&!a.isCorrect?'rgba(231,76,60,0.1)':'transparent', border: `1px solid ${j===a.correctOption?'rgba(39,174,96,0.4)':j===a.selectedOption&&!a.isCorrect?'rgba(231,76,60,0.3)':'transparent'}`, color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{['A','B','C','D'][j]}</span>
                    <span style={{ flex: 1 }}>{opt}</span>
                    {j===a.correctOption && <span style={{ color: '#27ae60', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</span>}
                    {j===a.selectedOption && !a.isCorrect && <span style={{ color: '#e74c3c', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✗</span>}
                  </div>
                ))}
                {a.explanation && <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 10, color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.55 }}>💡 {a.explanation}</div>}
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
