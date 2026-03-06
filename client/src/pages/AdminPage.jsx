import { useState, useEffect } from 'react';
import { getStudents, getAdminStats, toggleStudent, bulkCreateStudents } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkCSV, setBulkCSV] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    if (tab==='students') getStudents({ search, grade: gradeFilter, limit:50 }).then(r=>setStudents(r.data.students||[])).catch(console.error).finally(()=>setLoading(false));
    if (tab==='stats') getAdminStats().then(r=>setStats(r.data)).catch(console.error);
  }, [tab, search, gradeFilter]);

  const toggle = async (id) => {
    await toggleStudent(id);
    setStudents(s=>s.map(x=>x._id===id?{...x,isActive:!x.isActive}:x));
  };

  const handleBulkImport = async () => {
    try {
      const lines = bulkCSV.trim().split('\n').slice(1); // skip header
      const students = lines.map(line => {
        const [username,password,name,grade,syllabus,email] = line.split(',').map(s=>s.trim());
        return { username,password,name,grade,syllabus,email,avatar:'🧑‍🎓' };
      }).filter(s=>s.username);
      const r = await bulkCreateStudents({ students });
      setBulkResult(r.data);
    } catch(err) { alert('Import failed: '+err.message); }
  };

  if (!['admin','teacher'].includes(user?.role)) return <div style={{ padding:40, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>Access denied. Admin only.</div>;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        .admin-tab{padding:10px 20px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;}
        .admin-tab.active{color:#ffd700;border-bottom-color:#ffd700;}
        input,select,textarea{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:9px 12px;color:white;font-family:'Nunito',sans-serif;font-size:13px;outline:none;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3);}
        select option{background:#1a1a2e;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <span style={{ fontSize:28 }}>🛡️</span>
        <div>
          <div style={{ color:'white', fontSize:22, fontWeight:800 }}>Admin Panel</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>Logged in as: {user?.name} ({user?.role})</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:24 }}>
        {['students','stats','bulk'].map(t=><button key={t} className={`admin-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)} style={{ textTransform:'capitalize' }}>{t==='bulk'?'Bulk Import':t==='stats'?'📊 Platform Stats':t==='students'?'👥 Students':t}</button>)}
      </div>

      {tab==='students' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:18 }}>
            <input style={{ flex:1 }} placeholder="Search by name or username..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select style={{ width:160 }} value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)}>
              <option value="">All Classes</option>
              {Array.from({length:10},(_,i)=>`Class ${i+1}`).map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px' }}>
              <thead>
                <tr>{['Avatar','Name','Username','Grade','Syllabus','Language','Quizzes','Messages','Status','Action'].map(h=>(
                  <th key={h} style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textAlign:'left', padding:'0 12px 8px', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {students.map(s=>(
                  <tr key={s._id}>
                    {[
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'10px 0 0 10px', fontSize:22 }}>{s.avatar}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'white', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>{s.name}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.5)', fontSize:12 }}>{s.username}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.7)', fontSize:12 }}>{s.grade}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:12 }}>{s.syllabus}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:12 }}>{s.preferredLanguage}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'#27ae60', fontWeight:700, fontSize:13 }}>{s.totalQuizzesTaken||0}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', color:'#4f8ef7', fontWeight:700, fontSize:13 }}>{s.totalChatMessages||0}</td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)' }}>
                        <span style={{ background:s.isActive?'rgba(39,174,96,0.15)':'rgba(231,76,60,0.12)', color:s.isActive?'#27ae60':'#e74c3c', border:`1px solid ${s.isActive?'rgba(39,174,96,0.3)':'rgba(231,76,60,0.3)'}`, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:700 }}>{s.isActive?'Active':'Inactive'}</span>
                      </td>,
                      <td style={{ padding:'10px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'0 10px 10px 0' }}>
                        <button onClick={()=>toggle(s._id)} style={{ background:s.isActive?'rgba(231,76,60,0.12)':'rgba(39,174,96,0.12)', border:`1px solid ${s.isActive?'rgba(231,76,60,0.3)':'rgba(39,174,96,0.3)'}`, borderRadius:8, padding:'4px 12px', color:s.isActive?'#e74c3c':'#27ae60', fontSize:11, fontWeight:700, cursor:'pointer' }}>{s.isActive?'Deactivate':'Activate'}</button>
                      </td>
                    ].map((cell,i)=><span key={i}>{cell}</span>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length===0&&!loading&&<div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', padding:30 }}>No students found</div>}
          </div>
        </div>
      )}

      {tab==='stats' && stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
          {[
            { icon:'👥', label:'Total Students', value:stats.totalStudents, color:'#4f8ef7' },
            { icon:'🟢', label:'Active Today', value:stats.activeToday, color:'#27ae60' },
            { icon:'📝', label:'Total Quizzes', value:stats.totalQuizzes, color:'#9b59b6' },
            { icon:'💬', label:'Chat Sessions', value:stats.totalSessions, color:'#e67e22' },
            { icon:'⭐', label:'Avg Quiz Score', value:`${stats.avgQuizScore}%`, color:'#f39c12' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{s.icon}</div>
              <div><div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>{s.label}</div><div style={{ color:'white', fontSize:22, fontWeight:800 }}>{s.value}</div></div>
            </div>
          ))}
          <div style={{ gridColumn:'1/-1', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20 }}>
            <div style={{ color:'white', fontWeight:800, marginBottom:14 }}>Students by Grade</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {stats.gradeDistribution?.map(g=><div key={g._id} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 14px', color:'white', fontSize:13, fontWeight:700 }}>{g._id}: <span style={{ color:'#ffd700' }}>{g.count}</span></div>)}
            </div>
          </div>
        </div>
      )}

      {tab==='bulk' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:8 }}>📋 Bulk Student Import</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:16 }}>Paste CSV data to create multiple student accounts at once.</div>
          <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:14, marginBottom:16, fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.7 }}>
            <strong style={{ color:'#ffd700' }}>CSV Format:</strong><br/>
            username,password,name,grade,syllabus,email<br/>
            student_001,pass123,Ramya Gowda,Class 6,CBSE,ramya@school.com<br/>
            student_002,pass456,Vinod Kumar,Class 7,Karnataka State,vinod@school.com
          </div>
          <textarea style={{ width:'100%', height:180, resize:'vertical', lineHeight:1.6, marginBottom:14 }} placeholder="Paste CSV here (with header row)..." value={bulkCSV} onChange={e=>setBulkCSV(e.target.value)} />
          <button onClick={handleBulkImport} disabled={!bulkCSV.trim()} style={{ background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:12, padding:'12px 28px', color:'#1a1a2e', fontSize:14, fontWeight:800, cursor:'pointer' }}>Import Students</button>
          {bulkResult && (
            <div style={{ marginTop:16 }}>
              <div style={{ color:'#27ae60', fontWeight:700 }}>✅ Created: {bulkResult.created?.length}</div>
              {bulkResult.errors?.length>0&&<div style={{ color:'#e74c3c', marginTop:8 }}>❌ Errors ({bulkResult.errors.length}):{bulkResult.errors.map(e=><div key={e.username} style={{ fontSize:12, marginTop:4 }}>{e.username}: {e.error}</div>)}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
