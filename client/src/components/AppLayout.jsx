import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AppLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logoutUser(); navigate('/login'); };

  const navItems = [
    { to:'/dashboard',  icon:'🏠', label:'Home' },
    { to:'/chat',       icon:'💬', label:'Chat' },
    { to:'/quiz',       icon:'📝', label:'Quiz' },
    { to:'/visual-lab', icon:'🔬', label:'Lab' },
    { to:'/progress',   icon:'📊', label:'Progress' },
    ...(user?.role==='admin'||user?.role==='teacher' ? [{ to:'/admin', icon:'🛡️', label:'Admin' }] : []),
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0d0d1a', fontFamily:"'Nunito',sans-serif", color:'white', display:'flex', flexDirection:'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0d0d1a;}
        html{-webkit-text-size-adjust:100%;text-size-adjust:100%;}
        .nav-link{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:10px;color:rgba(255,255,255,0.55);text-decoration:none;font-size:13px;font-weight:700;transition:all 0.2s;min-height:40px;}
        .nav-link:hover{background:rgba(255,255,255,0.07);color:white;}
        .nav-link.active{background:rgba(255,215,0,0.12);color:#ffd700;}
        .mob-nav-link{display:flex;align-items:center;gap:12px;padding:15px 20px;color:rgba(255,255,255,0.7);text-decoration:none;font-size:15px;font-weight:700;transition:all 0.2s;border-bottom:1px solid rgba(255,255,255,0.05);min-height:52px;}
        .mob-nav-link:hover,.mob-nav-link.active{background:rgba(255,215,0,0.08);color:#ffd700;}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        /* Bottom nav — 56px fixed height + safe area */
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(13,13,26,0.97);border-top:1px solid rgba(255,255,255,0.08);z-index:200;padding:4px 0 env(safe-area-inset-bottom,4px);}
        .bottom-nav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 8px;color:rgba(255,255,255,0.4);text-decoration:none;font-size:10px;font-weight:700;flex:1;transition:all 0.2s;min-height:48px;}
        .bottom-nav-item.active{color:#ffd700;}
        .bottom-nav-item span.icon{font-size:20px;}
        @media(max-width:768px){
          .desktop-nav{display:none!important;}
          .desktop-user{display:none!important;}
          .bottom-nav{display:flex!important;}
          .main-content{padding-bottom:56px!important;}
          .hamburger{display:flex!important;}
        }
        @media(min-width:769px){
          .hamburger{display:none!important;}
          .mob-menu{display:none!important;}
        }
        /* Tablet: show nav links but no bottom bar */
        @media(min-width:769px) and (max-width:1024px){
          .desktop-user .user-grade{display:none;}
        }
      `}</style>

      {/* Top Nav */}
      <nav style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'0 16px', height:60, display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'sticky', top:0, zIndex:150, backdropFilter:'blur(10px)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22 }}>🎓</span>
          <span style={{ fontFamily:"'Baloo 2',cursive", fontSize:18, fontWeight:800, background:'linear-gradient(90deg,#ffd700,#ff9500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', whiteSpace:'nowrap' }}>SamarthaaEdu</span>
        </div>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{ display:'flex', gap:4, marginLeft:16 }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-link${isActive?' active':''}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ flex:1 }} />

        {/* Desktop user info */}
        <div className="desktop-user" style={{ display:'flex', alignItems:'center', gap:8 }}>
          {user?.streakDays > 0 && (
            <div style={{ background:'rgba(255,165,0,0.12)', border:'1px solid rgba(255,165,0,0.25)', borderRadius:10, padding:'4px 10px', display:'flex', alignItems:'center', gap:5 }}>
              <span>🔥</span>
              <span style={{ color:'#ff9500', fontSize:12, fontWeight:800 }}>{user.streakDays}d</span>
            </div>
          )}
          <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.18)', borderRadius:12, padding:'5px 10px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{user?.avatar}</span>
            <div>
              <div style={{ color:'white', fontSize:12, fontWeight:800, lineHeight:1.2 }}>{user?.name}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{user?.grade} · {user?.syllabus}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background:'rgba(255,80,80,0.12)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:10, padding:'6px 12px', color:'#ff6b6b', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Logout</button>
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="hamburger" style={{ alignItems:'center', gap:8 }}>
          {user?.streakDays > 0 && <span style={{ fontSize:13, color:'#ff9500', fontWeight:800 }}>🔥{user.streakDays}</span>}
          <span style={{ fontSize:22 }}>{user?.avatar}</span>
          <button onClick={() => setMenuOpen(o => !o)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, padding:'6px 10px', color:'white', fontSize:18, cursor:'pointer', lineHeight:1 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="mob-menu" style={{ position:'fixed', top:60, left:0, right:0, background:'rgba(13,13,26,0.98)', backdropFilter:'blur(12px)', zIndex:140, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding:'8px 0' }}>
            <div style={{ padding:'12px 20px 8px', color:'rgba(255,255,255,0.3)', fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>
              {user?.avatar} {user?.name} · {user?.grade} · {user?.syllabus}
            </div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive})=>`mob-nav-link${isActive?' active':''}`} onClick={() => setMenuOpen(false)}>
                <span style={{ fontSize:18 }}>{item.icon}</span><span>{item.label}</span>
              </NavLink>
            ))}
            <button onClick={handleLogout} style={{ width:'100%', padding:'14px 20px', background:'transparent', border:'none', borderTop:'1px solid rgba(255,255,255,0.05)', color:'#ff6b6b', fontSize:15, fontWeight:700, cursor:'pointer', textAlign:'left', fontFamily:"'Nunito',sans-serif" }}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="main-content" style={{ flex:1, overflow:'auto' }}>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive})=>`bottom-nav-item${isActive?' active':''}`}>
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
