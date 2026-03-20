import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { SYLLABI, GRADES, LANGUAGES, AVATAR_OPTIONS, LLB_META, RGUHS_META } from '../utils/constants';

export default function LoginPage() {
  const [tab,  setTab]  = useState('login');
  const [mode, setMode] = useState('school'); // 'school' | 'exam' | 'llb' | 'rguhs'
  const [rguhsProgram, setRguhsProgram] = useState('MBBS');
  const [form, setForm] = useState({ username:'', password:'', name:'', email:'',
    grade:'Class 7', syllabus:'CBSE', avatar:'🧑‍🎓', preferredLanguage:'English' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleModeSwitch = m => {
    setMode(m);
    if (m === 'school') { set('grade','Class 7');          set('syllabus','CBSE'); }
    if (m === 'exam')   { set('grade','IIT-JEE');          set('syllabus','IIT-JEE'); }
    if (m === 'upsc')   { set('grade','UPSC Prelims');     set('syllabus','UPSC'); }
    if (m === 'llb')    { set('grade','LLB Year 1');       set('syllabus','LLB'); }
    if (m === 'rguhs')  {
      const prog = RGUHS_META.programs[rguhsProgram];
      set('grade', prog.years[0]);
      set('syllabus','RGUHS');
    }
  };

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await login({ username:form.username, password:form.password });
      loginUser(res.data.token, res.data.user); navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Login failed'); }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await register(form);
      loginUser(res.data.token, res.data.user); navigate('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Registration failed'); }
    setLoading(false);
  };

  // When RGUHS program changes, update grade to first year
  const handleRguhsProgram = prog => {
    setRguhsProgram(prog);
    const meta = RGUHS_META.programs[prog];
    set('grade', meta.years[0]);
    set('syllabus','RGUHS');
  };

  const MODES = [
    { id:'school', icon:'📚', label:'School',     sub:'Class 1–12' },
    { id:'exam',   icon:'🎯', label:'Entrance',   sub:'JEE / NEET / KCET' },
    { id:'upsc',   icon:'🇮🇳', label:'UPSC',       sub:'Civil Services' },
    { id:'llb',    icon:'⚖️', label:'LLB',         sub:'Bar Council KA' },
    { id:'rguhs',  icon:'🏥', label:'RGUHS',       sub:'Medical/Health' },
  ];

  return (
    <div style={{ minHeight:'100dvh', background:'linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif", padding:'16px', overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        /* font-size:16px prevents iOS auto-zoom on input focus */
        .login-input{width:100%;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 14px;color:white;font-size:16px;font-family:'Nunito',sans-serif;outline:none;transition:all 0.2s;-webkit-appearance:none;}
        .login-input:focus{border-color:#ffd700;background:rgba(255,255,255,0.12);}
        .login-input::placeholder{color:rgba(255,255,255,0.3);}
        select.login-input option{background:#1a1a2e;}
        .tab-btn{flex:1;padding:11px 10px;background:transparent;border:none;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:14px;font-weight:700;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}
        .tab-btn.active{color:#ffd700;border-bottom-color:#ffd700;}
        .submit-btn{width:100%;background:linear-gradient(135deg,#ffd700,#ff9500);border:none;border-radius:12px;padding:15px;color:#1a1a2e;font-size:15px;font-weight:800;font-family:'Nunito',sans-serif;cursor:pointer;transition:all 0.2s;margin-top:6px;min-height:50px;}
        .submit-btn:active{transform:scale(0.98);}
        .submit-btn:disabled{opacity:0.6;}
        .avatar-opt{font-size:22px;cursor:pointer;padding:7px;border-radius:8px;border:2px solid transparent;transition:all 0.15s;min-width:40px;min-height:40px;display:flex;align-items:center;justify-content:center;}
        .avatar-opt.sel{border-color:#ffd700;background:rgba(255,215,0,0.15);}
        /* Mode buttons grid — 5 on tablet+, 3+2 wrap on phones */
        .mode-btn{padding:8px 4px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;flex-direction:column;align-items:center;gap:3px;min-height:60px;justify-content:center;}
        .mode-btn.active{border-color:#ffd700;background:rgba(255,215,0,0.1);color:#ffd700;}
        .mode-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;}
        .prog-btn{padding:8px 10px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.5);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;white-space:nowrap;min-height:38px;}
        .reg-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:4px}
        @media(max-width:480px){
          .reg-grid{grid-template-columns:1fr!important;}
          .mode-grid{grid-template-columns:repeat(3,1fr)!important;}
          .login-card{padding:20px 16px!important;}
        }
        @media(max-width:360px){
          .mode-grid{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>

      <div style={{ position:'fixed',width:400,height:400,borderRadius:'50%',background:'#ffd700',filter:'blur(100px)',opacity:0.08,top:-100,right:-100,pointerEvents:'none' }}/>
      <div style={{ position:'fixed',width:300,height:300,borderRadius:'50%',background:'#4ecdc4',filter:'blur(80px)',opacity:0.08,bottom:-80,left:-80,pointerEvents:'none' }}/>

      <div className="login-card" style={{ background:'rgba(255,255,255,0.04)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:28,padding:'28px 20px',width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:44, marginBottom:4 }}>🎓</div>
          <div style={{ fontFamily:"'Baloo 2',cursive",fontSize:28,fontWeight:800,background:'linear-gradient(90deg,#ffd700,#ff6b6b,#4ecdc4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>SamarthaaEdu</div>
          <div style={{ color:'rgba(255,255,255,0.45)',fontSize:11,marginTop:3 }}>ಸಮರ್ಥ ಶಿಕ್ಷಣ • Smart Learning for Every Student</div>
          <div style={{ color:'rgba(255,255,255,0.3)',fontSize:10,marginTop:2 }}>CBSE · ICSE · Karnataka State · NEET · KCET · JEE · UPSC · LLB · RGUHS</div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:20 }}>
          <button className={`tab-btn ${tab==='login'?'active':''}`}    onClick={()=>setTab('login')}>Login</button>
          <button className={`tab-btn ${tab==='register'?'active':''}`} onClick={()=>setTab('register')}>Register</button>
        </div>

        {error && <div style={{ background:'rgba(255,80,80,0.12)',border:'1px solid rgba(255,80,80,0.3)',borderRadius:10,padding:'10px 14px',color:'#ff6b6b',fontSize:13,marginBottom:16,textAlign:'center' }}>{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>USERNAME</label>
            <input className="login-input" style={{ marginBottom:16 }} placeholder="Enter username" value={form.username} onChange={e=>set('username',e.target.value)} required autoCapitalize="none"/>
            <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>PASSWORD</label>
            <input className="login-input" style={{ marginBottom:20 }} type="password" placeholder="Enter password" value={form.password} onChange={e=>set('password',e.target.value)} required/>
            <button className="submit-btn" disabled={loading}>{loading?'Logging in...':'Start Learning 🚀'}</button>

          </form>
        ) : (
          <form onSubmit={handleRegister}>

              <div style={{ marginBottom:16 }}>
              <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>I AM STUDYING</label>
              <div className="mode-grid" style={{ marginBottom:12 }}>
                {MODES.map(m => (
                  <button key={m.id} type="button" className={`mode-btn ${mode===m.id?'active':''}`} onClick={()=>handleModeSwitch(m.id)}>
                    <span style={{ fontSize:18 }}>{m.icon}</span>
                    <span style={{ fontSize:11 }}>{m.label}</span>
                    <span style={{ fontSize:9, opacity:0.7, lineHeight:1.1 }}>{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="reg-grid">
              <div>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>FULL NAME</label>
                <input className="login-input" placeholder="Your name" value={form.name} onChange={e=>set('name',e.target.value)} required/>
              </div>
              <div>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>USERNAME</label>
                <input className="login-input" placeholder="username" value={form.username} onChange={e=>set('username',e.target.value)} required autoCapitalize="none"/>
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>PASSWORD</label>
              <input className="login-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6}/>
            </div>

            {/* ── School mode ── */}
            {mode === 'school' && (
              <div className="reg-grid">
                <div>
                  <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>CLASS</label>
                  <select className="login-input" value={form.grade} onChange={e=>set('grade',e.target.value)}>
                    {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>SYLLABUS</label>
                  <select className="login-input" value={form.syllabus} onChange={e=>set('syllabus',e.target.value)}>
                    {SYLLABI.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* ── Exam / Entrance mode ── */}
            {mode === 'exam' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>ENTRANCE EXAM</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    ['IIT-JEE',          'IIT-JEE', '⚙️ IIT-JEE',   'Mains + Advanced'],
                    ['NEET Preparation', 'NEET',    '🩺 NEET UG',   'Medical Entrance'],
                    ['KCET Preparation', 'KCET',    '🏫 KCET',      'Karnataka CET'],
                    ['NEET PG',          'NEET PG', '🎓 NEET PG',   'MD/MS Entrance'],
                  ].map(([g,s,lbl,sub])=>(
                    <button key={g} type="button" onClick={()=>{set('grade',g);set('syllabus',s);}}
                      style={{ padding:'10px 8px',borderRadius:12,border:`1.5px solid ${form.grade===g?'#a78bfa':'rgba(255,255,255,0.12)'}`,background:form.grade===g?'rgba(167,139,250,0.12)':'transparent',color:form.grade===g?'#a78bfa':'rgba(255,255,255,0.5)',fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <span style={{ fontSize:16 }}>{lbl.split(' ')[0]}</span>
                      <span>{lbl.split(' ').slice(1).join(' ')}</span>
                      <span style={{ fontSize:10, opacity:0.7 }}>{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── UPSC mode ── */}
            {mode === 'upsc' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>UPSC STAGE</label>
                <div style={{ background:'rgba(230,126,34,0.08)',border:'1px solid rgba(230,126,34,0.25)',borderRadius:12,padding:12 }}>
                  <div style={{ color:'#f0b27a',fontSize:11,marginBottom:10 }}>🇮🇳 UPSC Civil Services — IAS / IPS / IFS</div>
                  {/* Stage buttons */}
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    {[
                      ['UPSC Prelims','UPSC','📝 Prelims'],
                      ['UPSC Mains – GS','UPSC','📚 Mains GS'],
                      ['UPSC Mains – Essay','UPSC','✍️ Essay'],
                    ].map(([g,s,lbl])=>(
                      <button key={g} type="button" onClick={()=>{set('grade',g);set('syllabus',s);}}
                        style={{ flex:1,padding:'9px 6px',borderRadius:10,border:`1.5px solid ${form.grade===g?'#e67e22':'rgba(255,255,255,0.12)'}`,background:form.grade===g?'rgba(230,126,34,0.2)':'transparent',color:form.grade===g?'#e67e22':'rgba(255,255,255,0.5)',fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {/* Optional subjects */}
                  <label style={{ color:'rgba(255,255,255,0.45)',fontSize:10,fontWeight:700,display:'block',marginBottom:6 }}>— OR SELECT OPTIONAL SUBJECT —</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {[
                      ['Optional – History','📜 History'],
                      ['Optional – Geography','🗺️ Geography'],
                      ['Optional – Political Science & IR','🏛️ Pol. Science'],
                      ['Optional – Public Administration','🏢 Pub. Admin'],
                      ['Optional – Sociology','👥 Sociology'],
                      ['Optional – Philosophy','🧠 Philosophy'],
                      ['Optional – Economics','📊 Economics'],
                      ['Optional – Anthropology','🦴 Anthropology'],
                      ['Optional – Psychology','💭 Psychology'],
                      ['Optional – Law','⚖️ Law'],
                      ['Optional – Mathematics','∑ Mathematics'],
                    ].map(([g,lbl])=>(
                      <button key={g} type="button" onClick={()=>{set('grade',g);set('syllabus','UPSC');}}
                        style={{ padding:'6px 8px',borderRadius:8,border:`1.5px solid ${form.grade===g?'#9b59b6':'rgba(255,255,255,0.1)'}`,background:form.grade===g?'rgba(155,89,182,0.2)':'transparent',color:form.grade===g?'#c39bd3':'rgba(255,255,255,0.45)',fontFamily:"'Nunito',sans-serif",fontSize:11,fontWeight:700,cursor:'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── LLB mode ── */}
            {mode === 'llb' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>LLB YEAR</label>
                <div style={{ background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.25)',borderRadius:12,padding:12,marginBottom:8 }}>
                  <div style={{ color:'#e8b4b8',fontSize:11,marginBottom:8 }}>⚖️ Bar Council of Karnataka — 3-Year &amp; 5-Year LLB</div>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {LLB_META.years.map(y=>(
                      <button key={y} type="button" onClick={()=>{set('grade',y);set('syllabus','LLB');}}
                        style={{ padding:'7px 10px',borderRadius:10,border:`1.5px solid ${form.grade===y?'#c0392b':'rgba(255,255,255,0.12)'}`,background:form.grade===y?'rgba(192,57,43,0.2)':'transparent',color:form.grade===y?'#e74c3c':'rgba(255,255,255,0.5)',fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer' }}>
                        {LLB_META.yearLabels[y]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── RGUHS mode ── */}
            {mode === 'rguhs' && (
              <div style={{ marginBottom:12 }}>
                <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>RGUHS PROGRAMME</label>
                <div style={{ background:'rgba(22,160,133,0.08)',border:'1px solid rgba(22,160,133,0.25)',borderRadius:12,padding:12 }}>
                  <div style={{ color:'#7ecdc4',fontSize:11,marginBottom:10 }}>🏥 Rajiv Gandhi University of Health Sciences, Karnataka</div>
                  {/* Programme selector */}
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:10 }}>
                    {Object.entries(RGUHS_META.programs).map(([key,prog])=>(
                      <button key={key} type="button" onClick={()=>handleRguhsProgram(key)}
                        style={{ padding:'7px 10px',borderRadius:10,border:`1.5px solid ${rguhsProgram===key?prog.color:'rgba(255,255,255,0.12)'}`,background:rguhsProgram===key?prog.color+'25':'transparent',color:rguhsProgram===key?prog.color:'rgba(255,255,255,0.5)',fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer' }}>
                        {prog.icon} {prog.label}
                      </button>
                    ))}
                  </div>
                  {/* Year selector for chosen programme */}
                  <label style={{ color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:700,display:'block',marginBottom:6 }}>SELECT YEAR</label>
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                    {RGUHS_META.programs[rguhsProgram].years.map(y=>(
                      <button key={y} type="button" onClick={()=>{set('grade',y);set('syllabus','RGUHS');}}
                        style={{ padding:'7px 10px',borderRadius:10,border:`1.5px solid ${form.grade===y?RGUHS_META.programs[rguhsProgram].color:'rgba(255,255,255,0.12)'}`,background:form.grade===y?RGUHS_META.programs[rguhsProgram].color+'25':'transparent',color:form.grade===y?RGUHS_META.programs[rguhsProgram].color:'rgba(255,255,255,0.5)',fontFamily:"'Nunito',sans-serif",fontSize:11,fontWeight:700,cursor:'pointer' }}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom:12 }}>
              <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6 }}>LANGUAGE</label>
              <select className="login-input" value={form.preferredLanguage} onChange={e=>set('preferredLanguage',e.target.value)}>
                {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:18 }}>
              <label style={{ color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:8 }}>PICK YOUR AVATAR</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {AVATAR_OPTIONS.map(av=><span key={av} className={`avatar-opt ${form.avatar===av?'sel':''}`} onClick={()=>set('avatar',av)}>{av}</span>)}
              </div>
            </div>

            <button className="submit-btn" disabled={loading}>{loading?'Creating account...':'Join SamarthaaEdu 🎓'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
