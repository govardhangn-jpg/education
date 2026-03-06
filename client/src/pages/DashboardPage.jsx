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

  return (
    <div style={{ padding:'16px', maxWidth:1100, margin:'0 auto' }}>
      <style>{`
        .dash-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        .dash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        @media(max-width:768px){
          .dash-grid-2{grid-template-columns:1fr!important;}
          .dash-stats{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      {/* Welcome card */}
      <div style={{ background:'linear-gradient(135deg,rgba(255,215,0,0.12),rgba(255,149,0,0.08))', border:'1px solid rgba(255,215,0,0.2)', borderRadius:20, padding:'18px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ fontSize:48 }}>{user?.avatar}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12 }}>Welcome back,</div>
          <div style={{ color:'white', fontSize:20, fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name} 👋</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginTop:2 }}>{user?.grade} • {user?.syllabus}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ color:'#ffd700', fontSize:24, fontWeight:800 }}>🔥 {data?.streakDays || user?.streakDays || 0}</div>
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
            const meta = SUBJECT_META[s.subject] || SUBJECT_META.English;
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
          <button onClick={() => navigate('/chat')} style={{ width:'100%', marginTop:8, background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.3)', borderRadius:10, padding:'9px', color:'#4f8ef7', fontSize:13, fontWeight:700, cursor:'pointer' }}>Start Chatting →</button>
        </div>

        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:18 }}>
          <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>📝 Recent Quizzes</div>
          {data?.recentQuizzes?.length ? data.recentQuizzes.slice(0,4).map(q => {
            const meta = SUBJECT_META[q.subject] || SUBJECT_META.English;
            const color = q.score >= 80 ? '#27ae60' : q.score >= 50 ? '#f39c12' : '#e74c3c';
            return (
              <div key={q._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:12, marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{meta.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'white', fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.chapter}</div>
                  <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{q.subject}</div>
                </div>
                <div style={{ color, fontSize:15, fontWeight:800, flexShrink:0 }}>{q.score}%</div>
              </div>
            );
          }) : <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center', padding:'16px 0' }}>No quizzes yet 🎯</div>}
          <button onClick={() => navigate('/quiz')} style={{ width:'100%', marginTop:8, background:'rgba(39,174,96,0.12)', border:'1px solid rgba(39,174,96,0.3)', borderRadius:10, padding:'9px', color:'#27ae60', fontSize:13, fontWeight:700, cursor:'pointer' }}>Take a Quiz →</button>
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

      {/* Quick Start */}
      <div>
        <div style={{ color:'white', fontWeight:800, fontSize:15, marginBottom:12 }}>⚡ Quick Start</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
          {Object.entries(SUBJECT_META).slice(0,6).map(([sub, meta]) => (
            <button key={sub} onClick={() => navigate(`/chat?subject=${sub}`)}
              style={{ background:meta.bg, border:`1px solid ${meta.color}40`, borderRadius:14, padding:'12px 10px', color:meta.color, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <span style={{ fontSize:18 }}>{meta.icon}</span>{sub}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
