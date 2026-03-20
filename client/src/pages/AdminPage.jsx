import { useState, useEffect } from 'react';
import { getStudents, getAdminStats, toggleStudent, bulkCreateStudents } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ALL_PROFESSIONAL_MODES } from '../utils/constants';
import { GRADES } from '../utils/constants';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]           = useState('students');
  const [students, setStudents] = useState([]);
  const [stats, setStats]       = useState(null);
  const [search, setSearch]     = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [bulkCSV, setBulkCSV]   = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    if (tab==='students') getStudents({ search, grade: gradeFilter, limit:50 }).then(r=>setStudents(r.data.students||[])).catch(console.error).finally(()=>setLoading(false));
    if (tab==='stats')    getAdminStats().then(r=>setStats(r.data)).catch(console.error);
  }, [tab, search, gradeFilter]);

  const toggle = async (id) => {
    await toggleStudent(id);
    setStudents(s => s.map(x => x._id===id ? {...x, isActive:!x.isActive} : x));
  };

  const handleBulkImport = async () => {
    try {
      const lines = bulkCSV.trim().split('\n').slice(1);
      const studs = lines.map(line => {
        const [username,password,name,grade,syllabus,email] = line.split(',').map(s=>s.trim());
        return { username, password, name, grade, syllabus, email, avatar:'🧑‍🎓' };
      }).filter(s=>s.username);
      const r = await bulkCreateStudents({ students: studs });
      setBulkResult(r.data);
    } catch(err) { alert('Import failed: ' + err.message); }
  };

  if (!['admin','teacher'].includes(user?.role))
    return <div style={{ padding:40, color:'rgba(255,255,255,0.5)', textAlign:'center' }}>Access denied.</div>;

  return (
    <div style={{ padding:'14px', paddingBottom:'80px', maxWidth:1100, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        .admin-tab{padding:10px 12px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;min-height:44px;}
        .admin-tab.active{color:#ffd700;border-bottom-color:#ffd700;}
        /* font-size:16px prevents iOS auto-zoom */
        input,select,textarea{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;color:white;font-family:'Nunito',sans-serif;font-size:16px;outline:none;-webkit-appearance:none;}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.3);}
        select option{background:#1a1a2e;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        /* Card style for mobile student list */
        .student-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;margin-bottom:10px;display:flex;align-items:center;gap:12px;}
        /* Desktop table */
        .student-table-wrap{display:block;}
        .student-cards-wrap{display:none;}
        @media(max-width:768px){
          .student-table-wrap{display:none!important;}
          .student-cards-wrap{display:block!important;}
          .admin-search-row{flex-direction:column!important;}
          .admin-search-row input,.admin-search-row select{width:100%!important;}
        }
      `}</style>

      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <span style={{ fontSize:24 }}>🛡️</span>
        <div>
          <div style={{ color:'white', fontSize:20, fontWeight:800 }}>Admin Panel</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:12 }}>{user?.name} ({user?.role})</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:20, overflowX:'auto' }}>
        {[['students','👥 Students'],['stats','📊 Stats'],['bulk','📋 Bulk Import'],['browse','🗺️ Browse Courses']].map(([t,lbl])=>
          <button key={t} className={`admin-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{lbl}</button>
        )}
      </div>

      {/* ── STUDENTS ── */}
      {tab==='students' && (
        <div>
          <div className="admin-search-row" style={{ display:'flex', gap:10, marginBottom:16 }}>
            <input style={{ flex:1, minWidth:0 }} placeholder="Search by name or username..." value={search} onChange={e=>setSearch(e.target.value)} />
            <select style={{ width:140 }} value={gradeFilter} onChange={e=>setGradeFilter(e.target.value)}>
              <option value="">All Classes</option>
              {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Desktop table */}
          <div className="student-table-wrap" style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0 6px', minWidth:680 }}>
              <thead>
                <tr>{['','Name','Username','Grade','Syllabus','Quizzes','Chats','Status',''].map((h,i)=>(
                  <th key={i} style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textAlign:'left', padding:'0 10px 8px', textTransform:'uppercase' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {students.map(s=>(
                  <tr key={s._id}>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'10px 0 0 10px', fontSize:20 }}>{s.avatar}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'white', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>{s.name}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.5)', fontSize:12 }}>{s.username}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.7)', fontSize:12 }}>{s.grade}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', fontSize:12 }}>{s.syllabus}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'#27ae60', fontWeight:700, fontSize:13 }}>{s.totalQuizzesTaken||0}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', color:'#4f8ef7', fontWeight:700, fontSize:13 }}>{s.totalChatMessages||0}</td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)' }}>
                      <span style={{ background:s.isActive?'rgba(39,174,96,0.15)':'rgba(231,76,60,0.12)', color:s.isActive?'#27ae60':'#e74c3c', borderRadius:8, padding:'3px 9px', fontSize:11, fontWeight:700 }}>{s.isActive?'Active':'Inactive'}</span>
                    </td>
                    <td style={{ padding:'9px 10px', background:'rgba(255,255,255,0.03)', borderRadius:'0 10px 10px 0' }}>
                      <button onClick={()=>toggle(s._id)} style={{ background:s.isActive?'rgba(231,76,60,0.12)':'rgba(39,174,96,0.12)', border:`1px solid ${s.isActive?'rgba(231,76,60,0.3)':'rgba(39,174,96,0.3)'}`, borderRadius:8, padding:'4px 11px', color:s.isActive?'#e74c3c':'#27ae60', fontSize:11, fontWeight:700, cursor:'pointer' }}>{s.isActive?'Disable':'Enable'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="student-cards-wrap">
            {students.map(s=>(
              <div key={s._id} className="student-card">
                <div style={{ fontSize:28, flexShrink:0 }}>{s.avatar}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'white', fontWeight:800, fontSize:14 }}>{s.name}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11 }}>@{s.username} • {s.grade} • {s.syllabus}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2 }}>
                    📝 {s.totalQuizzesTaken||0} quizzes &nbsp;•&nbsp; 💬 {s.totalChatMessages||0} chats
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
                  <span style={{ background:s.isActive?'rgba(39,174,96,0.15)':'rgba(231,76,60,0.12)', color:s.isActive?'#27ae60':'#e74c3c', borderRadius:8, padding:'3px 9px', fontSize:11, fontWeight:700 }}>{s.isActive?'Active':'Off'}</span>
                  <button onClick={()=>toggle(s._id)} style={{ background:s.isActive?'rgba(231,76,60,0.12)':'rgba(39,174,96,0.12)', border:`1px solid ${s.isActive?'rgba(231,76,60,0.3)':'rgba(39,174,96,0.3)'}`, borderRadius:8, padding:'4px 10px', color:s.isActive?'#e74c3c':'#27ae60', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{s.isActive?'Disable':'Enable'}</button>
                </div>
              </div>
            ))}
          </div>

          {students.length===0 && !loading && <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', padding:30 }}>No students found</div>}
        </div>
      )}

      {/* ── STATS ── */}
      {tab==='stats' && stats && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:16 }}>
            {[
              { icon:'👥', label:'Total Students', value:stats.totalStudents, color:'#4f8ef7' },
              { icon:'🟢', label:'Active Today',   value:stats.activeToday,   color:'#27ae60' },
              { icon:'📝', label:'Total Quizzes',  value:stats.totalQuizzes,  color:'#9b59b6' },
              { icon:'💬', label:'Chat Sessions',  value:stats.totalSessions, color:'#e67e22' },
              { icon:'⭐', label:'Avg Quiz Score', value:`${stats.avgQuizScore}%`, color:'#f39c12' },
            ].map((s,i)=>(
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px 14px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>{s.label}</div>
                  <div style={{ color:'white', fontSize:20, fontWeight:800 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:18 }}>
            <div style={{ color:'white', fontWeight:800, marginBottom:12 }}>Students by Grade</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {stats.gradeDistribution?.map(g=>(
                <div key={g._id} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'7px 12px', color:'white', fontSize:12, fontWeight:700 }}>
                  {g._id}: <span style={{ color:'#ffd700' }}>{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BULK IMPORT ── */}
      {tab==='bulk' && (
        <div style={{ maxWidth:680 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:6 }}>📋 Bulk Student Import</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:14 }}>Paste CSV data to create multiple student accounts at once.</div>
          <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:14, marginBottom:14, fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.8 }}>
            <strong style={{ color:'#ffd700' }}>CSV Format:</strong><br/>
            username,password,name,grade,syllabus,email<br/>
            student_001,pass123,Ramya Gowda,Class 6,CBSE,ramya@school.com
          </div>
          <textarea style={{ width:'100%', height:160, resize:'vertical', lineHeight:1.6, marginBottom:12 }} placeholder="Paste CSV here (with header row)..." value={bulkCSV} onChange={e=>setBulkCSV(e.target.value)} />
          <button onClick={handleBulkImport} disabled={!bulkCSV.trim()} style={{ background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:12, padding:'12px 24px', color:'#1a1a2e', fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Import Students</button>
          {bulkResult && (
            <div style={{ marginTop:14 }}>
              <div style={{ color:'#27ae60', fontWeight:700 }}>✅ Created: {bulkResult.created?.length}</div>
              {bulkResult.errors?.length > 0 && (
                <div style={{ color:'#e74c3c', marginTop:8 }}>
                  ❌ Errors ({bulkResult.errors.length}):
                  {bulkResult.errors.map(e=><div key={e.username} style={{ fontSize:12, marginTop:4 }}>{e.username}: {e.error}</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ── BROWSE ALL COURSES (admin only) ── */}
      {tab==='browse' && (
        <div>
          <div style={{ padding:'14px 16px', background:'rgba(230,126,34,0.1)', border:'1px solid rgba(230,126,34,0.25)', borderRadius:14, marginBottom:20 }}>
            <div style={{ color:'#e67e22', fontSize:13, fontWeight:800, marginBottom:4 }}>Admin Course Browser</div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6 }}>
              As admin you can access and explore any course. Click a course to open it in Chat or Quiz.
            </div>
          </div>

          {[
            { label:'School Grades', color:'#4f8ef7', icon:'🏫',
              items: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'].map(g => ({ grade:g, syllabus:'CBSE' }))
            },
            { label:'Entrance Exams', color:'#ffd700', icon:'🎯',
              items: [
                { grade:'IIT-JEE', syllabus:'IIT-JEE' },
                { grade:'NEET Preparation', syllabus:'NEET' },
                { grade:'KCET Preparation', syllabus:'KCET' },
                { grade:'NEET PG', syllabus:'NEET PG' },
              ]
            },
            { label:'UPSC Civil Services', color:'#e67e22', icon:'🇮🇳',
              items: [
                { grade:'UPSC Prelims', syllabus:'UPSC' },
                { grade:'UPSC Mains – GS', syllabus:'UPSC' },
                { grade:'UPSC Mains – Essay', syllabus:'UPSC' },
              ]
            },
            { label:'LLB – Law', color:'#c0392b', icon:'⚖️',
              items: ['LLB Year 1','LLB Year 2','LLB Year 3','LLB Year 4','LLB Year 5'].map(g => ({ grade:g, syllabus:'LLB' }))
            },
            { label:'RGUHS – Medical', color:'#16a085', icon:'🏥',
              items: [
                { grade:'MBBS Year 1', syllabus:'RGUHS' },
                { grade:'MBBS Year 2', syllabus:'RGUHS' },
                { grade:'MBBS Year 3 Part 1', syllabus:'RGUHS' },
                { grade:'MBBS Final Year', syllabus:'RGUHS' },
                { grade:'BDS Year 1', syllabus:'RGUHS' },
                { grade:'BDS Year 2', syllabus:'RGUHS' },
                { grade:'BDS Final Year', syllabus:'RGUHS' },
                { grade:'B.Pharm Year 1', syllabus:'RGUHS' },
                { grade:'B.Pharm Year 2', syllabus:'RGUHS' },
                { grade:'BSc Nursing Year 1', syllabus:'RGUHS' },
                { grade:'BSc Nursing Year 2', syllabus:'RGUHS' },
              ]
            },
          ].map(group => (
            <div key={group.label} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:18 }}>{group.icon}</span>
                <span style={{ color:group.color, fontSize:14, fontWeight:800 }}>{group.label}</span>
                <span style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>{group.items.length} courses</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {group.items.map(item => (
                  <div key={item.grade} style={{ display:'flex', gap:4 }}>
                    <button onClick={() => navigate(`/chat?examMode=${encodeURIComponent(item.grade)}`)}
                      style={{ padding:'8px 12px', background:'rgba(255,255,255,0.04)', border:`1px solid ${group.color}40`, borderRadius:10, color:'rgba(255,255,255,0.7)', fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, cursor:'pointer' }}
                      title="Open in Chat">
                      💬 {item.grade}
                    </button>
                    <button onClick={() => navigate(`/quiz?examMode=${encodeURIComponent(item.grade)}`)}
                      style={{ padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${group.color}40`, borderRadius:10, color:'rgba(255,255,255,0.5)', fontFamily:"'Nunito',sans-serif", fontSize:11, cursor:'pointer' }}
                      title="Open in Quiz">
                      📝
                    </button>
                    {(item.grade === 'UPSC Mains – GS' || item.grade === 'UPSC Mains – Essay') && (
                      <button onClick={() => navigate(`/upsc-writing?mode=${item.grade.includes('Essay') ? 'essay' : 'mains'}`)}
                        style={{ padding:'8px 10px', background:'rgba(230,126,34,0.1)', border:`1px solid rgba(230,126,34,0.3)`, borderRadius:10, color:'#e67e22', fontFamily:"'Nunito',sans-serif", fontSize:11, cursor:'pointer' }}
                        title="Open Writing Practice">
                        ✍️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Always-open features */}
          <div style={{ padding:'14px 16px', background:'rgba(82,183,136,0.08)', border:'1px solid rgba(82,183,136,0.2)', borderRadius:14 }}>
            <div style={{ color:'#52b788', fontSize:12, fontWeight:800, marginBottom:10 }}>Open to all users</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label:'🧭 Life Skills', path:'/life-skills' },
                { label:'🕯️ Digital Legacy', path:'/legacy' },
                { label:'📊 Progress', path:'/progress' },
              ].map(p => (
                <button key={p.path} onClick={() => navigate(p.path)}
                  style={{ padding:'8px 14px', background:'rgba(82,183,136,0.1)', border:'1px solid rgba(82,183,136,0.25)', borderRadius:10, color:'#52b788', fontFamily:"'Nunito',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
