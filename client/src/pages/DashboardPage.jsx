import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SUBJECT_META } from '../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCard = (icon, label, value, color) => (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:46, height:46, borderRadius:12, background:`${color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{icon}</div>
      <div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:600 }}>{label}</div>
        <div style={{ color:'white', fontSize:22, fontWeight:800 }}>{value}</div>
      </div>
    </div>
  );

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'white', fontSize:16 }}>Loading dashboard...</div>;

  const avgQuiz = data?.quizStats?.length ? Math.round(data.quizStats.reduce((s,q)=>s+q.avgScore,0)/data.quizStats.length) : 0;

  return (
    <div style={{ padding:'24px 28px', maxWidth:1100, margin:'0 auto' }}>
      {/* Welcome */}
      <div style={{ background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,149,0,0.08))', border:'1px solid rgba(255,215,0,0.2)', borderRadius:20, padding:'22px 26px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ fontSize:52 }}>{user?.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Welcome back,</div>
          <div style={{ color:'white', fontSize:24, fontWeight:800 }}>{user?.name} 👋</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:3 }}>{user?.grade} • {user?.syllabus} • {user?.preferredLanguage}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ color:'#ffd700', fontSize:28, fontWeight:800 }}>🔥 {data?.streakDays || user?.streakDays || 0}</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11 }}>Day streak</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
        {statCard('💬', 'Chat Messages', data?.totalMessages || 0, '#4f8ef7')}
        {statCard('📝', 'Quizzes Taken', user?.totalQuizzesTaken || 0, '#27ae60')}
        {statCard('⭐', 'Avg Quiz Score', `${avgQuiz}%`, '#f39c12')}
        {statCard('📚', 'Subjects Explored', user?.subjectsStudied?.length || 0, '#9b59b6')}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Recent Sessions */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:20 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:14 }}>💬 Recent Chats</div>
          {data?.recentSessions?.length ? data.recentSessions.map(s => {
            const meta = SUBJECT_META[s.subject] || SUBJECT_META.English;
            return (
              <div key={s._id} onClick={() => navigate(`/chat?session=${s._id}`)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, cursor:'pointer', marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', transition:'all 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
                <div style={{ width:32, height:32, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'white', fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.title || s.subject}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{s.subject} • {new Date(s.lastActivity).toLocaleDateString()}</div>
                </div>
              </div>
            );
          }) : <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No chats yet. Start learning! 🚀</div>}
          <button onClick={() => navigate('/chat')} style={{ width:'100%', marginTop:10, background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.3)', borderRadius:10, padding:'9px', color:'#4f8ef7', fontSize:13, fontWeight:700, cursor:'pointer' }}>Start New Chat →</button>
        </div>

        {/* Recent Quizzes */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:20 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:14 }}>📝 Recent Quizzes</div>
          {data?.recentQuizzes?.length ? data.recentQuizzes.map(q => {
            const meta = SUBJECT_META[q.subject] || SUBJECT_META.English;
            const color = q.score >= 80 ? '#27ae60' : q.score >= 50 ? '#f39c12' : '#e74c3c';
            return (
              <div key={q._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:32, height:32, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'white', fontSize:13, fontWeight:700 }}>{q.chapter}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{q.subject} • {new Date(q.completedAt).toLocaleDateString()}</div>
                </div>
                <div style={{ color, fontSize:16, fontWeight:800 }}>{q.score}%</div>
              </div>
            );
          }) : <div style={{ color:'rgba(255,255,255,0.3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>No quizzes yet. Test yourself! 🎯</div>}
          <button onClick={() => navigate('/quiz')} style={{ width:'100%', marginTop:10, background:'rgba(39,174,96,0.12)', border:'1px solid rgba(39,174,96,0.3)', borderRadius:10, padding:'9px', color:'#27ae60', fontSize:13, fontWeight:700, cursor:'pointer' }}>Take a Quiz →</button>
        </div>
      </div>

      {/* Achievements */}
      {data?.achievements?.length > 0 && (
        <div style={{ background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:18, padding:20 }}>
          <div style={{ color:'#ffd700', fontWeight:800, fontSize:16, marginBottom:14 }}>🏆 Achievements</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {data.achievements.map((a,i) => (
              <div key={i} style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:12, padding:'8px 14px', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:20 }}>{a.icon}</span>
                <span style={{ color:'white', fontSize:13, fontWeight:700 }}>{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div style={{ marginTop:24 }}>
        <div style={{ color:'white', fontWeight:800, fontSize:16, marginBottom:14 }}>⚡ Quick Start</div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {Object.entries(SUBJECT_META).slice(0,6).map(([sub, meta]) => (
            <button key={sub} onClick={() => navigate(`/chat?subject=${sub}`)} style={{ background:meta.bg, border:`1px solid ${meta.color}40`, borderRadius:14, padding:'10px 18px', color:meta.color, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all 0.2s' }}>
              <span style={{ fontSize:16 }}>{meta.icon}</span> {sub}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
