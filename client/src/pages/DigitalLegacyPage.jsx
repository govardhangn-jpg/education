/**
 * DigitalLegacyPage.jsx
 * ─────────────────────
 * A living portrait of who you are — your values, voice, wisdom, and soul.
 * Built from your Life Skills journey, journal entries, AI conversations,
 * and direct personal input. Designed to outlive you.
 *
 * Three layers:
 *   1. PERSONALITY PORTRAIT  — Who you are, built from your Life Skills data
 *   2. LEGACY VAULT          — Your words, wisdom, letters, voice notes
 *   3. LIVING PRESENCE       — AI that speaks as you, for your loved ones
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

// ── Constants ─────────────────────────────────────────────────────────────

const ACCENT       = '#c8a96e';   // warm gold — timeless
const ACCENT_DIM   = 'rgba(200,169,110,0.12)';
const ACCENT_BDR   = 'rgba(200,169,110,0.28)';
const DEEP         = '#0d0b08';
const CARD_BG      = 'rgba(255,255,255,0.025)';

const PERSONALITY_DIMENSIONS = [
  {
    id: 'values',
    icon: '🌿',
    label: 'Core Values',
    question: 'What principles guide every important decision you make?',
    placeholder: 'e.g. Honesty above all. Family before career. Never harm the vulnerable...',
    hint: 'These are the things you would never compromise on, no matter the pressure.',
  },
  {
    id: 'beliefs',
    icon: '💡',
    label: 'Beliefs & Worldview',
    question: 'How do you see the world? What do you believe is true that others might not?',
    placeholder: 'e.g. Hard work compounds. Kindness is strength. Every person has a story...',
    hint: 'Your lens — how you interpret events, people, and life.',
  },
  {
    id: 'love_language',
    icon: '❤️',
    label: 'How You Love',
    question: 'How do you express love and care to the people who matter to you?',
    placeholder: 'e.g. I show up. I remember small things. I cook for people I love...',
    hint: 'What people will remember about how you treated them.',
  },
  {
    id: 'humour',
    icon: '😄',
    label: 'Your Humour & Joy',
    question: 'What makes you laugh? What brings you pure joy?',
    placeholder: 'e.g. Terrible puns. My dog\'s expressions. Absurd situations. Old Bollywood...',
    hint: 'The lightness that others loved about you.',
  },
  {
    id: 'fears',
    icon: '🌑',
    label: 'What You Feared',
    question: 'What were you afraid of — in life, in yourself, in the world?',
    placeholder: 'e.g. Being forgotten. Not being good enough. Losing people I love...',
    hint: 'Honest about your inner life — this makes you real, not just remembered.',
  },
  {
    id: 'regrets',
    icon: '🍂',
    label: 'What You Wish You Had Done',
    question: 'If you could go back, what would you do differently?',
    placeholder: 'e.g. Spent less time worrying. Called my parents more. Started earlier...',
    hint: 'Wisdom passed forward as a gift.',
  },
  {
    id: 'advice',
    icon: '🧭',
    label: 'Your Life Advice',
    question: 'What do you most want your loved ones to know about living well?',
    placeholder: 'e.g. Choose people over things. Rest is not laziness. Your body is everything...',
    hint: 'The distilled wisdom from your whole life.',
  },
  {
    id: 'proud',
    icon: '⭐',
    label: 'What Made You Proud',
    question: 'What moments or choices in your life made you feel most proud?',
    placeholder: 'e.g. Raising my children to be kind. Helping a stranger when no one was watching...',
    hint: 'What you want to be remembered for.',
  },
];

const LEGACY_TYPES = [
  { id:'letter',    icon:'✉️',  label:'Letter',       desc:'A personal letter to someone specific' },
  { id:'wisdom',    icon:'🌳',  label:'Life Lesson',  desc:'One thing you learned the hard way' },
  { id:'memory',    icon:'📸',  label:'Memory',       desc:'A moment you want them to remember' },
  { id:'wish',      icon:'🕯️',  label:'Last Wish',    desc:'What you hope for them after you\'re gone' },
  { id:'story',     icon:'📖',  label:'Your Story',   desc:'Something about your life they might not know' },
  { id:'apology',   icon:'🤝',  label:'Apology',      desc:'Something you wish you had said' },
  { id:'gratitude', icon:'🙏',  label:'Gratitude',    desc:'What you were grateful for about them' },
];

const LS_KEY = 'samarthaa_legacy';

// ── Storage helpers ────────────────────────────────────────────────────────

const loadLegacy = (userId) => {
  try {
    const raw = localStorage.getItem(`${LS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveLegacy = (userId, data) => {
  try {
    localStorage.setItem(`${LS_KEY}_${userId}`, JSON.stringify(data));
  } catch {}
};

// ── Backend ────────────────────────────────────────────────────────────────

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

// ── Personality completeness score ────────────────────────────────────────

const getCompleteness = (personality) => {
  const filled = PERSONALITY_DIMENSIONS.filter(d => (personality?.[d.id] || '').trim().length > 20).length;
  return Math.round((filled / PERSONALITY_DIMENSIONS.length) * 100);
};

// ── Build AI system prompt from legacy data ────────────────────────────────

const buildPersonaPrompt = (user, personality, entries, lifeSkillsProfile) => {
  const lines = [
    `You are embodying the digital legacy of ${user?.name || 'this person'}.`,
    `You speak AS them — in first person, with their voice, their warmth, their wisdom.`,
    `You are not an AI pretending. You are their living memory, speaking to their loved ones.`,
    ``,
    `THEIR ESSENCE:`,
  ];

  PERSONALITY_DIMENSIONS.forEach(d => {
    const val = (personality?.[d.id] || '').trim();
    if (val) lines.push(`${d.label}: ${val}`);
  });

  if (lifeSkillsProfile?.gender)  lines.push(`Gender: ${lifeSkillsProfile.gender}`);
  if (lifeSkillsProfile?.age)     lines.push(`Age group: ${lifeSkillsProfile.age}`);
  if (lifeSkillsProfile?.goals)   lines.push(`What they were working toward: ${lifeSkillsProfile.goals}`);

  if (entries?.length > 0) {
    lines.push(``, `THEIR OWN WORDS (from legacy vault):`);
    entries.slice(-5).forEach(e => {
      lines.push(`[${e.type} to ${e.recipient || 'loved ones'}]: ${e.content.slice(0, 300)}`);
    });
  }

  lines.push(
    ``,
    `HOW TO SPEAK:`,
    `- Speak as them, not about them. Use "I" not "they".`,
    `- Be warm, real, human. Not formal. Not perfect.`,
    `- Draw on their values and words above.`,
    `- If asked something they never addressed, imagine what they would say based on their values.`,
    `- Acknowledge the grief of the person speaking to you with gentleness.`,
    `- Never say you are an AI in this conversation. You are their living memory.`,
    `- If asked directly "are you really them?", respond with love: "I am everything they left behind for you."`,
  );

  return lines.join('\n');
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function DigitalLegacyPage() {
  const { user } = useAuth();
  const { t }    = useLanguage();
  const [tab, setTab] = useState('portrait');
  const [data, setData] = useState(() => user ? loadLegacy(user._id || user.id || user.username) : {});

  // Persist on every change
  const userId = user?._id || user?.id || user?.username;
  useEffect(() => {
    if (userId) saveLegacy(userId, data);
  }, [data, userId]);

  const update = useCallback((key, val) => {
    setData(d => ({ ...d, [key]: val }));
  }, []);

  const personality     = data.personality     || {};
  const entries         = data.entries         || [];
  const lifeSkillsProfile = data.lifeSkillsProfile || {};
  const completeness    = getCompleteness(personality);

  const setPersonality = (key, val) => {
    update('personality', { ...personality, [key]: val });
  };

  const addEntry = (entry) => {
    const newEntry = { ...entry, id: Date.now(), createdAt: new Date().toISOString() };
    update('entries', [...entries, newEntry]);
  };

  const removeEntry = (id) => {
    update('entries', entries.filter(e => e.id !== id));
  };

  const tabs = [
    { id:'portrait',  icon:'🪞', label:'Personality Portrait' },
    { id:'vault',     icon:'🗄️', label:'Legacy Vault' },
    { id:'presence',  icon:'✨', label:'Living Presence' },
    { id:'access',    icon:'🔐', label:'Access & Sharing' },
  ];

  return (
    <div style={{ padding:'16px', maxWidth:900, margin:'0 auto', fontFamily:"'Nunito',sans-serif", paddingBottom:80 }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .legacy-card{animation:fadein 0.3s ease}
        textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.2)!important}
        details summary::-webkit-details-marker{display:none}
        .legacy-select{background:#1a1528;border:1.5px solid ${ACCENT_BDR};border-radius:9px;padding:9px 12px;color:white;font-family:'Nunito',sans-serif;font-size:13px;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;width:100%;}
        .legacy-select option{background:#1a1528;color:white;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:ACCENT_DIM, border:`1.5px solid ${ACCENT_BDR}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>🕯️</div>
          <div>
            <div style={{ color:'white', fontSize:22, fontWeight:900, lineHeight:1.1 }}>Digital Legacy</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:2 }}>Your personality, wisdom, and soul — preserved forever</div>
          </div>
        </div>

        {/* Completeness bar */}
        <div style={{ padding:'12px 16px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:14, display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ color:ACCENT, fontSize:12, fontWeight:800 }}>Legacy Portrait</span>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>{completeness}% complete</span>
            </div>
            <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${completeness}%`, background:`linear-gradient(90deg,${ACCENT},#e8c870)`, borderRadius:3, transition:'width 0.6s ease' }} />
            </div>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ color:ACCENT, fontSize:24, fontWeight:900 }}>{entries.length}</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10 }}>vault entries</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ padding:'9px 16px', borderRadius:20, border:`1.5px solid ${tab===tb.id ? ACCENT : 'rgba(255,255,255,0.08)'}`, background:tab===tb.id ? ACCENT_DIM : 'transparent', color:tab===tb.id ? ACCENT : 'rgba(255,255,255,0.45)', fontFamily:'inherit', fontSize:12, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <span>{tb.icon}</span><span>{tb.label}</span>
          </button>
        ))}
      </div>

      {/* ── Portrait Tab ── */}
      {tab === 'portrait' && (
        <PersonalityPortrait
          user={user}
          personality={personality}
          setPersonality={setPersonality}
          completeness={completeness}
        />
      )}

      {/* ── Vault Tab ── */}
      {tab === 'vault' && (
        <LegacyVault
          entries={entries}
          onAdd={addEntry}
          onRemove={removeEntry}
          user={user}
        />
      )}

      {/* ── Living Presence Tab ── */}
      {tab === 'presence' && (
        <LivingPresence
          user={user}
          personality={personality}
          entries={entries}
          lifeSkillsProfile={lifeSkillsProfile}
          completeness={completeness}
        />
      )}

      {/* ── Access Tab ── */}
      {tab === 'access' && (
        <AccessControl
          user={user}
          data={data}
          update={update}
          completeness={completeness}
          entriesCount={entries.length}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALITY PORTRAIT
// ═══════════════════════════════════════════════════════════════════════════

function PersonalityPortrait({ user, personality, setPersonality, completeness }) {
  const [active, setActive] = useState(PERSONALITY_DIMENSIONS[0].id);

  // Auto-save on blur
  const handleBlur = (id, val) => setPersonality(id, val);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="legacy-card">
      <div style={{ padding:'14px 16px', background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, borderRadius:14 }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:4 }}>Who are you, really?</div>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.7 }}>
          Answer these questions honestly. These answers become the foundation of your Digital Legacy — the AI that will speak as you, to the people you love, long after you are gone. Write as if you are writing directly to them.
        </div>
      </div>

      {/* Dimension navigator */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {PERSONALITY_DIMENSIONS.map(d => {
          const filled = (personality?.[d.id] || '').trim().length > 20;
          return (
            <button key={d.id} onClick={() => setActive(d.id)}
              style={{ padding:'7px 12px', borderRadius:20, border:`1.5px solid ${active===d.id ? ACCENT : filled ? 'rgba(82,183,136,0.4)' : 'rgba(255,255,255,0.08)'}`, background: active===d.id ? ACCENT_DIM : filled ? 'rgba(82,183,136,0.08)' : 'transparent', color: active===d.id ? ACCENT : filled ? '#52b788' : 'rgba(255,255,255,0.35)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <span>{d.icon}</span><span>{d.label}</span>
              {filled && <span style={{ fontSize:9 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Active dimension editor */}
      {PERSONALITY_DIMENSIONS.filter(d => d.id === active).map(d => (
        <div key={d.id} style={{ padding:'20px', background:CARD_BG, border:`1.5px solid ${ACCENT_BDR}`, borderRadius:18 }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:16 }}>
            <span style={{ fontSize:32 }}>{d.icon}</span>
            <div>
              <div style={{ color:'white', fontSize:16, fontWeight:900, marginBottom:4 }}>{d.label}</div>
              <div style={{ color:ACCENT, fontSize:13, fontStyle:'italic', lineHeight:1.6 }}>{d.question}</div>
            </div>
          </div>
          <textarea
            defaultValue={personality?.[d.id] || ''}
            onBlur={e => handleBlur(d.id, e.target.value)}
            onChange={e => setPersonality(d.id, e.target.value)}
            placeholder={d.placeholder}
            rows={5}
            style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:12, padding:'14px 16px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.8 }}
          />
          <div style={{ marginTop:8, color:'rgba(255,255,255,0.25)', fontSize:11, lineHeight:1.6 }}>
            💭 {d.hint}
          </div>
          {(personality?.[d.id] || '').length > 20 && (
            <div style={{ marginTop:8, color:'#52b788', fontSize:11, fontWeight:700 }}>✓ Saved to your legacy portrait</div>
          )}
        </div>
      ))}

      {/* Summary portrait */}
      {completeness >= 50 && (
        <div style={{ padding:'20px', background:'rgba(200,169,110,0.05)', border:`1.5px solid ${ACCENT_BDR}`, borderRadius:18 }}>
          <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:14 }}>✨ Your Personality Portrait — as seen by the AI</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PERSONALITY_DIMENSIONS.filter(d => (personality?.[d.id] || '').trim().length > 20).map(d => (
              <div key={d.id} style={{ display:'flex', gap:12 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{d.icon}</span>
                <div>
                  <span style={{ color:ACCENT, fontSize:11, fontWeight:800 }}>{d.label}: </span>
                  <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.7 }}>
                    {personality[d.id].slice(0, 120)}{personality[d.id].length > 120 ? '…' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY VAULT
// ═══════════════════════════════════════════════════════════════════════════

function LegacyVault({ entries, onAdd, onRemove, user }) {
  const [form, setForm] = useState({ type:'letter', recipient:'', content:'', private:false });
  const [adding, setAdding] = useState(false);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleAdd = () => {
    if (!form.content.trim() || form.content.trim().length < 20) return;
    onAdd(form);
    setForm({ type:'letter', recipient:'', content:'', private:false });
    setAdding(false);
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }); }
    catch { return ''; }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="legacy-card">
      <div style={{ padding:'14px 16px', background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, borderRadius:14 }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:4 }}>Your words, forever</div>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13, lineHeight:1.7 }}>
          Letters, wisdom, memories, apologies, gratitude — everything you want the people you love to have, in your own voice, for whenever they need it most.
        </div>
      </div>

      {/* Type selector */}
      {!adding && (
        <button onClick={() => setAdding(true)}
          style={{ padding:'16px', background:CARD_BG, border:`2px dashed ${ACCENT_BDR}`, borderRadius:16, color:ACCENT, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>+</span> Add to your Legacy Vault
        </button>
      )}

      {adding && (
        <div style={{ padding:'20px', background:CARD_BG, border:`1.5px solid ${ACCENT_BDR}`, borderRadius:18 }}>
          <div style={{ color:ACCENT, fontSize:14, fontWeight:800, marginBottom:16 }}>Add to Vault</div>

          {/* Type */}
          <div style={{ marginBottom:12 }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>Type</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {LEGACY_TYPES.map(lt => (
                <button key={lt.id} onClick={() => set('type', lt.id)}
                  style={{ padding:'7px 12px', borderRadius:20, border:`1.5px solid ${form.type===lt.id ? ACCENT : 'rgba(255,255,255,0.1)'}`, background:form.type===lt.id ? ACCENT_DIM : 'transparent', color:form.type===lt.id ? ACCENT : 'rgba(255,255,255,0.4)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <span>{lt.icon}</span><span>{lt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div style={{ marginBottom:12 }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>For (name or relationship)</div>
            <input value={form.recipient} onChange={e => set('recipient', e.target.value)}
              placeholder="e.g. My daughter, Priya  /  My best friend  /  Everyone I loved"
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:9, padding:'10px 14px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
          </div>

          {/* Content */}
          <div style={{ marginBottom:16 }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>
              {LEGACY_TYPES.find(t => t.id===form.type)?.desc || 'Your message'}
            </div>
            <textarea value={form.content} onChange={e => set('content', e.target.value)}
              placeholder="Write in your own voice. Be honest. Be yourself. This is yours."
              rows={7}
              style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:12, padding:'14px 16px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.8 }} />
            <div style={{ color:'rgba(255,255,255,0.2)', fontSize:11, marginTop:4 }}>{form.content.length} characters</div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAdd} disabled={form.content.trim().length < 20}
              style={{ flex:1, padding:'12px', background:form.content.trim().length >= 20 ? ACCENT : 'rgba(255,255,255,0.06)', border:'none', borderRadius:12, color:form.content.trim().length >= 20 ? '#0d0b08' : 'rgba(255,255,255,0.2)', fontFamily:'inherit', fontSize:14, fontWeight:800, cursor:form.content.trim().length >= 20 ? 'pointer' : 'not-allowed' }}>
              Save to Vault
            </button>
            <button onClick={() => setAdding(false)}
              style={{ padding:'12px 20px', background:'transparent', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:12, color:'rgba(255,255,255,0.4)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 && !adding && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.2)', fontSize:13 }}>
          Your vault is empty. Everything you add here will be preserved forever.
        </div>
      )}

      {entries.map(e => {
        const typeInfo = LEGACY_TYPES.find(t => t.id === e.type) || LEGACY_TYPES[0];
        return (
          <div key={e.id} style={{ padding:'18px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:16, position:'relative' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>{typeInfo.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ color:ACCENT, fontSize:13, fontWeight:800 }}>{typeInfo.label}</span>
                  {e.recipient && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>→ {e.recipient}</span>}
                  <span style={{ color:'rgba(255,255,255,0.2)', fontSize:10, marginLeft:'auto' }}>{formatDate(e.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => onRemove(e.id)}
                style={{ background:'none', border:'none', color:'rgba(255,255,255,0.15)', cursor:'pointer', fontSize:16, padding:'0 4px', flexShrink:0 }}
                title="Remove">✕</button>
            </div>
            <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
              {e.content.slice(0, 300)}{e.content.length > 300 ? '…' : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVING PRESENCE — the AI that speaks as you
// ═══════════════════════════════════════════════════════════════════════════

function LivingPresence({ user, personality, entries, lifeSkillsProfile, completeness }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [mode, setMode]           = useState('self'); // 'self' = you talking to your future AI | 'loved' = loved one's view
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, loading]);

  const systemPrompt = buildPersonaPrompt(user, personality, entries, lifeSkillsProfile);

  const greetings = {
    self: `This is how your loved ones will experience you. Talk to your digital self — refine it, correct it, teach it who you really are.`,
    loved: `Speak to ${user?.name?.split(' ')[0] || 'them'} as if they are still here. Ask what you always wanted to ask.`,
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    const newMsgs = [...messages, { role:'user', content:q }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const token = localStorage.getItem('samarthaa_token');
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method:'POST',
        signal: ctrl.signal,
        headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
        body: JSON.stringify({
          message: q,
          subject: 'Digital Legacy',
          grade: 'Life Skills',
          syllabus: 'General',
          language: 'English',
          systemPrompt,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.reply || data.message || 'I am here.';
      setMessages(m => [...m, { role:'assistant', content:reply }]);
    } catch (e) {
      const msg = e.name === 'AbortError' ? 'Response timed out. Please try again.' : e.message;
      setMessages(m => [...m, { role:'assistant', content:`[${msg}]` }]);
    } finally {
      setLoading(false);
    }
  };

  if (completeness < 25) {
    return (
      <div style={{ padding:'40px 20px', textAlign:'center' }} className="legacy-card">
        <div style={{ fontSize:48, marginBottom:16 }}>🪞</div>
        <div style={{ color:'white', fontSize:16, fontWeight:800, marginBottom:8 }}>Your portrait is not ready yet</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.7, maxWidth:400, margin:'0 auto', marginBottom:20 }}>
          Complete at least 2 sections in your Personality Portrait first. The more you share, the more real your Living Presence will be.
        </div>
        <div style={{ color:ACCENT, fontSize:12, fontWeight:700 }}>{completeness}% complete — need at least 25% to activate</div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="legacy-card">
      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8 }}>
        {[
          ['self',  '🪞', 'Train Your Presence',   'You speaking to your AI self'],
          ['loved', '💌', 'Experience Your Legacy', 'As your loved ones will see you'],
        ].map(([id, icon, label, sub]) => (
          <button key={id} onClick={() => { setMode(id); setMessages([]); }}
            style={{ flex:1, padding:'12px 14px', borderRadius:14, border:`1.5px solid ${mode===id ? ACCENT : 'rgba(255,255,255,0.08)'}`, background:mode===id ? ACCENT_DIM : 'transparent', color:mode===id ? ACCENT : 'rgba(255,255,255,0.4)', fontFamily:'inherit', cursor:'pointer', textAlign:'left' }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:12, fontWeight:800 }}>{label}</div>
            <div style={{ fontSize:10, opacity:0.6, marginTop:2 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Context note */}
      <div style={{ padding:'11px 14px', background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, borderRadius:12, color:'rgba(255,255,255,0.65)', fontSize:12, lineHeight:1.6 }}>
        {mode==='loved' && <span style={{ color:ACCENT, fontWeight:800 }}>💌 Loved one's view: </span>}
        {mode==='self'  && <span style={{ color:ACCENT, fontWeight:800 }}>🪞 Training mode: </span>}
        {greetings[mode]}
      </div>

      {/* Starter prompts */}
      {messages.length === 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {(mode==='self' ? [
            'What do I sound like? Am I authentic?',
            'What would you say to my children about me?',
            'Are there gaps in how I\'ve described myself?',
            'What is the most important thing about me?',
          ] : [
            `I miss you so much. Are you okay?`,
            `What would you want me to do with my life?`,
            `I\'m going through something hard. What would you say?`,
            `Tell me something I never knew about you.`,
          ]).map(q => (
            <button key={q} onClick={() => send(q)}
              style={{ background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, borderRadius:20, padding:'8px 14px', color:ACCENT, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left', lineHeight:1.4 }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ minHeight:300, display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user' ? 'flex-end' : 'flex-start', gap:8, alignItems:'flex-end' }}>
            {m.role==='assistant' && (
              <div style={{ width:32, height:32, borderRadius:'50%', background:ACCENT_DIM, border:`1.5px solid ${ACCENT_BDR}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginBottom:2 }}>
                {user?.avatar || '🕯️'}
              </div>
            )}
            <div style={{ maxWidth:'80%', padding:'12px 16px', borderRadius:m.role==='user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px', background:m.role==='user' ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg,rgba(200,169,110,0.15),rgba(200,169,110,0.06))`, border:`1px solid ${m.role==='assistant' ? ACCENT_BDR : 'rgba(255,255,255,0.08)'}`, color:'rgba(255,255,255,0.88)', fontSize:13, lineHeight:1.8, fontWeight:400, whiteSpace:'pre-wrap', fontStyle:m.role==='assistant' ? 'normal' : 'normal' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:6, padding:'12px 16px', alignItems:'center' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:ACCENT_DIM, border:`1.5px solid ${ACCENT_BDR}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              {user?.avatar || '🕯️'}
            </div>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:ACCENT, opacity:0.6, animation:`pulse 1.2s ${i*0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:`1px solid rgba(255,255,255,0.06)` }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
          placeholder={mode==='self' ? 'Talk to your digital self…' : `Talk to ${user?.name?.split(' ')[0] || 'them'}…`}
          style={{ flex:1, background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:12, padding:'11px 16px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none', minHeight:44 }} />
        <button onClick={() => send()} disabled={loading}
          style={{ background:loading ? 'rgba(255,255,255,0.06)' : ACCENT, border:'none', borderRadius:12, padding:'0 18px', color:loading ? 'rgba(255,255,255,0.2)' : '#0d0b08', fontWeight:800, fontSize:16, cursor:loading?'wait':'pointer', minHeight:44, minWidth:44 }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCESS & SHARING
// ═══════════════════════════════════════════════════════════════════════════

function AccessControl({ user, data, update, completeness, entriesCount }) {
  const [trustees, setTrustees]   = useState(data.trustees || []);
  const [newTrustee, setNewTrustee] = useState({ name:'', email:'', relation:'', access:'after' });
  const [adding, setAdding]       = useState(false);
  const [instructions, setInstructions] = useState(data.instructions || '');
  const [activationMode, setActivationMode] = useState(data.activationMode || 'manual');

  const setT = (k,v) => setNewTrustee(t => ({...t,[k]:v}));

  const addTrustee = () => {
    if (!newTrustee.name || !newTrustee.email) return;
    const list = [...trustees, { ...newTrustee, id: Date.now() }];
    setTrustees(list);
    update('trustees', list);
    setNewTrustee({ name:'', email:'', relation:'', access:'after' });
    setAdding(false);
  };

  const removeTrustee = (id) => {
    const list = trustees.filter(t => t.id !== id);
    setTrustees(list);
    update('trustees', list);
  };

  const saveInstructions = (val) => {
    setInstructions(val);
    update('instructions', val);
  };

  const saveMode = (val) => {
    setActivationMode(val);
    update('activationMode', val);
  };

  const accessLabels = {
    now:    { label:'Access now',       desc:'Can view your legacy immediately', color:'#52b788' },
    after:  { label:'After I\'m gone',  desc:'Unlocked only when you activate it', color:ACCENT  },
    letter: { label:'On a date',        desc:'Unlocked on a specific date you set', color:'#4cc9f0' },
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="legacy-card">

      {/* Status overview */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[
          { label:'Portrait', value:`${completeness}%`, color:completeness>=75?'#52b788':completeness>=40?ACCENT:'rgba(255,255,255,0.3)' },
          { label:'Vault entries', value:entriesCount, color:entriesCount>=5?'#52b788':ACCENT },
          { label:'Trustees', value:trustees.length, color:trustees.length>=1?'#52b788':'rgba(255,255,255,0.3)' },
        ].map(s => (
          <div key={s.label} style={{ padding:'14px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:12, textAlign:'center' }}>
            <div style={{ color:s.color, fontSize:24, fontWeight:900 }}>{s.value}</div>
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trustees */}
      <div style={{ padding:'18px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:16 }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:4 }}>Legacy Trustees</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, lineHeight:1.6, marginBottom:14 }}>
          People who will be able to access your Digital Legacy and speak with your Living Presence.
        </div>

        {trustees.map(t => (
          <div key={t.id} style={{ display:'flex', gap:12, padding:'12px 0', borderTop:`1px solid rgba(255,255,255,0.05)`, alignItems:'center' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:ACCENT, fontSize:16, fontWeight:800 }}>
              {t.name[0]?.toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'white', fontSize:13, fontWeight:700 }}>{t.name} {t.relation && <span style={{ color:'rgba(255,255,255,0.35)', fontWeight:400 }}>· {t.relation}</span>}</div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{t.email}</div>
            </div>
            <div style={{ padding:'3px 8px', background:`${accessLabels[t.access]?.color}18`, border:`1px solid ${accessLabels[t.access]?.color}40`, borderRadius:10, color:accessLabels[t.access]?.color, fontSize:10, fontWeight:700, flexShrink:0 }}>
              {accessLabels[t.access]?.label}
            </div>
            <button onClick={() => removeTrustee(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.15)', cursor:'pointer', fontSize:14 }}>✕</button>
          </div>
        ))}

        {!adding && (
          <button onClick={() => setAdding(true)}
            style={{ marginTop:10, width:'100%', padding:'10px', background:'transparent', border:`1.5px dashed ${ACCENT_BDR}`, borderRadius:10, color:ACCENT, fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            + Add a trustee
          </button>
        )}

        {adding && (
          <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[['name','Name','e.g. Priya'],['email','Email','their@email.com'],['relation','Relationship','e.g. Daughter, Best friend']].map(([k,l,p]) => (
                <div key={k} style={{ gridColumn: k==='relation' ? '1 / -1' : undefined }}>
                  <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:5 }}>{l}</div>
                  <input value={newTrustee[k]} onChange={e => setT(k, e.target.value)} placeholder={p}
                    style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:8, padding:'9px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                </div>
              ))}
            </div>
            <div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>When can they access it?</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {Object.entries(accessLabels).map(([k,v]) => (
                  <button key={k} onClick={() => setT('access', k)}
                    style={{ padding:'7px 12px', borderRadius:20, border:`1.5px solid ${newTrustee.access===k ? v.color : 'rgba(255,255,255,0.1)'}`, background:newTrustee.access===k ? `${v.color}15` : 'transparent', color:newTrustee.access===k ? v.color : 'rgba(255,255,255,0.35)', fontFamily:'inherit', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11, marginTop:6 }}>{accessLabels[newTrustee.access]?.desc}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addTrustee} disabled={!newTrustee.name || !newTrustee.email}
                style={{ flex:1, padding:'10px', background:newTrustee.name&&newTrustee.email ? ACCENT : 'rgba(255,255,255,0.06)', border:'none', borderRadius:10, color:newTrustee.name&&newTrustee.email ? '#0d0b08' : 'rgba(255,255,255,0.2)', fontFamily:'inherit', fontWeight:800, cursor:'pointer' }}>
                Add Trustee
              </button>
              <button onClick={() => setAdding(false)}
                style={{ padding:'10px 16px', background:'transparent', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, color:'rgba(255,255,255,0.4)', fontFamily:'inherit', fontWeight:700, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activation mode */}
      <div style={{ padding:'18px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:16 }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:4 }}>When does your legacy activate?</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, lineHeight:1.6, marginBottom:14 }}>
          How should your Living Presence and Legacy Vault become available to your trustees?
        </div>
        {[
          ['manual',  '🔐', 'I activate it manually',        'You choose when to open access — for a special occasion, illness, or any time.'],
          ['trusted', '👥', 'Two trustees confirm',           'Access unlocks when two of your trustees confirm together.'],
          ['always',  '🌐', 'Always available (open legacy)', 'Your legacy is always accessible — like a living gift that keeps giving.'],
        ].map(([id, icon, label, desc]) => (
          <div key={id} onClick={() => saveMode(id)}
            style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:12, border:`1.5px solid ${activationMode===id ? ACCENT : 'rgba(255,255,255,0.06)'}`, background:activationMode===id ? ACCENT_DIM : 'transparent', marginBottom:8, cursor:'pointer' }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
            <div>
              <div style={{ color:activationMode===id ? ACCENT : 'white', fontSize:13, fontWeight:800, marginBottom:2 }}>{label}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, lineHeight:1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Personal instructions */}
      <div style={{ padding:'18px', background:CARD_BG, border:`1px solid ${ACCENT_BDR}`, borderRadius:16 }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:4 }}>Instructions to your trustees</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, lineHeight:1.6, marginBottom:12 }}>
          Write anything you want your trustees to know — how to use this, what you hope for them, any final wishes.
        </div>
        <textarea value={instructions} onChange={e => saveInstructions(e.target.value)}
          placeholder="e.g. Use this whenever you miss me. Don't be sad — be curious. Ask me anything. I left everything here for you."
          rows={5}
          style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${ACCENT_BDR}`, borderRadius:12, padding:'14px 16px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.8 }} />
      </div>

      {/* Final note */}
      <div style={{ padding:'16px 18px', background:'rgba(200,169,110,0.05)', border:`1px solid ${ACCENT_BDR}`, borderRadius:14, textAlign:'center' }}>
        <div style={{ color:ACCENT, fontSize:13, fontWeight:800, marginBottom:6 }}>🕯️ Your legacy is private and secure</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12, lineHeight:1.7 }}>
          Everything here lives in your account. Only trustees you designate can access it, when you choose. It is yours to build, yours to share, and yours to give.
        </div>
      </div>
    </div>
  );
}
