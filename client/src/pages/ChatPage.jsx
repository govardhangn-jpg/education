import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendMessage, getCurriculum, getChatSessions, getChatSession, deleteChatSession } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTTS, useSpeechRecognition } from '../hooks/useSpeech';
import { SUBJECT_META, SUBJECTS_BY_GRADE, EXAM_META, EXAM_MODES, LANGUAGES, getSyllabusKey } from '../utils/constants';

export default function ChatPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [grade, setGrade] = useState(() => {
    const examMode = params.get('examMode');
    return examMode || user?.grade || 'Class 7';
  });
  const [syllabus, setSyllabus] = useState(() => {
    const examMode = params.get('examMode');
    const g = examMode || user?.grade || 'Class 7';
    // getSyllabusKey handles ALL modes: NEET, KCET, LLB, RGUHS, UPSC, IIT-JEE, school
    return getSyllabusKey(g) || user?.syllabus || 'CBSE';
  });
  const [subject, setSubject] = useState(() => {
    const em = params.get('examMode');
    const subj = params.get('subject');
    if (subj) return subj;
    const gradeKey = em || user?.grade || 'Class 7';
    return SUBJECTS_BY_GRADE[gradeKey]?.[0] || 'Mathematics';
  });
  const [chapter, setChapter] = useState('');
  const [language, setLanguage] = useState(user?.preferredLanguage || 'English');
  const [chapters, setChapters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chapters');
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const chatEndRef = useRef(null);
  const { speaking, loadingAudio, elevenAvailable, speak, stop: stopTTS } = useTTS();
  const handleVoice = useCallback((text) => setInput(p => p + text), []);
  const ttsLangCode = { English:'en-IN', Kannada:'kn-IN', Hindi:'hi-IN', Telugu:'te-IN', Tamil:'ta-IN' }[language] || 'en-IN';
  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition(handleVoice, ttsLangCode);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Re-sync grade/syllabus once user loads from auth (user starts as null)
  useEffect(() => {
    if (!user) return;
    const urlExamMode = params.get('examMode');
    if (urlExamMode) return; // URL params take precedence
    const g = user.grade || 'Class 7';
    setGrade(g);
    setSyllabus(getSyllabusKey(g) || user.syllabus || 'CBSE');
    const subs = SUBJECTS_BY_GRADE[g] || [];
    if (subs.length) setSubject(subs[0]);
  }, [user?.grade]); // eslint-disable-line

  useEffect(() => {
    if (!subject || !grade || !syllabus) return;
    setLoadingChapters(true);
    getCurriculum({ grade, syllabus, subject }).then(r => { setChapters(r.data.chapters || []); setChapter(''); }).catch(console.error).finally(() => setLoadingChapters(false));
  }, [subject, grade, syllabus]);

  useEffect(() => {
    getChatSessions({ subject, limit: 15 }).then(r => setSessions(r.data.sessions || [])).catch(console.error);
  }, [subject]);

  useEffect(() => {
    const sid = params.get('session');
    if (sid) loadSession(sid);
  }, []);

  useEffect(() => {
    if (!currentSessionId) {
      const meta = SUBJECT_META[subject] || SUBJECT_META.English;
      const isExam = EXAM_MODES.includes(grade);
      const examM  = isExam ? EXAM_META[grade] : null;
      const welcomeMsg = isExam
        ? `Namaste ${user?.name}! 🙏\n\nWelcome to **${grade}** — ${examM?.description}.\n\nI'm your SamarthaaEdu ${examM?.label} specialist tutor. I'll help you:\n• Master every topic with conceptual clarity\n• Solve previous year questions (PYQs)\n• Learn exam-specific tricks and mnemonics\n• Practice MCQs with detailed explanations\n\nCurrently studying: **${subject}** ${meta.icon}\n\nWhat topic would you like to tackle today?`
        : `Namaste ${user?.name}! 🙏\n\nWelcome to **${subject}** for **${grade}** (${syllabus})!\n\nI'm your SamarthaaEdu tutor. Ask me anything in ${language}.\n\nYou can:\n• Type your question below\n• 🎙️ Use voice to ask\n• Tap any chapter to study it\n• 🔊 Listen to my answers\n\nWhat would you like to learn today? ${meta.icon}`;
      setMessages([{ role:'assistant', content: welcomeMsg }]);
    }
  }, [subject, chapter]);

  const loadSession = async (sid) => {
    try {
      const r = await getChatSession(sid);
      setCurrentSessionId(sid);
      setSubject(r.data.session.subject);
      setGrade(r.data.session.grade);
      setSyllabus(r.data.session.syllabus);
      setChapter(r.data.session.chapter || '');
      setMessages(r.data.session.messages || []);
    } catch (err) { console.error(err); }
  };

  const newChat = () => { setCurrentSessionId(null); setMessages([]); };

  const deleteSession = async (sid, e) => {
    e.stopPropagation();
    await deleteChatSession(sid);
    setSessions(s => s.filter(x => x._id !== sid));
    if (currentSessionId === sid) newChat();
  };

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setSidebarOpen(false);
    setMessages(prev => [...prev, { role:'user', content:msg }]);
    setLoading(true);
    try {
      const r = await sendMessage({ sessionId: currentSessionId, message: msg, subject, grade, syllabus: getSyllabusKey(grade) || syllabus, chapter, language });
      setCurrentSessionId(r.data.sessionId);
      setMessages(prev => [...prev, { role:'assistant', content:r.data.reply }]);
      getChatSessions({ subject, limit: 15 }).then(r2 => setSessions(r2.data.sessions || [])).catch(() => {});
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      setMessages(prev => [...prev, { role:'assistant', content:'Error: ' + errMsg }]);
    }
    setLoading(false);
  };

  const isExamMode = EXAM_MODES.includes(grade);
  const examMeta   = isExamMode ? EXAM_META[grade] : null;
  const subjects   = SUBJECTS_BY_GRADE[grade] || [];
  const meta       = SUBJECT_META[subject] || SUBJECT_META.English;

  const SidebarContent = () => (
    <>
      {/* Subjects */}
      <div style={{ padding:'12px 10px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', padding:'0 4px 8px' }}>Subjects</div>
        {subjects.map(sub => {
          const sm = SUBJECT_META[sub] || { icon:'📖', color:'#4f8ef7', bg:'#4f8ef718' };
          const active = subject===sub;
          return <div key={sub} className="chat-sidebar-item" onClick={() => { setSubject(sub); setCurrentSessionId(null); setSidebarOpen(false); }}
            style={{ background:active?`${sm.color}15`:'', borderLeft:`3px solid ${active?sm.color:'transparent'}`, color:active?sm.color:'' }}>
            <span style={{ fontSize:14 }}>{sm?.icon}</span><span>{sub}</span>
          </div>;
        })}
      </div>
      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        {['chapters','history'].map(t => <button key={t} onClick={() => setSidebarTab(t)} style={{ flex:1, padding:'8px 4px', background:'transparent', border:'none', color:sidebarTab===t?'#ffd700':'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${sidebarTab===t?'#ffd700':'transparent'}` }}>{t}</button>)}
      </div>
      {sidebarTab === 'chapters' ? (
        <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
          {loadingChapters ? <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center', padding:16 }}>Loading...</div>
          : chapters.map((ch, i) => <div key={i} className="chat-sidebar-item" onClick={() => { setChapter(ch); send(`Explain: ${ch} for ${grade} ${syllabus} ${subject}`); setSidebarOpen(false); }}
            style={{ background:chapter===ch?`${meta.color}15`:'', borderLeft:`3px solid ${chapter===ch?meta.color:'transparent'}`, color:chapter===ch?meta.color:'' }}>
            <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10, minWidth:16 }}>{i+1}.</span>
            <span style={{ fontSize:11, lineHeight:1.3 }}>{ch}</span>
          </div>)}
        </div>
      ) : (
        <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
          <button onClick={() => { newChat(); setSidebarOpen(false); }} style={{ width:'100%', background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.3)', borderRadius:9, padding:'7px', color:'#4f8ef7', fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:8 }}>+ New Chat</button>
          {sessions.map(s => <div key={s._id} className="chat-sidebar-item" onClick={() => { loadSession(s._id); setSidebarOpen(false); }}
            style={{ background:currentSessionId===s._id?'rgba(255,255,255,0.07)':'', justifyContent:'space-between' }}>
            <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11 }}>{s.title || s.subject}</span>
            <button onClick={(e) => deleteSession(s._id,e)} style={{ background:'none', border:'none', color:'rgba(255,80,80,0.5)', cursor:'pointer', padding:'0 0 0 4px', fontSize:16 }}>×</button>
          </div>)}
        </div>
      )}
    </>
  );

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:"'Nunito',sans-serif", position:'relative' }}>
      <style>{`
        .chat-sidebar-item{padding:10px 12px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);transition:all 0.15s;display:flex;align-items:center;gap:8px;min-height:40px;}
        .chat-sidebar-item:hover,.chat-sidebar-item:active{background:rgba(255,255,255,0.07);color:white;}
        .chat-input-field{flex:1;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;padding:11px 14px;color:white;font-size:16px;font-family:'Nunito',sans-serif;outline:none;resize:none;line-height:1.5;min-height:44px;}
        .chat-input-field:focus{border-color:rgba(255,215,0,0.5);background:rgba(255,255,255,0.09);}
        .chat-input-field::placeholder{color:rgba(255,255,255,0.3);}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,80%,100%{opacity:0}40%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:9px;padding:7px 8px;color:white;font-family:'Nunito',sans-serif;font-size:16px;outline:none;cursor:pointer;max-width:110px;-webkit-appearance:none;}
        select option{background:#1a1a2e;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .chat-sidebar-desktop{width:210px;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;}
        .chat-sidebar-mobile{display:none;position:fixed;top:60px;left:0;bottom:calc(56px + env(safe-area-inset-bottom,0px));width:min(280px,85vw);background:#12122a;z-index:120;flex-direction:column;overflow-y:auto;border-right:1px solid rgba(255,255,255,0.1);box-shadow:4px 0 20px rgba(0,0,0,0.5);}
        .chat-sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:110;}
        .chat-header-selects{display:flex;gap:6px;align-items:center;}
        .chat-voice-badge{flex-shrink:0;}
        .chat-hint{color:rgba(255,255,255,0.2);font-size:10px;margin-top:4px;text-align:center;}
        .chat-height{display:flex;flex-direction:column;flex:1;overflow:hidden;height:100%;}
        @media(max-width:768px){
          .chat-sidebar-desktop{display:none!important;}
          .chat-sidebar-mobile{display:flex!important;}
          .chat-sidebar-overlay{display:block!important;}
          .chat-header-selects{display:none!important;}
          .chat-voice-badge{display:none!important;}
          .chat-hint{display:none!important;}
        }
      `}</style>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="chat-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile sidebar drawer */}
      <div className="chat-sidebar-mobile" style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.25s ease' }}>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="chat-sidebar-desktop">
        <SidebarContent />
      </div>

      {/* CHAT MAIN */}
      <div className="chat-height" style={{ flex:1, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:8, flexShrink:0, minHeight:52 }}>
          {/* Mobile: hamburger to open sidebar */}
          <button onClick={() => setSidebarOpen(o => !o)} className="mob-sidebar-btn" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, padding:'6px 10px', color:'white', fontSize:16, cursor:'pointer', display:'none', flexShrink:0 }}
            id="mob-sidebar-btn">☰</button>
          <style>{`@media(max-width:768px){#mob-sidebar-btn{display:block!important;}}`}</style>
          <div style={{ width:32, height:32, borderRadius:9, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{meta.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'white', fontWeight:800, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{subject} {chapter && <span style={{ color:meta.color, fontSize:12 }}>— {chapter.length>30?chapter.slice(0,30)+'…':chapter}</span>}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{grade} • {syllabus}</div>
          </div>
          <div className="chat-header-selects">
            {isExamMode ? (
              <span style={{ fontSize:11, padding:'4px 10px', borderRadius:10, fontWeight:700,
                background: examMeta?.bg, color: examMeta?.color,
                border:`1px solid ${examMeta?.color}55` }}>
                {examMeta?.badge}
              </span>
            ) : (
              <>
                <select value={grade} onChange={e => setGrade(e.target.value)}>
                  {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'].map(g=><option key={g} value={g}>{g}</option>)}
                </select>
                <select value={syllabus} onChange={e => setSyllabus(e.target.value)}>
                  {['CBSE','ICSE','Karnataka State'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <span className="chat-voice-badge" style={{ fontSize:10, padding:'3px 8px', borderRadius:10, fontWeight:700,
            background: elevenAvailable ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
            color: elevenAvailable ? '#a78bfa' : 'rgba(255,255,255,0.2)',
            border: elevenAvailable ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.06)' }}>
            {elevenAvailable ? '🎙 AI Voice' : '🔊 TTS'}
          </span>
          {(speaking || loadingAudio) && <button onClick={stopTTS} style={{ background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.3)', borderRadius:8, padding:'5px 8px', color:'#ff6b6b', fontSize:11, cursor:'pointer', fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>⏹</button>}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 14px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:12, gap:8, alignItems:'flex-end', animation:'msgIn 0.3s ease' }}>
                {!isUser && <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff9500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🎓</div>}
                <div style={{ maxWidth:'82%', background:isUser?'linear-gradient(135deg,#4f8ef7,#6c63ff)':'rgba(255,255,255,0.07)', border:isUser?'none':'1px solid rgba(255,255,255,0.1)', borderRadius:isUser?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'10px 14px', fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap', wordBreak:'break-word', color:'white' }}>
                  {msg.content}
                  {!isUser && (
                    <button onClick={() => { if (speaking || loadingAudio) { stopTTS(); } else { speak(msg.content, language); } }}
                      style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:7, padding:'4px 10px', marginTop:8, display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>
                      {loadingAudio ? '⏳ Loading...' : speaking ? '⏹ Stop' : '🔊 Listen'}
                    </button>
                  )}
                </div>
                {isUser && <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#4f8ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{user?.avatar||'👤'}</div>}
              </div>
            );
          })}
          {loading && (
            <div style={{ display:'flex', gap:8, alignItems:'flex-end', marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff9500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎓</div>
              <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px 18px 18px 4px', padding:'12px 16px', display:'flex', gap:5, alignItems:'center' }}>
                {[0,.2,.4].map((d,i)=><span key={i} style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.7)', animation:`blink 1.4s ${d}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Topic chips */}
        {chapters.length > 0 && !chapter && (
          <div style={{ padding:'6px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:6, flexWrap:'wrap', flexShrink:0 }}>
            {chapters.slice(0,3).map((ch,i) => (
              <button key={i} onClick={() => send(`Explain: ${ch}`)} style={{ background:meta.bg, border:`1px solid ${meta.color}35`, borderRadius:12, padding:'4px 10px', color:meta.color, fontSize:11, fontWeight:700, cursor:'pointer' }}>{ch.length>25?ch.slice(0,25)+'…':ch}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.15)', flexShrink:0 }}>
          {listening && <div style={{ color:'#ff5050', fontSize:12, fontWeight:700, marginBottom:6, display:'flex', alignItems:'center', gap:6 }}><span style={{ animation:'pulse 0.8s infinite', display:'inline-block' }}>🎙️</span> Listening...</div>}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea className="chat-input-field" rows={2} placeholder={`Ask about ${subject}...`} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} />
            <button onClick={listening?stopMic:startMic} style={{ background:listening?'rgba(255,80,80,0.2)':'rgba(255,255,255,0.07)', border:`1.5px solid ${listening?'#ff5050':'rgba(255,255,255,0.12)'}`, borderRadius:12, width:44, height:44, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{listening?'⏹️':'🎙️'}</button>
            <button onClick={() => send()} disabled={loading||!input.trim()} style={{ background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:12, width:44, height:44, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', opacity:loading||!input.trim()?0.5:1, color:'#1a1a2e', fontWeight:900, flexShrink:0 }}>
              {loading?<span style={{ width:16, height:16, border:'2.5px solid #1a1a2e', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>:'➤'}
            </button>
          </div>
          <div className="chat-hint">Enter to send • Shift+Enter new line • 🎙️ voice</div>
        </div>
      </div>
    </div>
  );
}
