import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { generateQuiz, submitQuiz, getQuizHistory, getCurriculum, getLeaderboard } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE, DIFFICULTY_META, LANGUAGES, GRADES, SYLLABI, EXAM_META, EXAM_MODES } from '../utils/constants';

export default function QuizPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('setup');
  const [config, setConfig] = useState(() => {
    // URL param ?examMode=NEET+Preparation takes highest priority
    const examMode = params.get('examMode');
    if (examMode && EXAM_MODES.includes(examMode)) {
      const syllabus = examMode === 'NEET Preparation' ? 'NEET' : 'KCET';
      const subs = SUBJECTS_BY_GRADE[examMode] || [];
      return { grade: examMode, syllabus, subject: subs[0] || '', chapter: '', difficulty: 'medium', count: 5, language: user?.preferredLanguage || 'English' };
    }
    // Then user's own grade
    const grade = user?.grade || 'Class 7';
    const syllabus = EXAM_MODES.includes(grade)
      ? (grade === 'NEET Preparation' ? 'NEET' : 'KCET')
      : (user?.syllabus || 'CBSE');
    const subs = SUBJECTS_BY_GRADE[grade] || [];
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

  // Derive whether we're in exam mode
  const isExamMode = EXAM_MODES.includes(config.grade);
  const examMeta   = isExamMode ? EXAM_META[config.grade] : null;

  // Resolve syllabus key for exam modes
  const effectiveSyllabus = isExamMode
    ? (config.grade === 'NEET Preparation' ? 'NEET' : 'KCET')
    : config.syllabus;

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
      const r = await generateQuiz({ ...config, syllabus: effectiveSyllabus });
      setQuestions(r.data.questions);
      setAnswers({}); setResult(null); setCurrentQ(0);
      startTime.current = Date.now();
      setTab('quiz');
    } catch (err) {
      alert('Failed to generate quiz: ' + (err.response?.data?.error || err.message));
    }
    setGenerating(false);
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
    <div style={{ padding: '14px', maxWidth: 900, margin: '0 auto', fontFamily: "'Nunito',sans-serif" }}>
      <style>{`
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:white;font-family:'Nunito',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%;}
        select option{background:#1a1a2e;}
        .q-tab{padding:10px 14px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;white-space:nowrap;}
        .q-tab.active{color:#ffd700;border-bottom-color:#ffd700;}
        .option-btn{width:100%;text-align:left;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 14px;color:white;font-family:'Nunito',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;margin-bottom:10px;display:flex;align-items:center;gap:10px;}
        .option-btn:hover,.option-btn:active{background:rgba(255,255,255,0.08);}
        .option-btn.selected{border-color:#4f8ef7;background:rgba(79,142,247,0.12);}
        .quiz-setup-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .grade-mode-row{display:flex;gap:8px;flex-wrap:wrap;}
        @media(max-width:640px){
          .quiz-setup-grid{grid-template-columns:1fr!important;}
          .q-tab{padding:8px 10px;font-size:11px;}
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

            {/* Grade selector — school classes + exam modes */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>GRADE / EXAM</label>
              <select value={config.grade} onChange={e => {
                const g = e.target.value;
                const newSyllabus = g === 'NEET Preparation' ? 'NEET' : g === 'KCET Preparation' ? 'KCET' : config.syllabus;
                setConfig(c => ({ ...c, grade: g, syllabus: newSyllabus, subject: '', chapter: '' }));
              }}>
                <optgroup label="── School Classes ──">
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </optgroup>
                <optgroup label="── Entrance Exams ──">
                  {EXAM_MODES.map(e => <option key={e} value={e}>{e}</option>)}
                </optgroup>
              </select>
            </div>

            {/* Syllabus — hidden for exam modes */}
            {!isExamMode && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, display: 'block', marginBottom: 5 }}>SYLLABUS</label>
                <select value={config.syllabus} onChange={e => set('syllabus', e.target.value)}>
                  {SYLLABI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Exam mode badge */}
            {isExamMode && (
              <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: examMeta?.bg, border: `1px solid ${examMeta?.color}50`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{examMeta?.icon}</span>
                <div>
                  <div style={{ color: examMeta?.color, fontWeight: 800, fontSize: 13 }}>{examMeta?.fullLabel}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{examMeta?.description}</div>
                </div>
              </div>
            )}

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
                {generating ? '⏳ Generating...' : '🚀 Start Quiz'}
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
            <button onClick={startQuiz} disabled={generating} style={{ flex: 2, padding: 13, background: 'linear-gradient(135deg,#ffd700,#ff9500)', border: 'none', borderRadius: 13, color: '#1a1a2e', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>{generating?'Generating...':'Retry 🔄'}</button>
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
