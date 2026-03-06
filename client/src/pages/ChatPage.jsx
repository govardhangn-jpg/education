import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sendMessage, getCurriculum, getChatSessions, getChatSession, deleteChatSession } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTTS, useSpeechRecognition } from '../hooks/useSpeech';
import { SUBJECT_META, SUBJECTS_BY_GRADE, LANGUAGES } from '../utils/constants';

export default function ChatPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [grade, setGrade] = useState(user?.grade || 'Class 7');
  const [syllabus, setSyllabus] = useState(user?.syllabus || 'CBSE');
  const [subject, setSubject] = useState(params.get('subject') || SUBJECTS_BY_GRADE[user?.grade]?.[0] || 'Mathematics');
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
  const chatEndRef = useRef(null);
  const { speaking, loadingAudio, elevenAvailable, speak, stop: stopTTS } = useTTS();
  const handleVoice = useCallback((text) => setInput(p => p + text), []);
  const ttsLangCode = { English:'en-IN', Kannada:'kn-IN', Hindi:'hi-IN', Telugu:'te-IN', Tamil:'ta-IN' }[language] || 'en-IN';
  const { listening, start: startMic, stop: stopMic } = useSpeechRecognition(handleVoice, ttsLangCode);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load chapters
  useEffect(() => {
    if (!subject || !grade || !syllabus) return;
    setLoadingChapters(true);
    getCurriculum({ grade, syllabus, subject }).then(r => { setChapters(r.data.chapters || []); setChapter(''); }).catch(console.error).finally(() => setLoadingChapters(false));
  }, [subject, grade, syllabus]);

  // Load sessions
  useEffect(() => {
    getChatSessions({ subject, limit: 15 }).then(r => setSessions(r.data.sessions || [])).catch(console.error);
  }, [subject]);

  // Load session from URL param
  useEffect(() => {
    const sid = params.get('session');
    if (sid) loadSession(sid);
  }, []);

  // Welcome message on subject/chapter change
  useEffect(() => {
    if (!currentSessionId) {
      const meta = SUBJECT_META[subject] || SUBJECT_META.English;
      setMessages([{
        role: 'assistant',
        content: `Namaste ${user?.name}! 🙏\n\nWelcome to **${subject}** ${chapter ? `— Chapter: *${chapter}*` : ''} for **${grade}** (${syllabus})!\n\nI'm your SamarthaaEdu tutor. Ask me about any chapter, concept, or problem. I'll explain step by step in ${language}.\n\nYou can:\n• Type your question below\n• 🎙️ Use voice to ask\n• Click any chapter to focus on it\n• 🔊 Listen to my answers\n\nWhat would you like to learn today? ${meta.icon}`
      }]);
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
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const r = await sendMessage({ sessionId: currentSessionId, message: msg, subject, grade, syllabus, chapter, language });
      setCurrentSessionId(r.data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.reply }]);
      getChatSessions({ subject, limit: 15 }).then(r2 => setSessions(r2.data.sessions || [])).catch(() => {});
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + errMsg }]);
    }
    setLoading(false);
  };

  const subjects = SUBJECTS_BY_GRADE[grade] || [];
  const meta = SUBJECT_META[subject] || SUBJECT_META.English;

  return (
    <div style={{ display:'flex', height:'calc(100vh - 64px)', fontFamily:"'Nunito',sans-serif" }}>
      <style>{`
        .chat-sidebar-item{padding:9px 12px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:700;color:rgba(255,255,255,0.6);transition:all 0.15s;display:flex;align-items:center;gap:8px;}
        .chat-sidebar-item:hover{background:rgba(255,255,255,0.07);color:white;}
        .chat-input-field{flex:1;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;padding:11px 14px;color:white;font-size:14px;font-family:'Nunito',sans-serif;outline:none;resize:none;line-height:1.5;}
        .chat-input-field:focus{border-color:rgba(255,215,0,0.5);background:rgba(255,255,255,0.09);}
        .chat-input-field::placeholder{color:rgba(255,255,255,0.3);}
        @keyframes msgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,80%,100%{opacity:0}40%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        select{background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.1);border-radius:9px;padding:7px 10px;color:white;font-family:'Nunito',sans-serif;font-size:12px;outline:none;cursor:pointer;}
        select option{background:#1a1a2e;}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>

      {/* LEFT SIDEBAR */}
      <div style={{ width:220, background:'rgba(255,255,255,0.02)', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0, overflowY:'auto' }}>
        {/* Subjects */}
        <div style={{ padding:'14px 10px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', padding:'0 4px 8px' }}>Subjects</div>
          {subjects.map(sub => {
            const sm = SUBJECT_META[sub]; const active = subject===sub;
            return <div key={sub} className="chat-sidebar-item" onClick={() => { setSubject(sub); setCurrentSessionId(null); }}
              style={{ background:active?`${sm.color}15`:'', borderLeft:`3px solid ${active?sm.color:'transparent'}`, color:active?sm.color:'' }}>
              <span style={{ fontSize:14 }}>{sm?.icon}</span><span>{sub}</span>
            </div>;
          })}
        </div>

        {/* Sidebar Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          {['chapters','history'].map(t => <button key={t} onClick={() => setSidebarTab(t)} style={{ flex:1, padding:'8px 4px', background:'transparent', border:'none', color:sidebarTab===t?'#ffd700':'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, borderBottom:`2px solid ${sidebarTab===t?'#ffd700':'transparent'}` }}>{t}</button>)}
        </div>

        {sidebarTab === 'chapters' ? (
          <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
            {loadingChapters ? <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12, textAlign:'center', padding:16 }}>Loading...</div>
            : chapters.map((ch, i) => <div key={i} className="chat-sidebar-item" onClick={() => { setChapter(ch); send(`Explain the chapter: ${ch} for ${grade} ${syllabus} ${subject}`); }}
              style={{ background:chapter===ch?`${meta.color}15`:'', borderLeft:`3px solid ${chapter===ch?meta.color:'transparent'}`, color:chapter===ch?meta.color:'' }}>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10, minWidth:16 }}>{i+1}.</span>
              <span style={{ fontSize:11, lineHeight:1.3 }}>{ch}</span>
            </div>)}
          </div>
        ) : (
          <div style={{ flex:1, overflowY:'auto', padding:'8px 10px' }}>
            <button onClick={newChat} style={{ width:'100%', background:'rgba(79,142,247,0.12)', border:'1px solid rgba(79,142,247,0.3)', borderRadius:9, padding:'7px', color:'#4f8ef7', fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:8 }}>+ New Chat</button>
            {sessions.map(s => <div key={s._id} className="chat-sidebar-item" onClick={() => loadSession(s._id)}
              style={{ background:currentSessionId===s._id?'rgba(255,255,255,0.07)':'', justifyContent:'space-between' }}>
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:11 }}>{s.title || s.subject}</span>
              <button onClick={(e) => deleteSession(s._id,e)} style={{ background:'none', border:'none', color:'rgba(255,80,80,0.5)', cursor:'pointer', padding:'0 0 0 4px', fontSize:13 }}>×</button>
            </div>)}
          </div>
        )}
      </div>

      {/* CHAT MAIN */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Chat header */}
        <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{meta.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ color:'white', fontWeight:800, fontSize:15 }}>{subject} {chapter && <span style={{ color:meta.color, fontSize:13 }}>— {chapter.length > 40 ? chapter.slice(0,40)+'…' : chapter}</span>}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>{grade} • {syllabus}</div>
          </div>
          <select value={grade} onChange={e => setGrade(e.target.value)}>
            {Array.from({length:10},(_,i)=>`Class ${i+1}`).map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <select value={syllabus} onChange={e => setSyllabus(e.target.value)}>
            {['CBSE','ICSE','Karnataka State'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            {LANGUAGES.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:10, padding:'3px 10px', borderRadius:10, fontWeight:700,
              background: elevenAvailable ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)',
              color: elevenAvailable ? '#a78bfa' : 'rgba(255,255,255,0.3)',
              border: elevenAvailable ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
              {elevenAvailable ? '🎙 ElevenLabs' : '🔊 Browser TTS'}
            </span>
            {(speaking || loadingAudio) && <button onClick={stopTTS} style={{ background:'rgba(255,80,80,0.15)', border:'1px solid rgba(255,80,80,0.3)', borderRadius:8, padding:'5px 10px', color:'#ff6b6b', fontSize:11, cursor:'pointer' }}>⏹ Stop</button>}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'18px 22px' }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display:'flex', justifyContent:isUser?'flex-end':'flex-start', marginBottom:14, gap:9, alignItems:'flex-end', animation:'msgIn 0.3s ease' }}>
                {!isUser && <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff9500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🎓</div>}
                <div style={{ maxWidth:'76%', background:isUser?'linear-gradient(135deg,#4f8ef7,#6c63ff)':'rgba(255,255,255,0.07)', border:isUser?'none':'1px solid rgba(255,255,255,0.1)', borderRadius:isUser?'18px 18px 4px 18px':'18px 18px 18px 4px', padding:'11px 15px', fontSize:13.5, lineHeight:1.65, boxShadow:isUser?'0 4px 18px rgba(79,142,247,0.3)':'0 2px 10px rgba(0,0,0,0.15)', whiteSpace:'pre-wrap', wordBreak:'break-word', color:'white' }}>
                  {msg.content}
                  {!isUser && <button onClick={() => { if (speaking || loadingAudio) { stopTTS(); } else { speak(msg.content, language); } }} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:7, padding:'4px 10px', marginTop:8, display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.6)', fontSize:11, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{loadingAudio ? '⏳ Loading...' : speaking ? '⏹ Stop' : '🔊 Listen'}</button>}
                </div>
                {isUser && <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#6c63ff,#4f8ef7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{user?.avatar||'👤'}</div>}
              </div>
            );
          })}
          {loading && (
            <div style={{ display:'flex', gap:9, alignItems:'flex-end', marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff9500)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🎓</div>
              <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'18px 18px 18px 4px', padding:'14px 18px', display:'flex', gap:5, alignItems:'center' }}>
                {[0,.2,.4].map((d,i)=><span key={i} style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'rgba(255,255,255,0.7)', animation:`blink 1.4s ${d}s infinite` }}/>)}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick topic suggestions */}
        {chapters.length > 0 && !chapter && (
          <div style={{ padding:'8px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:7, flexWrap:'wrap', flexShrink:0 }}>
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:800, alignSelf:'center', textTransform:'uppercase' }}>Topics:</span>
            {chapters.slice(0,4).map((ch,i) => (
              <button key={i} onClick={() => send(`Explain: ${ch}`)} style={{ background:meta.bg, border:`1px solid ${meta.color}35`, borderRadius:14, padding:'4px 12px', color:meta.color, fontSize:11, fontWeight:700, cursor:'pointer' }}>{ch.length>30?ch.slice(0,30)+'…':ch}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.15)', flexShrink:0 }}>
          {listening && <div style={{ color:'#ff5050', fontSize:12, fontWeight:700, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}><span style={{ animation:'pulse 0.8s infinite', display:'inline-block' }}>🎙️</span> Listening...</div>}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea className="chat-input-field" rows={2} placeholder={`Ask about ${subject}${chapter?' — '+chapter:''}...`} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} />
            <button onClick={listening?stopMic:startMic} style={{ background:listening?'rgba(255,80,80,0.2)':'rgba(255,255,255,0.07)', border:`1.5px solid ${listening?'#ff5050':'rgba(255,255,255,0.12)'}`, borderRadius:12, width:46, height:46, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', animation:listening?'pulse 1s infinite':'' }}>{listening?'⏹️':'🎙️'}</button>
            <button onClick={() => send()} disabled={loading||!input.trim()} style={{ background:'linear-gradient(135deg,#ffd700,#ff9500)', border:'none', borderRadius:12, width:46, height:46, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', opacity:loading||!input.trim()?0.5:1, color:'#1a1a2e', fontWeight:900 }}>
              {loading?<span style={{ width:16, height:16, border:'2.5px solid #1a1a2e', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/>:'➤'}
            </button>
          </div>
          <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10, marginTop:6, textAlign:'center' }}>Enter to send • Shift+Enter new line • 🎙️ voice</div>
        </div>
      </div>
    </div>
  );
}
