import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logoutServer } from '../utils/api';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSelector from './LanguageSelector';

export default function AppLayout() {
  const { user, logoutUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await logoutServer(); } catch {} // revoke server session
    logoutUser();
    navigate('/login');
  };

  const navItems = [
    { to:'/dashboard',   icon:'🏠', labelKey:'nav_home' },
    { to:'/chat',        icon:'💬', labelKey:'nav_chat' },
    { to:'/quiz',        icon:'📝', labelKey:'nav_quiz' },
    { to:'/visual-lab',  icon:'🔬', labelKey:'nav_lab' },
    { to:'/ar-lab',      icon:'🌍', labelKey:'nav_ar' },
    { to:'/life-skills', icon:'🧭', labelKey:'nav_life' },
    { to:'/legacy',      icon:'🕯️', labelKey:'nav_legacy' },
    { to:'/progress',    icon:'📊', labelKey:'nav_progress' },
    ...(user?.role==='admin'||user?.role==='teacher' ? [{ to:'/admin', icon:'🛡️', labelKey:'nav_admin' }] : []),
  ];

  return (
    <div style={{ height:'100dvh', background:'#0d0d1a', fontFamily:"'Nunito',sans-serif", color:'white', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0d0d1a;height:100dvh;overflow:hidden;}
        html{-webkit-text-size-adjust:100%;text-size-adjust:100%;height:100dvh;}
        .nav-link{display:flex;align-items:center;gap:7px;padding:9px 14px;border-radius:10px;color:rgba(255,255,255,0.55);text-decoration:none;font-size:13px;font-weight:700;transition:all 0.2s;min-height:40px;}
        .nav-link:hover{background:rgba(255,255,255,0.07);color:white;}
        .nav-link.active{background:rgba(255,215,0,0.12);color:#ffd700;}
        .mob-nav-link{display:flex;align-items:center;gap:12px;padding:16px 20px;color:rgba(255,255,255,0.7);text-decoration:none;font-size:15px;font-weight:700;transition:all 0.2s;border-bottom:1px solid rgba(255,255,255,0.05);min-height:54px;-webkit-tap-highlight-color:transparent;}
        .mob-nav-link:active,.mob-nav-link.active{background:rgba(255,215,0,0.08);color:#ffd700;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        /* Bottom nav */
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(13,13,26,0.97);border-top:1px solid rgba(255,255,255,0.08);z-index:200;padding:4px 0 env(safe-area-inset-bottom,4px);}
        .bottom-nav-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 2px;color:rgba(255,255,255,0.4);text-decoration:none;font-size:9px;font-weight:700;flex:1;transition:all 0.2s;min-height:50px;-webkit-tap-highlight-color:transparent;}
        .bottom-nav-item.active{color:#ffd700;}
        .bottom-nav-item span.icon{font-size:18px;line-height:1;}
        /* Main scroll */
        .main-content{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;}
        @media(max-width:768px){
          .desktop-nav{display:none!important;}
          .desktop-user{display:none!important;}
          .bottom-nav{display:flex!important;}
          .main-content{padding-bottom:calc(56px + env(safe-area-inset-bottom,0px))!important;}
          .hamburger{display:flex!important;}
          /* Prevent text zoom on input focus iOS */
          input,select,textarea{font-size:16px!important;}
          /* Tap targets min 44px */
          button{min-height:44px;}
        }
        @media(min-width:769px){
          .hamburger{display:none!important;}
          .mob-menu{display:none!important;}
        }
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
              <span>{item.icon}</span><span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </div>

        <div style={{ flex:1 }} />

        {/* Language selector — desktop */}
        <div className="desktop-nav" style={{ display:'flex', marginRight:8 }}>
          <LanguageSelector />
        </div>

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
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>
                {(user?.role === 'admin' || user?.role === 'teacher')
                  ? `${user.role === 'admin' ? '🛡️ Admin' : '👩‍🏫 Teacher'} · All courses`
                  : `${user?.grade} · ${user?.syllabus}`}
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/sessions')} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'6px 10px', color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }} title="Manage devices">🔐</button>
          <button onClick={handleLogout} style={{ background:'rgba(255,80,80,0.12)', border:'1px solid rgba(255,80,80,0.25)', borderRadius:10, padding:'6px 12px', color:'#ff6b6b', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{t('logout')}</button>
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
        <div className="mob-menu" style={{ position:'fixed', top:60, left:0, right:0, bottom:0, background:'rgba(13,13,26,0.98)', backdropFilter:'blur(12px)', zIndex:140, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ padding:'8px 0', paddingBottom:'env(safe-area-inset-bottom,16px)' }}>
            <div style={{ padding:'12px 20px 8px', color:'rgba(255,255,255,0.3)', fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase' }}>
              {user?.avatar} {user?.name} · {(user?.role === 'admin' || user?.role === 'teacher') ? `${user.role} · All courses` : `${user?.grade} · ${user?.syllabus}`}
            </div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({isActive})=>`mob-nav-link${isActive?' active':''}`} onClick={() => setMenuOpen(false)}>
                <span style={{ fontSize:18 }}>{item.icon}</span><span>{t(item.labelKey)}</span>
              </NavLink>
            ))}
            {/* Language picker in mobile menu */}
            <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <LanguageSelector />
            </div>
            <NavLink to="/sessions" className="mob-nav-link" onClick={() => setMenuOpen(false)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'15px 20px', color:'rgba(255,255,255,0.7)', textDecoration:'none', fontSize:15, fontWeight:700, borderBottom:'1px solid rgba(255,255,255,0.05)', minHeight:52 }}>
              <span style={{ fontSize:18 }}>🔐</span><span>Manage Devices</span>
            </NavLink>
            <button onClick={handleLogout} style={{ width:'100%', padding:'14px 20px', background:'transparent', border:'none', borderTop:'1px solid rgba(255,255,255,0.05)', color:'#ff6b6b', fontSize:15, fontWeight:700, cursor:'pointer', textAlign:'left', fontFamily:"'Nunito',sans-serif" }}>
              🚪 {t('logout')}
            </button>
          </div>
        </div>
      )}

      {/* Main content — scrollable */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className={({isActive})=>`bottom-nav-item${isActive?' active':''}`}>
            <span className="icon">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
