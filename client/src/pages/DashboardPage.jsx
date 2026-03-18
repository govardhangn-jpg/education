import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META, EXAM_META, EXAM_MODES, SUBJECTS_BY_GRADE } from '../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const isExamMode = EXAM_MODES.includes(user?.grade);
  const examMeta   = isExamMode ? EXAM_META[user?.grade] : null;

  // Quick-start subjects: show subjects relevant to the user's grade
  const quickStartSubjects = (() => {
    const subs = SUBJECTS_BY_GRADE[user?.grade] || [];
    if (subs.length) return subs.slice(0, 6);
    // fallback
    return Object.keys(SUBJECT_META).slice(0, 6);
  })();

  const statCard = (icon, label, value, color) => (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'16px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:600 }}>{label}</div>
        <div style={{ color:'white', fontSize:20, fontWeight:800 }}>{value}</div>
      </div>
    </div>
  );

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'white', fontSize:16 }}>Loading...</div>;

  const avgQuiz = data?.quizStats?.length ? Math.round(data.quizStats.reduce((s,q)=>s+q.avgScore,0)/data.quizStats.length) : 0;

  // Grade display label
  const gradeLabel = isExamMode ? examMeta?.fullLabel : user?.grade;
  const syllabusLabel = isExamMode ? examMeta?.badge : user?.syllabus;

  return (
    <div style={{ padding:'16px', paddingBottom:'80px', maxWidth:1100, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        .dash-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;}
        .exam-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
        .quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;}
        .welcome-card{border-radius:20px;padding:16px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;}
        @media(max-width:768px){
          .dash-grid-2{grid-template-columns:1fr!important;}
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
        }
        @media(max-width:480px){
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
          .quick-grid{grid-template-columns:repeat(auto-fill,minmax(90px,1fr))!important;}
          .exam-grid{grid-template-columns:1fr!important;}
          .welcome-avatar{font-size:36px!important;}
          .welcome-name{font-size:17px!important;}
        }
      `}</style>

      {/* Welcome card */}
      <div className="welcome-card" style={{ background: isExamMode
          ? `linear-gradient(135deg,${examMeta?.bg},rgba(255,215,0,0.06))`
          : 'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,149,0,0.08))',
        border: isExamMode ? `1px solid ${examMeta?.color}40` : '1px solid rgba(255,215,0,0.2)' }}>
        <div className="welcome-avatar" style={{ fontSize:44, flexShrink:0 }}>{user?.avatar}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:11 }}>Welcome back,</div>
          <div className="welcome-name" style={{ color:'white', fontSize:20, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name} 👋</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, marginTop:2, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'60vw' }}>{gradeLabel}</span>
            {isExamMode
              ? <span style={{ background:examMeta?.bg, color:examMeta?.color, border:`1px solid ${examMeta?.color}50`, borderRadius:8, padding:'2px 7px', fontSize:10, fontWeight:700, flexShrink:0 }}>{examMeta?.badge}</span>
              : <span style={{ flexShrink:0 }}>• {user?.syllabus}</span>
            }
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ color:'#ffd700', fontSize:20, fontWeight:800 }}>🔥 {data?.streakDays || user?.streakDays || 0}</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10 }}>Day streak</div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        {statCard('💬', 'Chats', data?.totalMessages || 0, '#4f8ef7')}
        {statCard('📝', 'Quizzes', user?.totalQuizzesTaken || 0, '#27ae60')}
        {statCard('⭐', 'Avg Score', `${avgQuiz}%`, '#f39c12')}
        {statCard('📚', 'Subjects', user?.subjectsStudied?.length || 0, '#9b59b6')}
      </div>

      {/* Recent chats + quizzes */}
      <div className="dash-grid-2" style={{ marginBottom:20 }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:18 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>💬 Recent Chats</div>
          {data?.recentSessions?.length ? data.recentSessions.slice(0,4).map(s => {
            const meta = SUBJECT_META[s.subject] || { bg:'#ffffff12', icon:'📖' };
            return (
              <div key={s._id} onClick={() => navigate(`/chat?session=${s._id}`)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:12, cursor:'pointer', marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'white', fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.title || s.subject}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{s.subject}</div>
                </div>
              </div>
            );
          }) : <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center', padding:'16px 0' }}>No chats yet 🚀</div>}
          <button onClick={() => navigate(isExamMode ? `/chat?examMode=${encodeURIComponent(user.grade)}` : '/chat')}
            style={{ width:'100%', marginTop:8, background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.3)', borderRadius:10, padding:'9px', color:'#4f8ef7', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {isExamMode ? `Study ${examMeta?.label} →` : 'Start Chatting →'}
          </button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:18 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>📝 Recent Quizzes</div>
          {data?.recentQuizzes?.length ? data.recentQuizzes.slice(0,4).map(q => {
            const meta = SUBJECT_META[q.subject] || { bg:'#ffffff12', icon:'📖' };
            const color = q.score >= 80 ? '#27ae60' : q.score >= 50 ? '#f39c12' : '#e74c3c';
            return (
              <div key={q._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:12, marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'white', fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.chapter || q.subject}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{q.subject}</div>
                </div>
                <div style={{ color, fontSize:15, fontWeight:800, flexShrink:0 }}>{q.score}%</div>
              </div>
            );
          }) : <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center', padding:'16px 0' }}>No quizzes yet 🎯</div>}
          <button onClick={() => navigate(isExamMode ? `/quiz?examMode=${encodeURIComponent(user.grade)}` : '/quiz')}
            style={{ width:'100%', marginTop:8, background:'rgba(39,174,96,0.12)', border:'1px solid rgba(39,174,96,0.3)', borderRadius:10, padding:'9px', color:'#27ae60', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {isExamMode ? `Take ${examMeta?.label} Quiz →` : 'Take a Quiz →'}
          </button>
        </div>
      </div>

      {/* Achievements */}
      {data?.achievements?.length > 0 && (
        <div style={{ background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:18, padding:18, marginBottom:20 }}>
          <div style={{ color:'#ffd700', fontWeight:800, fontSize:15, marginBottom:12 }}>🏆 Achievements</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {data.achievements.map((a,i) => (
              <div key={i} style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:'7px 12px', display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:18 }}>{a.icon}</span>
                <span style={{ color:'white', fontSize:12, fontWeight:700 }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start — user-relevant subjects */}
      <div style={{ marginBottom:20 }}>
        <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>
          ⚡ Quick Start {isExamMode ? `— ${examMeta?.label} Subjects` : '— Subjects'}
        </div>
        <div className="quick-grid">
          {quickStartSubjects.map(sub => {
            const meta = SUBJECT_META[sub] || { bg:'#ffffff12', color:'#fff', icon:'📖' };
            return (
              <button key={sub} onClick={() => navigate(
                  isExamMode
                    ? `/chat?examMode=${encodeURIComponent(user.grade)}&subject=${encodeURIComponent(sub)}`
                    : `/chat?subject=${encodeURIComponent(sub)}`
                )}
                style={{ background:meta.bg, border:`1px solid ${meta.color}40`, borderRadius:14, padding:'12px 10px', color:meta.color, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <span style={{ fontSize:18 }}>{meta.icon}</span>{sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exam Prep Cards — shown to all users */}
      <div>
        <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>🎯 Entrance Exam Preparation</div>
        <div className="exam-grid">
          {Object.entries(EXAM_META).map(([key, em]) => {
            const isActive = user?.grade === key;
            return (
              <div key={key} style={{ background: isActive ? em.bg : 'rgba(255,255,255,0.03)',
                border:`1px solid ${isActive ? em.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius:18, padding:'18px 16px', textAlign:'left',
                outline: isActive ? `2px solid ${em.color}60` : 'none' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <div style={{ fontSize:28 }}>{em.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:'white', fontSize:14, fontWeight:800, marginBottom:3 }}>{em.fullLabel}</div>
                    <div style={{ color:'rgba(255,255,255,0.55)', fontSize:11, lineHeight:1.4 }}>{em.description}</div>
                    {isActive && <span style={{ marginTop:5, display:'inline-block', background:`${em.color}30`, border:`1px solid ${em.color}60`, borderRadius:8, padding:'2px 8px', color:em.color, fontSize:10, fontWeight:700 }}>Your Exam</span>}
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => navigate(`/chat?examMode=${encodeURIComponent(key)}`)}
                    style={{ flex:1, background:`${em.color}20`, border:`1px solid ${em.color}50`, borderRadius:10, padding:'8px 6px', color:em.color, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    💬 Study
                  </button>
                  <button onClick={() => navigate(`/quiz?examMode=${encodeURIComponent(key)}`)}
                    style={{ flex:1, background:`${em.color}20`, border:`1px solid ${em.color}50`, borderRadius:10, padding:'8px 6px', color:em.color, fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    📝 Quiz
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
