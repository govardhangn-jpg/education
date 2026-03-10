import { useState, useEffect } from 'react';
import { getProgress } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE, GRADES, SYLLABI, getSyllabusKey } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const STATUS_META = {
  'mastered':     { label:'Mastered',     icon:'🏆', color:'#27ae60', bg:'rgba(39,174,96,0.12)' },
  'learning':     { label:'Learning',     icon:'📖', color:'#f39c12', bg:'rgba(243,156,18,0.12)' },
  'needs-review': { label:'Needs Review', icon:'⚠️', color:'#e74c3c', bg:'rgba(231,76,60,0.1)' },
  'started':      { label:'Started',      icon:'▶️', color:'#4f8ef7', bg:'rgba(79,142,247,0.1)' },
  'not-started':  { label:'Not Started',  icon:'○',  color:'rgba(255,255,255,0.3)', bg:'transparent' },
};

export default function ProgressPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [grade, setGrade]       = useState(user?.grade || 'Class 7');
  const [syllabus, setSyllabus] = useState(user?.syllabus || 'CBSE');

  // getSyllabusKey handles ALL modes: NEET, KCET, LLB, RGUHS, UPSC, IIT-JEE, school
  const effectiveSyllabus = getSyllabusKey(grade) || syllabus;

  // Re-sync once user loads from auth (user starts as null on first render)
  useEffect(() => {
    if (!user) return;
    const g = user.grade || 'Class 7';
    setGrade(g);
    setSyllabus(getSyllabusKey(g) || user.syllabus || 'CBSE');
  }, [user?.grade]); // eslint-disable-line
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeSubject, setActiveSubject] = useState('');
  const [showSummary, setShowSummary]     = useState(false); // mobile: toggle summary panel

  const load = () => {
    setLoading(true);
    getProgress({ grade, syllabus: effectiveSyllabus })
      .then(r => {
        setData(r.data.progress);
        const subs = Object.keys(r.data.progress);
        if (subs.length) setActiveSubject(subs[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [grade, syllabus]);

  const allChapters = data?.[activeSubject] || [];
  const sm = SUBJECT_META[activeSubject] || SUBJECT_META.English;
  const countStatus = (s) => allChapters.filter(c => c.status === s).length;
  const pct = allChapters.length
    ? Math.round(((countStatus('mastered')*3 + countStatus('learning')*2 + countStatus('needs-review')*1.5 + countStatus('started')) / (allChapters.length*3)) * 100)
    : 0;

  return (
    <div style={{ padding:'14px', maxWidth:1000, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        /* font-size:16px prevents iOS auto-zoom */
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 10px;color:white;font-family:'Nunito',sans-serif;font-size:16px;outline:none;-webkit-appearance:none;}
        select option{background:#1a1a2e;}
        .prog-grid{display:grid;grid-template-columns:250px 1fr;gap:16px;}
        .sub-btn{padding:9px 12px;border-radius:12px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;border:1.5px solid;transition:all 0.15s;white-space:nowrap;min-height:40px;}
        @media(max-width:768px){
          .prog-grid{grid-template-columns:1fr!important;}
          .prog-summary{display:none;}
          .prog-summary.visible{display:block!important;}
          .progress-selects{flex-direction:column!important;align-items:stretch!important;width:100%!important;}
          .progress-selects select{width:100%!important;}
        }
        @media(max-width:480px){
          .sub-btn{padding:8px 10px;font-size:11px;}
        }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, gap:12, flexWrap:'wrap' }}>
        <div>
          <div style={{ color:'white', fontSize:20, fontWeight:800 }}>📊 My Progress</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>Chapter-wise learning journey</div>
        </div>
        <div className="progress-selects" style={{ display:'flex', gap:8, alignItems:'center' }}>
          <select value={grade} onChange={e => {
              const g = e.target.value;
              setGrade(g);
              setSyllabus(getSyllabusKey(g) || syllabus);
            }}>
            <optgroup label="── School Classes ──">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </optgroup>
            <optgroup label="── Entrance Exams ──">
              <option value="NEET Preparation">NEET Preparation</option>
              <option value="KCET Preparation">KCET Preparation</option>
            </optgroup>
          </select>
          {grade !== 'NEET Preparation' && grade !== 'KCET Preparation' && (
          <select value={syllabus} onChange={e => setSyllabus(e.target.value)}>
            {SYLLABI.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          )}
        </div>
      </div>

      {/* Subject tabs */}
      <div style={{ display:'flex', gap:7, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
        {(SUBJECTS_BY_GRADE[grade]||[]).map(sub => {
          const m = SUBJECT_META[sub] || { icon:'📖', color:'#4f8ef7', bg:'#4f8ef718' };
          const active = activeSubject === sub;
          const mastered = (data?.[sub]||[]).filter(c=>c.status==='mastered').length;
          return (
            <button key={sub} className="sub-btn" onClick={() => setActiveSubject(sub)}
              style={{ background:active?m.bg:'rgba(255,255,255,0.04)', borderColor:active?m.color:'rgba(255,255,255,0.1)', color:active?m.color:'rgba(255,255,255,0.6)' }}>
              <span>{m?.icon}</span><span>{sub}</span>
              {mastered > 0 && <span style={{ background:active?m.color:'rgba(39,174,96,0.2)', color:active?m.bg:'#27ae60', fontSize:10, padding:'1px 6px', borderRadius:10, fontWeight:800 }}>{mastered}✓</span>}
            </button>
          );
        })}
      </div>

      {/* Mobile: summary toggle */}
      <button onClick={() => setShowSummary(s=>!s)}
        style={{ display:'none', width:'100%', padding:'10px', marginBottom:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}
        id="sum-toggle">
        {showSummary ? '▲ Hide Summary' : '▼ Show Summary'} — {pct}% complete
      </button>
      <style>{`@media(max-width:700px){#sum-toggle{display:block!important;}}`}</style>

      {loading
        ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', padding:60 }}>Loading progress...</div>
        : data && (
          <div className="prog-grid">
            {/* Summary panel */}
            <div className={`prog-summary${showSummary?' visible':''}`}>
              <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:18, marginBottom:12 }}>
                <div style={{ fontSize:26, marginBottom:4 }}>{sm.icon}</div>
                <div style={{ color:'white', fontWeight:800, fontSize:15 }}>{activeSubject}</div>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>{allChapters.length} chapters</div>
                <div style={{ marginTop:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>Progress</span>
                    <span style={{ color:'white', fontWeight:800, fontSize:13 }}>{pct}%</span>
                  </div>
                  <div style={{ height:8, background:'rgba(255,255,255,0.08)', borderRadius:4 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${sm.color},${sm.color}99)`, borderRadius:4, transition:'width 0.5s' }}/>
                  </div>
                </div>
              </div>
              {Object.entries(STATUS_META).map(([k,v]) => {
                const count = countStatus(k);
                return count > 0 && (
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:v.bg, border:`1px solid ${v.color}30`, borderRadius:12, marginBottom:8 }}>
                    <span style={{ fontSize:13 }}>{v.icon}</span>
                    <span style={{ color:v.color, fontSize:12, fontWeight:700 }}>{v.label}</span>
                    <span style={{ marginLeft:'auto', color:v.color, fontWeight:800 }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Chapter list */}
            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:14, overflowY:'auto', maxHeight:550 }}>
              {allChapters.map((ch, i) => {
                const st = STATUS_META[ch.status] || STATUS_META['not-started'];
                return (
                  <div key={i}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:12, marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer' }}
                    onClick={() => navigate(`/chat?subject=${activeSubject}&chapter=${encodeURIComponent(ch.chapter)}`)}>
                    <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, minWidth:20, flexShrink:0 }}>{i+1}.</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ color:'white', fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ch.chapter}</div>
                      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:2 }}>
                        {ch.chatSessions > 0 && `${ch.chatSessions} chats `}
                        {ch.quizzesTaken > 0 && `• ${ch.quizzesTaken} quizzes `}
                        {ch.bestScore !== null && `• Best: ${ch.bestScore}%`}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
                      <span style={{ fontSize:12 }}>{st.icon}</span>
                      <span style={{ color:st.color, fontSize:10, fontWeight:700 }}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
              {allChapters.length === 0 && (
                <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', padding:40 }}>No chapters found for this selection.</div>
              )}
            </div>
          </div>
        )
      }

      {/* Legend */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:16, padding:'12px 14px', background:'rgba(255,255,255,0.02)', borderRadius:14 }}>
        <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700 }}>Legend:</span>
        {Object.entries(STATUS_META).map(([k,v])=>
          <span key={k} style={{ display:'flex', alignItems:'center', gap:4, color:v.color, fontSize:11 }}>{v.icon} {v.label}</span>
        )}
      </div>
    </div>
  );
}
