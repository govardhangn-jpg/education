import { useState, useEffect } from 'react';
import { getProgress } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, SUBJECTS_BY_GRADE } from '../utils/constants';
import { useNavigate } from 'react-router-dom';

const STATUS_META = {
  'mastered':    { label:'Mastered',    icon:'🏆', color:'#27ae60', bg:'rgba(39,174,96,0.12)' },
  'learning':    { label:'Learning',    icon:'📖', color:'#f39c12', bg:'rgba(243,156,18,0.12)' },
  'needs-review':{ label:'Needs Review',icon:'⚠️', color:'#e74c3c', bg:'rgba(231,76,60,0.1)' },
  'started':     { label:'Started',     icon:'▶️', color:'#4f8ef7', bg:'rgba(79,142,247,0.1)' },
  'not-started': { label:'Not Started', icon:'○',  color:'rgba(255,255,255,0.3)', bg:'transparent' },
};

export default function ProgressPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(user?.grade||'Class 7');
  const [syllabus, setSyllabus] = useState(user?.syllabus||'CBSE');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState('');

  const load = () => {
    setLoading(true);
    getProgress({ grade, syllabus }).then(r=>{ setData(r.data.progress); const subs=Object.keys(r.data.progress); if(subs.length) setActiveSubject(subs[0]); }).catch(console.error).finally(()=>setLoading(false));
  };

  useEffect(load, [grade, syllabus]);

  const allChapters = data?.[activeSubject] || [];
  const sm = SUBJECT_META[activeSubject] || SUBJECT_META.English;

  const countStatus = (status) => allChapters.filter(c=>c.status===status).length;
  const pct = allChapters.length ? Math.round(((countStatus('mastered')*3 + countStatus('learning')*2 + countStatus('needs-review')*1.5 + countStatus('started')) / (allChapters.length*3))*100) : 0;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1000, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:white;font-family:'Nunito',sans-serif;font-size:13px;outline:none;}select option{background:#1a1a2e;}`}</style>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ color:'white', fontSize:22, fontWeight:800 }}>📊 My Progress</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>Chapter-wise learning journey</div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <select value={grade} onChange={e=>setGrade(e.target.value)}>
            {Array.from({length:10},(_,i)=>`Class ${i+1}`).map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <select value={syllabus} onChange={e=>setSyllabus(e.target.value)}>
            {['CBSE','ICSE','Karnataka State'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Subject tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {(SUBJECTS_BY_GRADE[grade]||[]).map(sub=>{
          const m=SUBJECT_META[sub]; const active=activeSubject===sub;
          const subData=data?.[sub]||[];
          const mastered=subData.filter(c=>c.status==='mastered').length;
          return(
            <button key={sub} onClick={()=>setActiveSubject(sub)} style={{ background:active?m.bg:'rgba(255,255,255,0.04)', border:`1.5px solid ${active?m.color:'rgba(255,255,255,0.1)'}`, borderRadius:14, padding:'9px 14px', color:active?m.color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <span>{m?.icon}</span><span>{sub}</span>
              {mastered>0&&<span style={{ background:active?m.color:'rgba(39,174,96,0.2)', color:active?m.bg:'#27ae60', fontSize:10, padding:'1px 7px', borderRadius:10, fontWeight:800 }}>{mastered}✓</span>}
            </button>
          );
        })}
      </div>

      {loading ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.4)', padding:60 }}>Loading progress...</div> : data && (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
          {/* Summary */}
          <div>
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:28, marginBottom:4 }}>{sm.icon}</div>
              <div style={{ color:'white', fontWeight:800, fontSize:16 }}>{activeSubject}</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>{allChapters.length} chapters</div>
              <div style={{ marginTop:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>Overall Progress</span>
                  <span style={{ color:'white', fontWeight:800, fontSize:14 }}>{pct}%</span>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,0.08)', borderRadius:4 }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${sm.color},${sm.color}99)`, borderRadius:4, transition:'width 0.5s' }}/>
                </div>
              </div>
            </div>
            {Object.entries(STATUS_META).map(([k,v])=>{
              const count=countStatus(k);
              return count>0&&(
                <div key={k} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:v.bg, border:`1px solid ${v.color}30`, borderRadius:12, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>{v.icon}</span>
                  <span style={{ color:v.color, fontSize:12, fontWeight:700 }}>{v.label}</span>
                  <span style={{ marginLeft:'auto', color:v.color, fontWeight:800 }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Chapter list */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:18, overflowY:'auto', maxHeight:520 }}>
            {allChapters.map((ch,i)=>{
              const st=STATUS_META[ch.status]||STATUS_META['not-started'];
              return(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onClick={()=>navigate(`/chat?subject=${activeSubject}&chapter=${encodeURIComponent(ch.chapter)}`)}>
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, minWidth:24 }}>{i+1}.</div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'white', fontSize:13, fontWeight:700 }}>{ch.chapter}</div>
                    <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:2 }}>
                      {ch.chatSessions>0 && `${ch.chatSessions} chats `}
                      {ch.quizzesTaken>0 && `• ${ch.quizzesTaken} quizzes `}
                      {ch.bestScore!==null && `• Best: ${ch.bestScore}%`}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:13 }}>{st.icon}</span>
                    <span style={{ color:st.color, fontSize:11, fontWeight:700 }}>{st.label}</span>
                  </div>
                  <div style={{ color:'rgba(79,142,247,0.7)', fontSize:11, fontWeight:700 }}>Study →</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginTop:20, padding:'14px 18px', background:'rgba(255,255,255,0.02)', borderRadius:14 }}>
        <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700 }}>Legend:</span>
        {Object.entries(STATUS_META).map(([k,v])=><span key={k} style={{ display:'flex', alignItems:'center', gap:5, color:v.color, fontSize:11 }}>{v.icon} {v.label}</span>)}
      </div>
    </div>
  );
}
