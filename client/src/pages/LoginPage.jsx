import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SYLLABI, GRADES, EXAM_MODES, LANGUAGES, AVATAR_OPTIONS } from '../utils/constants';

export default function LoginPage() {
  const [tab, setTab]   = useState('login');
  const [mode, setMode] = useState('school'); // 'school' | 'exam'
  const [form, setForm] = useState({
    username:'', password:'', name:'', email:'',
    grade:'Class 7', syllabus:'CBSE',
    avatar:'🧑‍🎓', preferredLanguage:'English',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleModeSwitch = (m) => {
    setMode(m);
    if (m === 'exam') {
      set('grade', 'NEET Preparation');
      set('syllabus', 'NEET');
    } else {
      set('grade', 'Class 7');
      set('syllabus', 'CBSE');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await login({ username: form.username, password: form.password });
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif", padding:'16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0f0c29;}
        .login-input{width:100%;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;padding:11px 14px;color:white;font-size:14px;font-family:'Nunito',sans-serif;outline:none;transition:all 0.2s;}
        .login-input:focus{border-color:#ffd700;background:rgba(255,255,255,0.12);}
        .login-input::placeholder{color:rgba(255,255,255,0.3);}
        select.login-input option{background:#1a1a2e;}
        .tab-btn{flex:1;padding:10px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}
        .tab-btn.active{color:#ffd700;border-bottom-color:#ffd700;}
        .submit-btn{width:100%;background:linear-gradient(135deg,#ffd700,#ff9500);border:none;border-radius:12px;padding:14px;color:#1a1a2e;font-size:15px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;transition:all 0.2s;margin-top:6px;}
        .submit-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,215,0,0.4);}
        .submit-btn:disabled{opacity:0.6;transform:none;}
        .avatar-option{font-size:22px;cursor:pointer;padding:6px;border-radius:8px;border:2px solid transparent;transition:all 0.15s;}
        .avatar-option.selected{border-color:#ffd700;background:rgba(255,215,0,0.15);}
        .avatar-option:hover{background:rgba(255,255,255,0.1);}
        .mode-btn{flex:1;padding:10px 8px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:4px;}
        .mode-btn.active{border-color:#ffd700;background:rgba(255,215,0,0.1);color:#ffd700;}
        .reg-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        @media(max-width:480px){.reg-grid{grid-template-columns:1fr!important;}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}
      `}</style>

      <div style={{ position:'fixed', width:400, height:400, borderRadius:'50%', background:'#ffd700', filter:'blur(100px)', opacity:0.08, top:-100, right:-100, pointerEvents:'none' }} />
      <div style={{ position:'fixed', width:300, height:300, borderRadius:'50%', background:'#4ecdc4', filter:'blur(80px)', opacity:0.08, bottom:-80, left:-80, pointerEvents:'none' }} />

      <div style={{ background:'rgba(255,255,255,0.04)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:28, padding:'28px 20px', width:'100%', maxWidth:480, boxShadow:'0 32px 80px rgba(0,0,0,0.5)', maxHeight:'95vh', overflowY:'auto' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:44, marginBottom:4 }}>🎓</div>
          <div style={{ fontFamily:"'Baloo 2',cursive", fontSize:28, fontWeight:800, background:'linear-gradient(90deg,#ffd700,#ff6b6b,#4ecdc4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SamarthaaEdu</div>
          <div style={{ color:'rgba(255,255,255,0.45)', fontSize:11, marginTop:3 }}>ಸಮರ್ಥ ಶಿಕ್ಷಣ • Smart Learning for Every Student</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:2 }}>CBSE • ICSE • Karnataka State | Class 1–12 | NEET • KCET</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:20 }}>
          <button className={`tab-btn ${tab==='login'?'active':''}`} onClick={() => setTab('login')}>Login</button>
          <button className={`tab-btn ${tab==='register'?'active':''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        {error && <div style={{ background:'rgba(255,80,80,0.12)', border:'1px solid rgba(255,80,80,0.3)', borderRadius:10, padding:'10px 14px', color:'#ff6b6b', fontSize:13, marginBottom:16, textAlign:'center' }}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>USERNAME</label>
            <input className="login-input" style={{ marginBottom:16 }} placeholder="Enter username" value={form.username} onChange={e=>set('username',e.target.value)} required autoCapitalize="none" />
            <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>PASSWORD</label>
            <input className="login-input" style={{ marginBottom:20 }} type="password" placeholder="Enter password" value={form.password} onChange={e=>set('password',e.target.value)} required />
            <button className="submit-btn" disabled={loading}>{loading ? 'Logging in...' : 'Start Learning 🚀'}</button>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, textAlign:'center', marginTop:12 }}>
              Demo: <b style={{ color:'rgba(255,255,255,0.5)' }}>arjun_k / learn123</b> &nbsp;|&nbsp; <b style={{ color:'rgba(255,255,255,0.5)' }}>teacher1 / teacher@123</b>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {/* Mode selector */}
            <div style={{ marginBottom:16 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:8 }}>I AM PREPARING FOR</label>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" className={`mode-btn ${mode==='school'?'active':''}`} onClick={() => handleModeSwitch('school')}>
                  <span style={{ fontSize:20 }}>📚</span>School (Class 1–12)
                </button>
                <button type="button" className={`mode-btn ${mode==='exam'?'active':''}`} onClick={() => handleModeSwitch('exam')}>
                  <span style={{ fontSize:20 }}>🎯</span>NEET / KCET
                </button>
              </div>
            </div>

            <div className="reg-grid">
              <div>
                <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>FULL NAME</label>
                <input className="login-input" placeholder="Your name" value={form.name} onChange={e=>set('name',e.target.value)} required />
              </div>
              <div>
                <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>USERNAME</label>
                <input className="login-input" placeholder="username" value={form.username} onChange={e=>set('username',e.target.value)} required autoCapitalize="none" />
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>PASSWORD</label>
              <input className="login-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6} />
            </div>

            {mode === 'school' ? (
              <div className="reg-grid">
                <div>
                  <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>CLASS</label>
                  <select className="login-input" value={form.grade} onChange={e=>set('grade',e.target.value)}>
                    {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>SYLLABUS</label>
                  <select className="login-input" value={form.syllabus} onChange={e=>set('syllabus',e.target.value)}>
                    {SYLLABI.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom:14 }}>
                <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>EXAM TARGET</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[['NEET Preparation','NEET','🩺 NEET UG'],['KCET Preparation','KCET','🏫 Karnataka CET']].map(([g,s,lbl]) => (
                    <button key={g} type="button" onClick={() => { set('grade',g); set('syllabus',s); }}
                      style={{ flex:1, padding:'10px', borderRadius:12, border:`1.5px solid ${form.grade===g?'#a78bfa':'rgba(255,255,255,0.12)'}`, background:form.grade===g?'rgba(167,139,250,0.12)':'transparent', color:form.grade===g?'#a78bfa':'rgba(255,255,255,0.5)', fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom:14 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:6 }}>LANGUAGE</label>
              <select className="login-input" value={form.preferredLanguage} onChange={e=>set('preferredLanguage',e.target.value)}>
                {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={{ color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:700, display:'block', marginBottom:8 }}>PICK YOUR AVATAR</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {AVATAR_OPTIONS.map(av => <span key={av} className={`avatar-option ${form.avatar===av?'selected':''}`} onClick={()=>set('avatar',av)}>{av}</span>)}
              </div>
            </div>

            <button className="submit-btn" disabled={loading}>{loading ? 'Creating account...' : 'Join SamarthaaEdu 🎓'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
