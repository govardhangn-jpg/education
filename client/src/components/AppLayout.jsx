import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AppLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logoutUser(); navigate('/login'); };

  const navItems = [
    { to:'/dashboard', icon:'🏠', label:'Home' },
    { to:'/chat', icon:'💬', label:'Chat' },
    { to:'/quiz', icon:'📝', label:'Quiz' },
    { to:'/progress', icon:'📊', label:'Progress' },
    ...(user?.role==='admin'||user?.role==='teacher' ? [{ to:'/admin', icon:'🛡️', label:'Admin' }] : []),
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d1a', fontFamily:"'Nunito',sans-serif", color:'white', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0d0d1a;}
        .nav-link{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;color:rgba(255,255,255,0.55);text-decoration:none;font-size:13px;font-weight:700;transition:all 0.2s;}
        .nav-link:hover{background:rgba(255,255,255,0.07);color:white;}
        .nav-link.active{background:rgba(255,215,0,0.12);color:#ffd700;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>

      {/* Top Nav */}
      <nav style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 20px', height:64, display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'sticky', top:0, zIndex:100, backdropFilter:'blur(10px)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:16 }}>
          <span style={{ fontSize:22 }}>🎓</span>
          <span style={{ fontFamily:"'Baloo 2',cursive", fontSize:18, fontWeight:800, background:'linear-gradient(90deg,#ffd700,#ff9500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', whiteSpace:'nowrap' }}>SamarthaaEdu</span>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', gap:4 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-link${isActive?' active':''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* User info */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {user?.streakDays > 0 && (
            <div style={{ background:'rgba(255,165,0,0.12)', border:'1px solid rgba(255,165,0,0.25)', borderRadius:10, padding:'4px 12px', display:'flex', alignItems:'center', gap:5 }}>
              <span>🔥</span>
              <span style={{ color:'#ff9500', fontSize:12, fontWeight:800 }}>{user.streakDays} day{user.streakDays>1?'s':''}</span>
            </div>
          )}
          <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.18)', borderRadius:12, padding:'5px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{user?.avatar}</span>
            <div>
              <div style={{ color:'white', fontSize:12, fontWeight:800, lineHeight:1.2 }}>{user?.name}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{user?.grade} · {user?.syllabus}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background:'rgba(255,80,80,0.12)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:10, padding:'6px 12px', color:'#ff6b6b', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Logout</button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex:1, overflow:'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
