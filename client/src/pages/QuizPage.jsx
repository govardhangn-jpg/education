import { useState, useEffect, useRef } from 'react';
import { generateQuiz, submitQuiz, getQuizHistory, getCurriculum, getLeaderboard } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE, DIFFICULTY_META, LANGUAGES } from '../utils/constants';

const GRADES = Array.from({length:10}, (_,i) => `Class ${i+1}`);
const SYLLABI = ['CBSE','ICSE','Karnataka State'];

export default function QuizPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('setup');
  const [config, setConfig] = useState({ grade:user?.grade||'Class 7', syllabus:user?.syllabus||'CBSE', subject:'Mathematics', chapter:'', difficulty:'medium', count:5, language:user?.preferredLanguage||'English' });
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const startTime = useRef(null);
  const set = (k,v) => setConfig(c=>({...c,[k]:v}));

  useEffect(() => {
    if (config.subject && config.grade && config.syllabus)
      getCurriculum({ grade:config.grade, syllabus:config.syllabus, subject:config.subject }).then(r=>setChapters(r.data.chapters||[])).catch(()=>{});
  }, [config.subject, config.grade, config.syllabus]);

  useEffect(() => {
    if (tab==='history') getQuizHistory({subject:config.subject,limit:20}).then(r=>setHistory(r.data.attempts||[])).catch(()=>{});
    if (tab==='leaderboard') getLeaderboard({grade:config.grade}).then(r=>setLeaderboard(r.data.leaderboard||[])).catch(()=>{});
  }, [tab]);

  const startQuiz = async () => {
    setGenerating(true);
    try {
      const r = await generateQuiz(config);
      setQuestions(r.data.questions); setAnswers({}); setResult(null); setCurrentQ(0);
      startTime.current = Date.now(); setTab('quiz');
    } catch(err) { alert('Failed to generate quiz: ' + (err.response?.data?.error || err.message)); }
    setGenerating(false);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const ansArr = questions.map((_,i) => answers[i] !== undefined ? answers[i] : -1);
      const r = await submitQuiz({ ...config, questions, answers:ansArr, timeTaken });
      setResult(r.data); setTab('result');
    } catch(err) { alert('Submit failed'); }
    setSubmitting(false);
  };

  const meta = SUBJECT_META[config.subject] || SUBJECT_META.English;

  return (
    <div style={{ padding:'24px 28px', maxWidth:900, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:white;font-family:'Nunito',sans-serif;font-size:13px;outline:none;cursor:pointer;width:100%;}
        select option{background:#1a1a2e;}
        .q-tab{padding:10px 20px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}
        .q-tab.active{color:#ffd700;border-bottom-color:#ffd700;}
        .option-btn{width:100%;text-align:left;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:12px;padding:13px 16px;color:white;font-family:'Nunito',sans-serif;font-size:14px;cursor:pointer;transition:all 0.2s;margin-bottom:10px;display:flex;align-items:center;gap:12px;}
        .option-btn:hover{background:rgba(255,255,255,0.08);}
        .option-btn.selected{border-color:#4f8ef7;background:rgba(79,142,247,0.12);}
        .option-btn.correct{border-color:#27ae60;background:rgba(39,174,96,0.15);}
        .option-btn.wrong{border-color:#e74c3c;background:rgba(231,76,60,0.12);}
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ fontSize:28 }}>📝</div>
        <div>
          <div style={{ color:'white', fontSize:22, fontWeight:800 }}>Quiz Center</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>AI-generated quizzes for every chapter</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:24 }}>
        {['setup','history','leaderboard'].map(t=><button key={t} className={`q-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{ textTransform:'capitalize' }}>{t==='setup'?'Take Quiz':t==='history'?'My History':'🏆 Leaderboard'}</button>)}
      </div>

      {tab==='setup' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:22 }}>
            <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:18 }}>⚙️ Quiz Settings</div>
            {[
              ['Grade', 'grade', GRADES],
              ['Syllabus', 'syllabus', SYLLABI],
              ['Language', 'language', ['English','Kannada','Hindi','Telugu','Tamil']],
            ].map(([label, key, options]) => (
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>{label.toUpperCase()}</label>
                <select value={config[key]} onChange={e=>set(key,e.target.value)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>QUESTIONS</label>
              <div style={{ display:'flex', gap:8 }}>
                {[5,10,15].map(n=><button key={n} onClick={()=>set('count',n)} style={{ flex:1, padding:'9px', background:config.count===n?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.05)', border:`1.5px solid ${config.count===n?'#ffd700':'rgba(255,255,255,0.1)'}`, borderRadius:10, color:config.count===n?'#ffd700':'rgba(255,255,255,0.6)', fontSize:14, fontWeight:700, cursor:'pointer' }}>{n}</button>)}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>DIFFICULTY</label>
              <div style={{ display:'flex', gap:8 }}>
                {Object.entries(DIFFICULTY_META).map(([d,dm])=><button key={d} onClick={()=>set('difficulty',d)} style={{ flex:1, padding:'9px', background:config.difficulty===d?dm.bg:'rgba(255,255,255,0.05)', border:`1.5px solid ${config.difficulty===d?dm.color:'rgba(255,255,255,0.1)'}`, borderRadius:10, color:config.difficulty===d?dm.color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, cursor:'pointer' }}>{dm.label}</button>)}
              </div>
            </div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:22 }}>
            <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:18 }}>📚 Subject & Chapter</div>
            <div style={{ marginBottom:14 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:8 }}>SUBJECT</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {(SUBJECTS_BY_GRADE[config.grade]||[]).map(sub=>{const sm=SUBJECT_META[sub];return(
                  <button key={sub} onClick={()=>set('subject',sub)} style={{ background:config.subject===sub?sm.bg:'rgba(255,255,255,0.04)', border:`1.5px solid ${config.subject===sub?sm.color:'rgba(255,255,255,0.1)'}`, borderRadius:12, padding:'7px 12px', color:config.subject===sub?sm.color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, cursor:'pointer' }}>{sm?.icon} {sub}</button>
                );})}
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>CHAPTER</label>
              <select value={config.chapter} onChange={e=>set('chapter',e.target.value)}>
                <option value="">-- All Chapters (Random) --</option>
                {chapters.map(ch=><option key={ch} value={ch}>{ch.length>55?ch.slice(0,55)+'…':ch}</option>)}
              </select>
            </div>
            <div style={{ background:`${meta.bg}`, border:`1px solid ${meta.color}30`, borderRadius:14, padding:16, marginBottom:18 }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{meta.icon}</div>
              <div style={{ color:'white', fontWeight:800 }}>{config.subject}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:2 }}>{config.chapter||'All chapters'} • {config.count} questions • {DIFFICULTY_META[config.difficulty]?.label}</div>
            </div>
            <button onClick={startQuiz} disabled={generating} style={{ width:'100%', background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:14, padding:14, color:'#1a1a2e', fontSize:15, fontWeight:800, cursor:'pointer', opacity:generating?0.7:1 }}>
              {generating ? '🤖 Generating quiz...' : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      )}

      {tab==='quiz' && questions.length > 0 && (
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          {/* Progress */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Question {currentQ+1} of {questions.length}</div>
            <div style={{ display:'flex', gap:6 }}>
              {questions.map((_,i)=><div key={i} style={{ width:28, height:6, borderRadius:3, background:i<currentQ?'#27ae60':i===currentQ?meta.color:'rgba(255,255,255,0.15)', cursor:'pointer' }} onClick={()=>setCurrentQ(i)}/>)}
            </div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>{Object.keys(answers).length}/{questions.length} answered</div>
          </div>

          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:28, marginBottom:18 }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:10 }}>Q{currentQ+1}</div>
            <div style={{ color:'white', fontSize:17, fontWeight:700, lineHeight:1.55, marginBottom:24 }}>{questions[currentQ]?.question}</div>
            {questions[currentQ]?.options?.map((opt,i)=>(
              <button key={i} className={`option-btn ${answers[currentQ]===i?'selected':''}`} onClick={()=>setAnswers(a=>({...a,[currentQ]:i}))}>
                <span style={{ width:28, height:28, borderRadius:'50%', background:`${answers[currentQ]===i?meta.color:'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:answers[currentQ]===i?'white':'rgba(255,255,255,0.6)', flexShrink:0 }}>{['A','B','C','D'][i]}</span>
                {opt}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            {currentQ > 0 && <button onClick={()=>setCurrentQ(q=>q-1)} style={{ flex:1, padding:13, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>← Previous</button>}
            {currentQ < questions.length-1
              ? <button onClick={()=>setCurrentQ(q=>q+1)} style={{ flex:2, padding:13, background:`linear-gradient(135deg,${meta.color},${meta.color}cc)`, border:'none', borderRadius:12, color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>Next →</button>
              : <button onClick={submit} disabled={submitting} style={{ flex:2, padding:13, background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:12, color:'#1a1a2e', fontSize:14, fontWeight:800, cursor:'pointer', opacity:submitting?0.7:1 }}>{submitting?'Submitting...':'Submit Quiz ✓'}</button>}
          </div>
        </div>
      )}

      {tab==='result' && result && (
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:24, padding:32, textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:60, marginBottom:12 }}>{result.score>=80?'🏆':result.score>=60?'🌟':result.score>=40?'📚':'💪'}</div>
            <div style={{ color:'white', fontSize:32, fontWeight:900 }}>{result.score}%</div>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:15, marginTop:4 }}>{result.correct} out of {result.total} correct</div>
            <div style={{ color:result.score>=80?'#27ae60':result.score>=60?'#f39c12':'#e74c3c', fontSize:14, fontWeight:700, marginTop:8 }}>{result.score>=80?'Excellent! You have mastered this!':result.score>=60?'Good job! Keep practicing.':result.score>=40?'Getting there! Review and try again.':'Need more practice. Study the chapter first.'}</div>
            {result.newAchievements?.length > 0 && (
              <div style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:12, padding:'12px 18px', marginTop:16, display:'inline-flex', gap:10, alignItems:'center' }}>
                {result.newAchievements.map((a,i)=><span key={i} style={{ fontSize:14, color:'#ffd700' }}>{a.icon} New: {a.name}</span>)}
              </div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
            {result.attempt?.answers?.map((a,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${a.isCorrect?'rgba(39,174,96,0.3)':'rgba(231,76,60,0.3)'}`, borderRadius:16, padding:18 }}>
                <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>{a.isCorrect?'✅':'❌'}</span>
                  <span style={{ color:'white', fontSize:14, fontWeight:700, lineHeight:1.5 }}>{a.question}</span>
                </div>
                {a.options.map((opt,j)=>(
                  <div key={j} style={{ padding:'7px 12px', borderRadius:9, marginBottom:5, background:j===a.correctOption?'rgba(39,174,96,0.12)':j===a.selectedOption&&!a.isCorrect?'rgba(231,76,60,0.1)':'transparent', border:`1px solid ${j===a.correctOption?'rgba(39,174,96,0.4)':j===a.selectedOption&&!a.isCorrect?'rgba(231,76,60,0.3)':'transparent'}`, color:'rgba(255,255,255,0.8)', fontSize:13, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{['A','B','C','D'][j]}</span>{opt}
                    {j===a.correctOption&&<span style={{ marginLeft:'auto', color:'#27ae60', fontSize:11, fontWeight:700 }}>✓ Correct</span>}
                    {j===a.selectedOption&&!a.isCorrect&&<span style={{ marginLeft:'auto', color:'#e74c3c', fontSize:11, fontWeight:700 }}>Your answer</span>}
                  </div>
                ))}
                {a.explanation && <div style={{ marginTop:10, padding:'10px 14px', background:'rgba(79,142,247,0.08)', border:'1px solid rgba(79,142,247,0.2)', borderRadius:10, color:'rgba(255,255,255,0.7)', fontSize:12.5, lineHeight:1.55 }}>💡 {a.explanation}</div>}
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setTab('setup')} style={{ flex:1, padding:13, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:13, color:'white', fontSize:14, fontWeight:700, cursor:'pointer' }}>New Quiz</button>
            <button onClick={startQuiz} disabled={generating} style={{ flex:2, padding:13, background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:13, color:'#1a1a2e', fontSize:14, fontWeight:800, cursor:'pointer' }}>{generating?'Generating...':'Retry This Quiz 🔄'}</button>
          </div>
        </div>
      )}

      {tab==='history' && (
        <div>
          {history.length===0?<div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', padding:40 }}>No quiz history yet. Take your first quiz!</div>
          :history.map(a=>{
            const sm=SUBJECT_META[a.subject]||SUBJECT_META.English;
            const color=a.score>=80?'#27ae60':a.score>=50?'#f39c12':'#e74c3c';
            return(
              <div key={a._id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 18px', marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:sm.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{sm.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'white', fontWeight:700, fontSize:14 }}>{a.chapter}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>{a.subject} • {a.grade} • {new Date(a.completedAt).toLocaleDateString()} • {a.totalQuestions}Q</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color, fontSize:20, fontWeight:800 }}>{a.score}%</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{a.correctAnswers}/{a.totalQuestions}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==='leaderboard' && (
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginBottom:16, textAlign:'center' }}>Top students by average quiz score for {config.grade}</div>
          {leaderboard.map((entry,i)=>(
            <div key={i} style={{ background:i<3?'rgba(255,215,0,0.07)':'rgba(255,255,255,0.03)', border:`1px solid ${i<3?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.08)'}`, borderRadius:14, padding:'14px 18px', marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:22, minWidth:32, textAlign:'center' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</div>
              <div style={{ fontSize:20 }}>{entry.user?.avatar||'🧑‍🎓'}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:'white', fontWeight:700, fontSize:14 }}>{entry.user?.name}</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{entry.user?.grade} • {entry.totalQuizzes} quizzes</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'#ffd700', fontSize:20, fontWeight:800 }}>{entry.avgScore}%</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>avg score</div>
              </div>
            </div>
          ))}
          {leaderboard.length===0&&<div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', padding:40 }}>No data yet. Be the first!</div>}
        </div>
      )}
    </div>
  );
}
