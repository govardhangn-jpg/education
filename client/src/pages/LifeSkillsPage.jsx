import { useState, useRef, useEffect } from 'react';

// ── Colour system ──────────────────────────────────────────────────────────
const MODULES = {
  finance: {
    id: 'finance', icon: '💰', label: 'Financial Literacy',
    accent: '#f4a261', accentDim: 'rgba(244,162,97,0.12)', accentBorder: 'rgba(244,162,97,0.3)',
    tagline: 'Build wealth slowly, build character first.',
  },
  ethics: {
    id: 'ethics', icon: '🌿', label: 'Ethics & Values',
    accent: '#52b788', accentDim: 'rgba(82,183,136,0.12)', accentBorder: 'rgba(82,183,136,0.3)',
    tagline: 'Who you are in the dark defines who you become in the light.',
  },
  relationships: {
    id: 'relationships', icon: '🤝', label: 'Relationships',
    accent: '#e07a5f', accentDim: 'rgba(224,122,95,0.12)', accentBorder: 'rgba(224,122,95,0.3)',
    tagline: 'Every relationship is a mirror. Look carefully.',
  },
  fitness: {
    id: 'fitness', icon: '💪', label: 'Fitness',
    accent: '#4cc9f0', accentDim: 'rgba(76,201,240,0.12)', accentBorder: 'rgba(76,201,240,0.3)',
    tagline: 'Your body is the only place you will live forever. Treat it accordingly.',
  },
  grooming: {
    id: 'grooming', icon: '✨', label: 'Grooming',
    accent: '#c77dff', accentDim: 'rgba(199,125,255,0.12)', accentBorder: 'rgba(199,125,255,0.3)',
    tagline: 'How you present yourself is how the world perceives you.',
  },
  lifestyle: {
    id: 'lifestyle', icon: '🌅', label: 'Lifestyle',
    accent: '#ffd166', accentDim: 'rgba(255,209,102,0.12)', accentBorder: 'rgba(255,209,102,0.3)',
    tagline: 'Design your life deliberately, or life will design it for you.',
  },
  etiquette: {
    id: 'etiquette', icon: '🎩', label: 'Etiquette',
    accent: '#b5e48c', accentDim: 'rgba(181,228,140,0.12)', accentBorder: 'rgba(181,228,140,0.3)',
    tagline: 'Good manners cost nothing but open every door.',
  },
};

// ── Wisdom quotes ──────────────────────────────────────────────────────────
const QUOTES = {
  finance: [
    { text: 'Do not save what is left after spending, but spend what is left after saving.', by: 'Warren Buffett' },
    { text: 'Financial freedom is available to those who learn about it and work for it.', by: 'Robert Kiyosaki' },
    { text: 'A budget is telling your money where to go instead of wondering where it went.', by: 'Dave Ramsey' },
    { text: 'The goal is not to be rich. The goal is to be free.', by: 'T. Harv Eker' },
    { text: 'It is not your salary that makes you rich; it is your spending habits.', by: 'Charles Jaffe' },
  ],
  ethics: [
    { text: 'The true measure of a man is how he treats someone who can do him absolutely no good.', by: 'Samuel Johnson' },
    { text: 'Character is doing the right thing when nobody is looking.', by: 'J.C. Watts' },
    { text: 'In matters of style, swim with the current. In matters of principle, stand like a rock.', by: 'Mahatma Gandhi' },
    { text: 'Integrity is doing the right thing, even when no one is watching.', by: 'C.S. Lewis' },
    { text: 'Your reputation is what others think of you; your character is what God knows of you.', by: 'Thomas Paine' },
  ],
  relationships: [
    { text: 'The quality of your life is the quality of your relationships.', by: 'Tony Robbins' },
    { text: 'You are the average of the five people you spend the most time with.', by: 'Jim Rohn' },
    { text: 'Speak when you are angry and you will make the best speech you will ever regret.', by: 'Ambrose Bierce' },
    { text: 'Attention is the rarest and purest form of generosity.', by: 'Simone Weil' },
    { text: 'The most important thing in the world is family and love.', by: 'John Wooden' },
  ],
  fitness: [
    { text: 'Take care of your body. It is the only place you have to live.', by: 'Jim Rohn' },
    { text: 'Exercise is a celebration of what your body can do, not a punishment for what you ate.', by: 'Unknown' },
    { text: 'The groundwork for all happiness is good health.', by: 'Leigh Hunt' },
    { text: 'Motivation gets you started. Habit keeps you going.', by: 'Jim Ryun' },
    { text: 'A man too busy to take care of his health is like a mechanic too busy to take care of his tools.', by: 'Spanish Proverb' },
  ],
  grooming: [
    { text: 'You never get a second chance to make a first impression.', by: 'Will Rogers' },
    { text: 'Dress shabbily and they remember the dress. Dress impeccably and they remember the person.', by: 'Coco Chanel' },
    { text: 'The secret to looking great is feeling great.', by: 'Unknown' },
    { text: 'Elegance is not about being noticed, it is about being remembered.', by: 'Giorgio Armani' },
    { text: 'Style is knowing who you are and what you want to say.', by: 'Quentin Crisp' },
  ],
  lifestyle: [
    { text: 'Your lifestyle is your brand.', by: 'Unknown' },
    { text: 'The way you live your days is the way you live your life.', by: 'Annie Dillard' },
    { text: 'Simplicity is the ultimate sophistication.', by: 'Leonardo da Vinci' },
    { text: 'You can have anything you want, but not everything you want.', by: 'Peter McWilliams' },
    { text: 'Beware the barrenness of a busy life.', by: 'Socrates' },
  ],
  etiquette: [
    { text: 'Politeness is the art of choosing among one\'s real thoughts.', by: 'Abel Stevens' },
    { text: 'Rudeness is the weak person\'s imitation of strength.', by: 'Eric Hoffer' },
    { text: 'The measure of a person\'s greatness is what it takes to upset them.', by: 'Unknown' },
    { text: 'A person who has good thoughts cannot ever be ugly.', by: 'Roald Dahl' },
    { text: 'Treat everyone with politeness, even those who are rude to you.', by: 'Unknown' },
  ],
};

// ── Daily habits ───────────────────────────────────────────────────────────
const HABITS = {
  finance: [
    { id:'f1', text:'Logged every rupee I spent today' },
    { id:'f2', text:'Said no to one unnecessary purchase' },
    { id:'f3', text:'Transferred money to savings first' },
    { id:'f4', text:'Checked my net worth / account balance' },
    { id:'f5', text:'Read or listened to something about finance' },
    { id:'f6', text:'Planned tomorrow\'s spending in advance' },
  ],
  ethics: [
    { id:'e1', text:'Told the truth even when it was uncomfortable' },
    { id:'e2', text:'Kept a promise I made to someone' },
    { id:'e3', text:'Did something kind without expecting anything back' },
    { id:'e4', text:'Admitted a mistake and took responsibility' },
    { id:'e5', text:'Paused before reacting in a difficult situation' },
    { id:'e6', text:'Asked myself: "Is this the right thing to do?"' },
  ],
  relationships: [
    { id:'r1', text:'Put my phone away during a conversation' },
    { id:'r2', text:'Expressed genuine appreciation to someone' },
    { id:'r3', text:'Listened without interrupting or advising' },
    { id:'r4', text:'Reached out to someone I haven\'t spoken to in a while' },
    { id:'r5', text:'Resolved or addressed a tension rather than avoiding it' },
    { id:'r6', text:'Spent meaningful time with family' },
  ],
  fitness: [
    { id:'fit1', text:'Got at least 30 minutes of movement today' },
    { id:'fit2', text:'Drank at least 2 litres of water' },
    { id:'fit3', text:'Slept 7–8 hours last night' },
    { id:'fit4', text:'Ate at least 2 proper meals with vegetables' },
    { id:'fit5', text:'Took stairs or walked instead of using a vehicle' },
    { id:'fit6', text:'Did stretching or mobility work' },
  ],
  grooming: [
    { id:'g1', text:'Showered and used deodorant / antiperspirant' },
    { id:'g2', text:'Brushed teeth morning and night' },
    { id:'g3', text:'Clothes are clean, ironed, and appropriate' },
    { id:'g4', text:'Hair is clean and styled intentionally' },
    { id:'g5', text:'Nails are trimmed and clean' },
    { id:'g6', text:'Moisturised face / applied sunscreen (SPF 30+)' },
  ],
  lifestyle: [
    { id:'l1', text:'Woke up without hitting snooze' },
    { id:'l2', text:'Spent at least 20 minutes on something I love' },
    { id:'l3', text:'Had no screens for the first 30 minutes of my day' },
    { id:'l4', text:'Read or listened to something that grew my mind' },
    { id:'l5', text:'Planned tomorrow before bed' },
    { id:'l6', text:'Spent time in nature or fresh air' },
  ],
  etiquette: [
    { id:'et1', text:'Greeted everyone I met with eye contact and a smile' },
    { id:'et2', text:'Said please, thank you, and excuse me as needed' },
    { id:'et3', text:'Was on time for every commitment' },
    { id:'et4', text:'Kept my phone silent in social/professional settings' },
    { id:'et5', text:'Listened without interrupting in conversations' },
    { id:'et6', text:'Replied to messages and emails within a reasonable time' },
  ],
};

// ── Reflection prompts ─────────────────────────────────────────────────────
const REFLECTIONS = {
  finance: [
    'What is one money habit from your childhood that still affects you today?',
    'If your salary doubled tomorrow, what would you do differently?',
    'What does financial freedom mean to you — and what is your number?',
    'What is one thing you regularly spend money on that doesn\'t actually make you happy?',
    'Who taught you about money? What did they get right? What did they get wrong?',
  ],
  ethics: [
    'Describe a time you did the right thing when it cost you something.',
    'What is one value you hold that most people around you don\'t share?',
    'When have you compromised your values? What did you learn?',
    'If everyone could see your private thoughts for one day, what would they see?',
    'What does it mean to live with integrity in your specific life and context?',
  ],
  relationships: [
    'Who in your life deserves more of your time and attention than they get?',
    'What is one relationship pattern you keep repeating that no longer serves you?',
    'How do you show love? Is that how the people you love best receive it?',
    'What is one conversation you have been avoiding that you know you need to have?',
    'How do you show up for people when they are suffering, and is that enough?',
  ],
  fitness: [
    'What is the single biggest reason you do not exercise consistently — and is that really true?',
    'If you treated your sleep like a business meeting, what would change?',
    'What does your body feel like right now — and what is it telling you?',
    'Who in your life is physically healthier than you, and what do they do differently?',
    'If you knew you would live to 90, what would you start doing differently today?',
  ],
  grooming: [
    'How do you feel when you are well-groomed versus when you are not? What does that tell you?',
    'What does your wardrobe say about who you are — and who you want to be?',
    'Is there one grooming habit you have been neglecting that you know matters?',
    'How do others experience your physical presence — and are you happy with that?',
    'What would you change about your appearance if money and time were not obstacles?',
  ],
  lifestyle: [
    'If you could design your perfect day, what would it look like — and how far is your current life from that?',
    'What are you filling your time with that does not actually make you happy?',
    'What does rest mean to you — and do you get enough of it?',
    'What one lifestyle change would have the biggest positive ripple effect on everything else?',
    'Whose lifestyle do you admire, and what specifically about it do you want to adopt?',
  ],
  etiquette: [
    'In what situation do you feel most uncomfortable with social expectations — and why?',
    'Think of someone with exceptional social grace. What exactly do they do differently?',
    'Is there a setting (work, social, family) where your behaviour does not reflect your best self?',
    'What is one social habit of yours that you know puts people off, even slightly?',
    'How do you behave toward service staff — and what does that say about your character?',
  ],
};

// ── Budget tool data ───────────────────────────────────────────────────────
const BUDGET_CATEGORIES = [
  { id:'needs',    label:'Needs (50%)',    desc:'Rent, food, bills, transport', target:50, color:'#f4a261' },
  { id:'wants',    label:'Wants (30%)',    desc:'Entertainment, dining, shopping', target:30, color:'#e9c46a' },
  { id:'savings',  label:'Savings (20%)', desc:'Emergency fund, investments, goals', target:20, color:'#52b788' },
];

const VALUES_LIST = [
  'Honesty','Courage','Compassion','Discipline','Humility','Loyalty',
  'Justice','Gratitude','Wisdom','Creativity','Service','Perseverance',
  'Kindness','Integrity','Respect','Curiosity','Generosity','Patience',
];

const RELATIONSHIP_CIRCLES = [
  { id:'inner', label:'Inner Circle', desc:'Family & closest friends — people you\'d call at 2am', max:5, color:'#e07a5f' },
  { id:'close', label:'Close Circle', desc:'Good friends & trusted colleagues', max:15, color:'#f4a261' },
  { id:'social', label:'Social Circle', desc:'Acquaintances, community, network', max:50, color:'rgba(255,255,255,0.3)' },
];

// ── AI Coach ───────────────────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

const COACH_PROMPTS = {
  finance: `You are a warm, wise personal finance coach. You help people develop healthy relationships with money — not just tactics, but mindset. You draw on Indian context when relevant (rupees, SIPs, gold, joint families, etc.). Keep responses concise, personal and actionable. Ask one follow-up question at the end.`,
  ethics: `You are a thoughtful ethics mentor — not preachy, but deeply honest. You help people examine their values, navigate moral dilemmas, and live with more integrity. You draw on philosophy, psychology, and real life. Keep responses warm but unflinching. Ask one probing question at the end.`,
  relationships: `You are a compassionate relationship coach who helps people build deeper, healthier connections — with family, friends, colleagues, and themselves. You are practical, not theoretical. Keep responses human and specific. Ask one reflective question at the end.`,
  fitness: `You are a knowledgeable fitness and health coach. You give practical, science-based advice on exercise, nutrition, sleep, and recovery — tailored to the user's age, gender, and lifestyle. You are encouraging but honest about what actually works. Use Indian context (dal-chawal, roti, chai culture, office jobs, heat) when relevant. Give specific, actionable recommendations. Ask one motivating question at the end.`,
  grooming: `You are a sophisticated personal style and grooming advisor. You give honest, practical advice on skincare, haircare, clothing, and personal presentation — always tailored to the user's gender, age, climate, and budget. You are direct and specific, never vague. You reference Indian climate, skin tones, and cultural context where relevant. Ask one question at the end to give better advice.`,
  lifestyle: `You are a thoughtful life design coach. You help people build intentional, balanced lifestyles — sleep, habits, routines, work-life balance, hobbies, environment, digital wellness. You consider the user's age, income, gender, and life stage. You give concrete recommendations, not platitudes. Draw on Indian urban/semi-urban context when relevant. Ask one clarifying question at the end.`,
  etiquette: `You are a gracious etiquette and social intelligence coach. You teach practical social skills — dining etiquette, professional conduct, digital etiquette, conversation skills, body language, cultural sensitivity, and how to make people feel at ease. You are warm, not stuffy. Give specific, actionable tips. Ask one question at the end.`,
};

function AICoach({ moduleId, accent, accentDim, accentBorder, userProfile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const endRef = useRef(null);
  const mod = MODULES[moduleId];

  const starterQuestions = {
    finance:       ['How do I start investing with a small salary?', "I can't stop impulse spending — help", 'How much emergency fund do I need?'],
    ethics:        ['I feel pressured to lie at work — what do I do?', 'How do I stay honest when it hurts people?', 'I compromised my values — how do I recover?'],
    relationships: ['How do I set boundaries without hurting people?', 'My family relationships feel draining — help', 'How do I rebuild trust after a mistake?'],
    fitness:       ['Build me a beginner workout plan', 'What should I eat to lose weight healthily?', 'How do I fix my terrible sleep?'],
    grooming:      ['What skincare routine should I follow?', 'How do I dress better on a budget?', 'My hair looks bad — what do I do?'],
    lifestyle:     ['How do I build a morning routine that actually works?', 'I feel like I have no time for myself — help', 'How do I reduce screen time?'],
    etiquette:     ['How should I behave at a formal dinner?', 'What are the rules for professional WhatsApp messages?', 'How do I introduce myself confidently?'],
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Reset messages when module changes
  useEffect(() => { setMessages([]); }, [moduleId]);

  const buildSystemPrompt = () => {
    let base = COACH_PROMPTS[moduleId];
    if (userProfile && (userProfile.gender || userProfile.age || userProfile.income || userProfile.city)) {
      const parts = [];
      if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`);
      if (userProfile.age)    parts.push(`Age: ${userProfile.age}`);
      if (userProfile.income) parts.push(`Monthly income: ₹${userProfile.income}`);
      if (userProfile.city)   parts.push(`City: ${userProfile.city}`);
      if (userProfile.goals)  parts.push(`Goals: ${userProfile.goals}`);
      if (parts.length > 0)   base += `\n\nUser profile: ${parts.join(', ')}. Tailor all advice specifically to this profile.`;
    }
    return base;
  };

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    const newMessages = [...messages, { role:'user', content:q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          message: q,
          history: newMessages.slice(-10),
          systemPrompt: buildSystemPrompt(),
          subject: mod.label,
          grade: 'Life Skills',
          syllabus: 'General',
        }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role:'assistant', content: data.reply || data.message || "I'm here. Tell me more." }]);
    } catch {
      setMessages(m => [...m, { role:'assistant', content:'Something went wrong. Try again.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {messages.length === 0 && (
        <div style={{ padding:'0 0 16px' }}>
          <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.8px' }}>Quick start</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(starterQuestions[moduleId] || []).map(q => (
              <button key={q} onClick={() => send(q)}
                style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, padding:'8px 14px', color:accent, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left', lineHeight:1.4 }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, minHeight:0, paddingRight:4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth:'85%', padding:'12px 16px', borderRadius: m.role==='user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role==='user' ? accent : 'rgba(255,255,255,0.06)', color: m.role==='user' ? '#0d0d0d' : 'rgba(255,255,255,0.88)', fontSize:13, lineHeight:1.7, fontWeight: m.role==='user' ? 700 : 400, whiteSpace:'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:5, padding:'12px 16px' }}>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:accent, opacity:0.7, animation:`bounce 1.2s ${i*0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ display:'flex', gap:8, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
          placeholder={`Ask your ${mod.label.toLowerCase()} coach...`}
          style={{ flex:1, background:'rgba(255,255,255,0.05)', border:`1px solid ${accentBorder}`, borderRadius:12, padding:'11px 16px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none', minHeight:44 }} />
        <button onClick={() => send()} style={{ background:accent, border:'none', borderRadius:12, padding:'0 18px', color:'#0d0d0d', fontWeight:800, fontSize:16, cursor:'pointer', minHeight:44, minWidth:44 }}>↑</button>
      </div>
    </div>
  );
}

// ── Finance Module ─────────────────────────────────────────────────────────
function FinanceModule({ accent, accentDim, accentBorder }) {
  const [income, setIncome]   = useState('');
  const [spent, setSpent]     = useState({ needs:'', wants:'', savings:'' });
  const [tab, setTab]         = useState('budget');

  const inc = parseFloat(income) || 0;
  const totSpent = Object.values(spent).reduce((a,v) => a+(parseFloat(v)||0), 0);
  const remaining = inc - totSpent;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['budget','📊 50/30/20 Budget'],['roadmap','🗺️ Financial Roadmap'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'budget' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {/* Income input */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16, padding:20 }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Monthly Income (₹)</div>
            <input value={income} onChange={e => setIncome(e.target.value)} type="number" placeholder="e.g. 50000"
              style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'12px 16px', color:'white', fontSize:20, fontWeight:800, fontFamily:'inherit', outline:'none' }} />
            {inc > 0 && (
              <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                {BUDGET_CATEGORIES.map(cat => {
                  const target = Math.round(inc * cat.target / 100);
                  const actual = parseFloat(spent[cat.id]) || 0;
                  const pct = inc > 0 ? Math.min(100, (actual/target)*100) : 0;
                  const over = actual > target;
                  return (
                    <div key={cat.id}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, fontWeight:700 }}>{cat.label}</span>
                        <span style={{ color: over ? '#e74c3c' : cat.color, fontSize:12, fontWeight:800 }}>₹{target.toLocaleString()}</span>
                      </div>
                      <div style={{ height:6, background:'rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background: over ? '#e74c3c' : cat.color, borderRadius:10, transition:'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spending tracker */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16, padding:20 }}>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>This Month's Actual Spending</div>
            {BUDGET_CATEGORIES.map(cat => (
              <div key={cat.id} style={{ marginBottom:14 }}>
                <div style={{ color:cat.color, fontSize:12, fontWeight:700, marginBottom:6 }}>{cat.desc}</div>
                <input value={spent[cat.id]} onChange={e => setSpent(s => ({...s,[cat.id]:e.target.value}))} type="number" placeholder="₹ 0"
                  style={{ width:'100%', background:'rgba(255,255,255,0.06)', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:15, fontWeight:700, fontFamily:'inherit', outline:'none' }} />
              </div>
            ))}
            {inc > 0 && (
              <div style={{ marginTop:8, padding:'12px 16px', borderRadius:12, background: remaining >= 0 ? 'rgba(82,183,136,0.1)' : 'rgba(231,76,60,0.1)', border:`1px solid ${remaining >= 0 ? 'rgba(82,183,136,0.3)' : 'rgba(231,76,60,0.3)'}` }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700 }}>REMAINING</div>
                <div style={{ color: remaining >= 0 ? '#52b788' : '#e74c3c', fontSize:22, fontWeight:900, marginTop:4 }}>₹{Math.abs(remaining).toLocaleString()} {remaining < 0 ? 'over' : 'left'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'roadmap' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { step:1, title:'Build a ₹10,000 Emergency Cushion', desc:'Before anything else. Keep in a savings account. Touch only for true emergencies.', icon:'🛡️', key:'starter' },
            { step:2, title:'Zero High-Interest Debt', desc:'Credit cards, personal loans. Pay these off before investing. No investment beats 36% interest.', icon:'⚔️', key:'debt' },
            { step:3, title:'3–6 Month Emergency Fund', desc:'Your real safety net. Keep in a liquid fund or FD. Based on your monthly expenses.', icon:'🏦', key:'emergency' },
            { step:4, title:'Start a SIP — Even ₹500/month', desc:'Index funds. Nifty 50. Start now. Time in market > timing the market.', icon:'📈', key:'invest' },
            { step:5, title:'Get Term Insurance', desc:'If anyone depends on your income. Pure term. 10–15x annual income. No ULIPs.', icon:'🔒', key:'insurance' },
            { step:6, title:'Build Long-term Wealth', desc:'PPF, NPS, equity mutual funds. Think 10–20 years. Automate everything.', icon:'🌳', key:'wealth' },
          ].map((item, i) => (
            <div key={item.key} style={{ display:'flex', gap:14, padding:'16px 18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14, alignItems:'flex-start' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:accentDim, border:`1.5px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{item.icon}</div>
              <div>
                <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px' }}>Step {item.step}</div>
                <div style={{ color:'white', fontSize:14, fontWeight:800, margin:'2px 0 5px' }}>{item.title}</div>
                <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="finance" accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
        </div>
      )}
    </div>
  );
}

// ── Ethics Module ──────────────────────────────────────────────────────────
function EthicsModule({ accent, accentDim, accentBorder }) {
  const [tab, setTab]             = useState('compass');
  const [selectedValues, setSelected] = useState([]);
  const [scenario, setScenario]   = useState(0);

  const toggleValue = v => setSelected(s => s.includes(v) ? s.filter(x=>x!==v) : s.length < 5 ? [...s, v] : s);

  const dilemmas = [
    { title:'The Honest Reference', q:'Your colleague asks you to give them a glowing reference, but you know they struggled significantly in their last role. The hiring company calls you. What do you say?', options:['Give the reference they asked for — they\'re a friend', 'Politely decline to give a reference', 'Be honest about both strengths and weaknesses', 'Tell the company you can\'t give a full picture'] },
    { title:'The Overcharged Bill', q:'A restaurant gives you a bill that is ₹500 less than it should be. You\'re with friends and everyone is ready to leave. Do you say something?', options:['Say nothing — it\'s their mistake', 'Tell the waiter quietly', 'Tell the waiter in front of everyone', 'Depends on how wealthy the restaurant looks'] },
    { title:'The Team Credit', q:'You did most of the work on a project. Your manager praises the whole team equally in front of senior leadership. Your teammates say nothing. Do you speak up?', options:['Stay quiet — teams share credit', 'Mention your contribution professionally', 'Talk to your manager privately afterwards', 'Let your team know you\'re unhappy'] },
    { title:'The Shortcut', q:'You discover that by cutting a corner at work — something technically against policy but that nobody checks — you could save yourself 2 hours a day. Nobody would ever know. Do you do it?', options:['Yes — the policy is outdated anyway', 'No — rules are rules', 'Yes, but only occasionally', 'Report the inefficient policy first, then decide'] },
  ];

  const d = dilemmas[scenario % dilemmas.length];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['compass','🧭 Values Compass'],['dilemma','⚖️ Dilemma Lab'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'compass' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Choose your <strong style={{color:'white'}}>top 5 core values</strong> — the principles you are not willing to compromise, even when it is costly. Be honest, not aspirational.
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {VALUES_LIST.map(v => {
              const sel = selectedValues.includes(v);
              return (
                <button key={v} onClick={() => toggleValue(v)}
                  style={{ padding:'8px 16px', borderRadius:20, border:`1.5px solid ${sel ? accent : 'rgba(255,255,255,0.1)'}`, background: sel ? accentDim : 'transparent', color: sel ? accent : 'rgba(255,255,255,0.55)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
                  {v}
                </button>
              );
            })}
          </div>
          {selectedValues.length === 5 && (
            <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:14 }}>Your Core Values</div>
              {selectedValues.map((v,i) => (
                <div key={v} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:accentDim, border:`1.5px solid ${accent}`, display:'flex', alignItems:'center', justifyContent:'center', color:accent, fontSize:12, fontWeight:900, flexShrink:0 }}>{i+1}</div>
                  <div>
                    <div style={{ color:'white', fontSize:14, fontWeight:800 }}>{v}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>When did you last act on this value?</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:14, padding:'12px 16px', background:accentDim, borderRadius:12, color:accent, fontSize:12, fontWeight:700, lineHeight:1.6 }}>
                💡 Now ask yourself: in the last 30 days, did your actions reflect these 5 values? Where did you succeed? Where did you fall short?
              </div>
            </div>
          )}
          {selectedValues.length > 0 && selectedValues.length < 5 && (
            <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>Select {5 - selectedValues.length} more value{5-selectedValues.length!==1?'s':''}</div>
          )}
        </div>
      )}

      {tab === 'dilemma' && (
        <div>
          <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16, marginBottom:16 }}>
            <div style={{ color:accent, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Dilemma {(scenario % dilemmas.length)+1} of {dilemmas.length}</div>
            <div style={{ color:'white', fontSize:16, fontWeight:800, marginBottom:12 }}>{d.title}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8 }}>{d.q}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {d.options.map((opt, i) => (
              <div key={i} style={{ padding:'14px 18px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.5 }}>
                <span style={{ color:accent, fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setScenario(s => s+1)}
              style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${accentBorder}`, background:accentDim, color:accent, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              Next Dilemma →
            </button>
          </div>
          <div style={{ marginTop:14, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:12, color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.7 }}>
            There are no right answers here. The point is to notice <em>why</em> you lean toward a particular option. Discuss this with your AI coach above for deeper reflection.
          </div>
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="ethics" accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
        </div>
      )}
    </div>
  );
}

// ── Relationships Module ───────────────────────────────────────────────────
function RelationshipsModule({ accent, accentDim, accentBorder }) {
  const [tab, setTab]               = useState('map');
  const [circleData, setCircleData] = useState({ inner:[], close:[], social:[] });
  const [newName, setNewName]       = useState({ inner:'', close:'', social:'' });
  const [loveLang, setLoveLang]     = useState(null);

  const addPerson = (circle) => {
    const name = newName[circle].trim();
    if (!name) return;
    setCircleData(d => ({ ...d, [circle]: [...d[circle], name] }));
    setNewName(n => ({ ...n, [circle]:'' }));
  };

  const LOVE_LANGS = [
    { id:'words',   icon:'💬', label:'Words of Affirmation', desc:'You feel loved through verbal praise, encouragement, and "I love you".' },
    { id:'quality', icon:'⏱️', label:'Quality Time',         desc:'You feel loved through undivided attention and shared experiences.' },
    { id:'gifts',   icon:'🎁', label:'Receiving Gifts',      desc:'You feel loved through thoughtful tokens and symbolic gestures.' },
    { id:'service', icon:'🛠️', label:'Acts of Service',     desc:'You feel loved when someone helps you, does things for you, lightens your load.' },
    { id:'touch',   icon:'🤗', label:'Physical Touch',       desc:'You feel loved through hugs, presence, and physical closeness.' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['map','🗺️ Relationship Map'],['love','💝 Love Languages'],['coach','🤖 AI Coach']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background: tab===id ? accentDim : 'transparent', color: tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'map' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Map your relationships. Research shows people with strong, diverse circles are healthier, happier, and more resilient. Be honest about who is truly in each circle.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
            {RELATIONSHIP_CIRCLES.map(circle => (
              <div key={circle.id} style={{ padding:18, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ color:circle.color, fontSize:13, fontWeight:800 }}>{circle.label}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, marginTop:2, lineHeight:1.5 }}>{circle.desc}</div>
                  </div>
                  <div style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:20, padding:'3px 10px', color:accent, fontSize:11, fontWeight:800, flexShrink:0 }}>
                    {circleData[circle.id].length}/{circle.max}
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, minHeight:32, marginBottom:12 }}>
                  {circleData[circle.id].map((name,i) => (
                    <span key={i} style={{ background:'rgba(255,255,255,0.07)', borderRadius:20, padding:'4px 10px', color:'rgba(255,255,255,0.8)', fontSize:12, fontWeight:700 }}>
                      {name}
                      <button onClick={() => setCircleData(d => ({...d,[circle.id]:d[circle.id].filter((_,j)=>j!==i)}))}
                        style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', marginLeft:4, fontSize:10, padding:0 }}>✕</button>
                    </span>
                  ))}
                </div>
                {circleData[circle.id].length < circle.max && (
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={newName[circle.id]} onChange={e => setNewName(n=>({...n,[circle.id]:e.target.value}))}
                      onKeyDown={e => e.key==='Enter' && addPerson(circle.id)}
                      placeholder="Add name..."
                      style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
                    <button onClick={() => addPerson(circle.id)}
                      style={{ background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:8, padding:'0 12px', color:accent, fontSize:16, cursor:'pointer', fontWeight:800 }}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {Object.values(circleData).some(arr => arr.length > 0) && (
            <div style={{ marginTop:16, padding:'14px 18px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14 }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, marginBottom:8 }}>REFLECTION</div>
              <div style={{ color:'rgba(255,255,255,0.65)', fontSize:13, lineHeight:1.8 }}>
                Look at your inner circle. When did you last speak to each person — really speak, not just text?<br/>
                Look at your close circle. Who has drifted that you wish hadn't?<br/>
                Now ask: what kind of friend, child, sibling, or colleague are <em>you</em> being?
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'love' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>
            Gary Chapman's 5 Love Languages explain why people often love each other genuinely but still feel unloved. Knowing yours — and the people close to you — changes everything.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {LOVE_LANGS.map(l => (
              <div key={l.id} onClick={() => setLoveLang(loveLang===l.id ? null : l.id)}
                style={{ padding:'16px 18px', background: loveLang===l.id ? accentDim : 'rgba(255,255,255,0.03)', border:`1.5px solid ${loveLang===l.id ? accent : 'rgba(255,255,255,0.08)'}`, borderRadius:14, cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontSize:24 }}>{l.icon}</span>
                  <div>
                    <div style={{ color: loveLang===l.id ? accent : 'white', fontSize:14, fontWeight:800 }}>{l.label}</div>
                    {loveLang===l.id && <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:6, lineHeight:1.6 }}>{l.desc}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {loveLang && (
            <div style={{ marginTop:16, padding:'16px 18px', background:accentDim, border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:12, fontWeight:800, marginBottom:8 }}>YOUR NEXT STEP</div>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.8 }}>
                Now ask the 3 people closest to you what <em>their</em> love language is. You may have been showing love the way <em>you</em> want to receive it — not the way they actually feel it.
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'coach' && (
        <div style={{ height:440, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="relationships" accent={accent} accentDim={accentDim} accentBorder={accentBorder} />
        </div>
      )}
    </div>
  );
}

// ── Daily Check-in ─────────────────────────────────────────────────────────
function DailyCheckin({ moduleId, accent, accentDim, accentBorder }) {
  const key = `lifeskills_checkin_${moduleId}_${new Date().toDateString()}`;
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });

  const toggle = id => {
    const next = checked.includes(id) ? checked.filter(x=>x!==id) : [...checked, id];
    setChecked(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const habits = HABITS[moduleId];
  const pct = Math.round((checked.length / habits.length) * 100);

  return (
    <div style={{ padding:20, background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ color:accent, fontSize:13, fontWeight:800 }}>Today's Practice</div>
        <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700 }}>{checked.length}/{habits.length} done</div>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:4, marginBottom:16, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:accent, borderRadius:4, transition:'width 0.5s' }} />
      </div>
      {habits.map(h => (
        <div key={h.id} onClick={() => toggle(h.id)}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer' }}>
          <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${checked.includes(h.id) ? accent : 'rgba(255,255,255,0.2)'}`, background: checked.includes(h.id) ? accentDim : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
            {checked.includes(h.id) && <span style={{ color:accent, fontSize:13, fontWeight:900 }}>✓</span>}
          </div>
          <span style={{ color: checked.includes(h.id) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.5, textDecoration: checked.includes(h.id) ? 'line-through' : 'none', transition:'all 0.2s' }}>
            {h.text}
          </span>
        </div>
      ))}
      {pct === 100 && (
        <div style={{ marginTop:14, textAlign:'center', color:accent, fontSize:14, fontWeight:800 }}>
          🌟 You showed up fully today. That's how change happens.
        </div>
      )}
    </div>
  );
}

// ── Quote of the Day ───────────────────────────────────────────────────────
function QuoteCard({ moduleId, accent, accentDim, accentBorder }) {
  const quotes = QUOTES[moduleId];
  const [idx] = useState(() => Math.floor(Date.now() / 86400000) % quotes.length);
  const q = quotes[idx];
  return (
    <div style={{ padding:20, background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Today's Wisdom</div>
      <div style={{ color:'white', fontSize:15, lineHeight:1.8, fontStyle:'italic', marginBottom:10 }}>"{q.text}"</div>
      <div style={{ color:accent, fontSize:12, fontWeight:800 }}>— {q.by}</div>
    </div>
  );
}

// ── Reflection Journal ─────────────────────────────────────────────────────
function ReflectionJournal({ moduleId, accent, accentDim, accentBorder }) {
  const prompts = REFLECTIONS[moduleId];
  const [idx, setIdx] = useState(0);
  const key = `lifeskills_journal_${moduleId}_${idx}`;
  const [text, setText] = useState(() => localStorage.getItem(key) || '');
  const save = (val) => { setText(val); localStorage.setItem(key, val); };

  return (
    <div style={{ padding:20, background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ color:accent, fontSize:13, fontWeight:800 }}>Reflection</div>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => { setIdx(i => (i-1+prompts.length)%prompts.length); setText(localStorage.getItem(`lifeskills_journal_${moduleId}_${(idx-1+prompts.length)%prompts.length}`) || ''); }}
            style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>←</button>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11, fontWeight:700, alignSelf:'center' }}>{idx+1}/{prompts.length}</span>
          <button onClick={() => { setIdx(i => (i+1)%prompts.length); setText(localStorage.getItem(`lifeskills_journal_${moduleId}_${(idx+1)%prompts.length}`) || ''); }}
            style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:'4px 10px', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:13 }}>→</button>
        </div>
      </div>
      <div style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.7, marginBottom:14, fontStyle:'italic' }}>{prompts[idx]}</div>
      <textarea value={text} onChange={e => save(e.target.value)}
        placeholder="Write your thoughts here. Nobody else will see this."
        rows={5}
        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'12px 14px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', lineHeight:1.7 }} />
      {text && <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11, marginTop:6, textAlign:'right' }}>Auto-saved ✓</div>}
    </div>
  );
}

// ── User Profile Setup ────────────────────────────────────────────────────
function UserProfileSetup({ profile, onChange, accent, accentDim, accentBorder }) {
  const [open, setOpen] = useState(!profile.gender);
  const set = (k, v) => onChange({ ...profile, [k]: v });

  return (
    <div style={{ background:'rgba(255,255,255,0.02)', border:`1.5px solid ${accentBorder}`, borderRadius:16, overflow:'hidden' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'14px 18px', background:'none', border:'none', color:'white', fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span>👤 Your Profile <span style={{ color:'rgba(255,255,255,0.35)', fontWeight:400, fontSize:12 }}>— helps the AI give personalised advice</span></span>
        <span style={{ color:accent, fontSize:12 }}>{open ? '▲ Close' : '▼ Edit'}</span>
      </button>
      {open && (
        <div style={{ padding:'0 18px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
          {[
            { key:'gender', label:'Gender', options:['Male','Female','Non-binary','Prefer not to say'] },
            { key:'age',    label:'Age group', options:['Under 18','18–25','26–35','36–45','46–60','60+'] },
            { key:'income', label:'Monthly income', options:['Under ₹15k','₹15k–30k','₹30k–60k','₹60k–1L','₹1L–2L','₹2L+'] },
            { key:'city',   label:'Location type', options:['Metro city','Tier-2 city','Small town','Rural area'] },
          ].map(f => (
            <div key={f.key}>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.6px' }}>{f.label}</div>
              <select value={profile[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:9, padding:'9px 12px', color:profile[f.key] ? 'white' : 'rgba(255,255,255,0.3)', fontSize:13, fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                <option value="">Select...</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{ gridColumn:'1 / -1' }}>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.6px' }}>Your main goal (optional)</div>
            <input value={profile.goals || ''} onChange={e => set('goals', e.target.value)}
              placeholder="e.g. Lose 10kg, dress better for interviews, build a morning routine..."
              style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:9, padding:'9px 12px', color:'white', fontSize:13, fontFamily:'inherit', outline:'none' }} />
          </div>
          {profile.gender && <div style={{ gridColumn:'1 / -1', color:accent, fontSize:12, fontWeight:700 }}>✓ Profile saved — the AI will now personalise all advice to you</div>}
        </div>
      )}
    </div>
  );
}

// ── Fitness Module ─────────────────────────────────────────────────────────
function FitnessModule({ accent, accentDim, accentBorder, userProfile }) {
  const [tab, setTab] = useState('coach');
  const [bmi, setBmi] = useState({ weight:'', height:'' });

  const bmiVal = bmi.weight && bmi.height ? (parseFloat(bmi.weight) / Math.pow(parseFloat(bmi.height)/100, 2)).toFixed(1) : null;
  const bmiCategory = bmiVal ? bmiVal < 18.5 ? {label:'Underweight', color:'#4cc9f0'} : bmiVal < 25 ? {label:'Healthy', color:'#52b788'} : bmiVal < 30 ? {label:'Overweight', color:'#f4a261'} : {label:'Obese', color:'#e74c3c'} : null;

  const pillars = [
    { icon:'🏃', title:'Movement', points:['150 min/week moderate cardio (walk, cycle, swim)', 'Strength training 2–3x/week', '7,000–10,000 steps daily', 'Take the stairs. Park further away.'] },
    { icon:'🥗', title:'Nutrition', points:['Eat 1.6–2g protein per kg of bodyweight daily', 'Fill half your plate with vegetables', 'Limit ultra-processed food and liquid calories', 'Eat slowly. Stop at 80% full (Hara Hachi Bu).'] },
    { icon:'😴', title:'Sleep', points:['7–9 hours for adults. Non-negotiable.', 'Same sleep/wake time every day — even weekends', 'No screens 30 mins before bed', 'Cool, dark, quiet room (18–20°C ideal)'] },
    { icon:'🧘', title:'Recovery', points:['Stretch or do yoga 2–3x/week', 'One full rest day per week', 'Manage stress — cortisol destroys fitness gains', 'Hydrate: 35ml × bodyweight (kg) = daily ml target'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['pillars','🏛️ Four Pillars'],['bmi','⚖️ BMI Check']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="fitness" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} />
        </div>
      )}

      {tab === 'pillars' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {pillars.map(p => (
            <div key={p.title} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{p.icon}</div>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:10 }}>{p.title}</div>
              {p.points.map((pt,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ color:accent, fontSize:11, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.6 }}>{pt}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'bmi' && (
        <div style={{ maxWidth:400 }}>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:13, marginBottom:16, lineHeight:1.7 }}>BMI is a basic screening tool — not a complete measure of health. Use it as one data point, not a verdict.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[['weight','Weight (kg)','e.g. 68'],['height','Height (cm)','e.g. 170']].map(([k,l,p]) => (
              <div key={k}>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>{l}</div>
                <input value={bmi[k]} onChange={e => setBmi(b => ({...b,[k]:e.target.value}))} type="number" placeholder={p}
                  style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:10, padding:'10px 14px', color:'white', fontSize:16, fontFamily:'inherit', outline:'none' }} />
              </div>
            ))}
          </div>
          {bmiVal && bmiCategory && (
            <div style={{ padding:'20px', background:accentDim, border:`1.5px solid ${accentBorder}`, borderRadius:16, textAlign:'center' }}>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, marginBottom:6 }}>YOUR BMI</div>
              <div style={{ fontSize:48, fontWeight:900, color:bmiCategory.color, marginBottom:8 }}>{bmiVal}</div>
              <div style={{ color:bmiCategory.color, fontSize:16, fontWeight:800, marginBottom:12 }}>{bmiCategory.label}</div>
              <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:14 }}>
                {[['<18.5','Underweight','#4cc9f0'],['18.5–24.9','Healthy','#52b788'],['25–29.9','Overweight','#f4a261'],['30+','Obese','#e74c3c']].map(([range, cat, col]) => (
                  <div key={cat} style={{ padding:'4px 8px', borderRadius:8, background:cat===bmiCategory.label?col+'30':'rgba(255,255,255,0.04)', border:`1px solid ${cat===bmiCategory.label?col:'rgba(255,255,255,0.08)'}`, color:cat===bmiCategory.label?col:'rgba(255,255,255,0.3)', fontSize:10, fontWeight:700, textAlign:'center' }}>
                    <div>{range}</div><div>{cat}</div>
                  </div>
                ))}
              </div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.6 }}>Ask your AI coach for a personalised plan based on this result.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Grooming Module ────────────────────────────────────────────────────────
function GroomingModule({ accent, accentDim, accentBorder, userProfile }) {
  const [tab, setTab] = useState('coach');
  const gender = userProfile?.gender?.toLowerCase() || '';
  const isMale = gender.includes('male') && !gender.includes('fe');

  const skinRoutine = isMale ? [
    { step:'AM Step 1', name:'Face Wash', desc:'Use a gentle face wash. Avoid bar soap on face — it strips natural oils.' },
    { step:'AM Step 2', name:'Moisturiser + SPF', desc:'Non-negotiable. SPF 30+ every single morning, even indoors. Choose SPF 50 in Indian summer.' },
    { step:'PM Step 1', name:'Face Wash', desc:'Wash off pollution, sweat, and sunscreen from the day.' },
    { step:'PM Step 2', name:'Moisturiser', desc:'Night cream or a simple moisturiser. Helps skin repair overnight.' },
    { step:'Weekly', name:'Exfoliate', desc:'Once a week. Removes dead skin. Prevents ingrown hairs. Makes shaving easier.' },
  ] : [
    { step:'AM Step 1', name:'Face Wash', desc:'Gentle, sulphate-free cleanser for your skin type.' },
    { step:'AM Step 2', name:'Vitamin C Serum', desc:'Brightens, reduces dark spots. Apply before moisturiser.' },
    { step:'AM Step 3', name:'Moisturiser + SPF 50', desc:'Essential in Indian climate. Reapply every 2 hours in sun.' },
    { step:'PM Step 1', name:'Double Cleanse', desc:'Oil cleanser first, then face wash — removes sunscreen and makeup fully.' },
    { step:'PM Step 2', name:'Retinol / Niacinamide', desc:'Anti-aging, brightening. Start slow — 2x/week, then build up.' },
    { step:'PM Step 3', name:'Night Moisturiser', desc:'Heavier than day cream. Repairs while you sleep.' },
  ];

  const groomingChecklist = [
    { category:'Hair', items: isMale ? ['Wash 2–3x/week (not daily — strips oil)','Use a comb or brush after shower','Get a haircut every 3–4 weeks','Trim neck and ears between cuts'] : ['Trim split ends every 6–8 weeks','Deep condition weekly','Protect hair from heat tools','Oil hair 1–2x/week (coconut or argan)'] },
    { category:'Body', items:['Shower daily — twice in summer','Deodorant every morning (not just perfume)','Trim nails weekly','Moisturise body after shower — especially elbows, knees, heels'] },
    { category:'Oral', items:['Brush 2 minutes — morning and night','Floss daily (most people skip this — don\'t)','Use mouthwash after flossing','Dental check-up every 6 months'] },
    { category:'Clothing', items:['Iron or steam clothes before wearing','Clothes should fit your actual body — not your aspirational body','Clean shoes matter enormously — people notice','Dress one level up from the occasion'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['skin','🧴 Skincare Routine'],['checklist','✅ Full Checklist']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="grooming" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} />
        </div>
      )}

      {tab === 'skin' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:14, lineHeight:1.6 }}>
            {userProfile?.gender ? `Routine for: ${userProfile.gender}` : 'Set your profile above for personalised recommendations.'} Indian climate means SPF and hydration are non-negotiable year-round.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {skinRoutine.map((s,i) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:13 }}>
                <div style={{ minWidth:80, color:accent, fontSize:11, fontWeight:800, paddingTop:2 }}>{s.step}</div>
                <div>
                  <div style={{ color:'white', fontSize:14, fontWeight:800, marginBottom:4 }}>{s.name}</div>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, lineHeight:1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'checklist' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {groomingChecklist.map(cat => (
            <div key={cat.category} style={{ padding:'16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:14 }}>
              <div style={{ color:accent, fontSize:13, fontWeight:800, marginBottom:12 }}>{cat.category}</div>
              {cat.items.map((item,i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <span style={{ color:accent, fontSize:11, marginTop:3, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Lifestyle Module ───────────────────────────────────────────────────────
function LifestyleModule({ accent, accentDim, accentBorder, userProfile }) {
  const [tab, setTab] = useState('coach');
  const [wakeTime, setWakeTime] = useState('06:00');

  const getMorningRoutine = () => {
    const [h, m] = wakeTime.split(':').map(Number);
    const add = (mins) => {
      const total = h * 60 + m + mins;
      return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
    };
    return [
      { time: wakeTime,   dur:0,  act:'Wake up', note:'No phone for first 30 minutes. This is the most important rule.' },
      { time: add(5),     dur:5,  act:'Hydrate', note:'1 large glass of water before anything else.' },
      { time: add(10),    dur:20, act:'Move',    note:'Walk, stretch, yoga, or workout. Even 20 minutes changes everything.' },
      { time: add(30),    dur:15, act:'Freshen up', note:'Shower, groom, get dressed. How you dress affects how you think.' },
      { time: add(45),    dur:20, act:'Nourish',  note:'Eat something real. Not a biscuit. Protein + complex carbs.' },
      { time: add(65),    dur:20, act:'Mind',     note:'Read, journal, plan your day, meditate. Before the world asks things of you.' },
      { time: add(85),    dur:0,  act:'Begin work', note:"You've already won the morning. The rest follows." },
    ];
  };

  const lifePillars = [
    { icon:'⏰', title:'Routines', desc:'Morning and evening routines are the architecture of a good life. Design them deliberately.', tips:['Same wake time every day — even weekends','No phone first 30 mins after waking or before bed','Plan tomorrow the night before'] },
    { icon:'📵', title:'Digital Wellness', desc:'Your phone is the most addictive device ever created. You need rules or it runs your life.', tips:['Set app limits on social media','No phone at the dining table','Grayscale mode after 9pm','Delete apps you check compulsively but don\'t value'] },
    { icon:'🎯', title:'Deep Work', desc:'2–4 hours of focused work > 8 hours of distracted work.', tips:['Time block your calendar','Work in 90-minute sessions with breaks','One priority task first thing — before email','Notifications off during focus time'] },
    { icon:'🌱', title:'Learning & Growth', desc:'Read. Listen. Study. The people who stop learning stop growing.', tips:['20 pages or 20 minutes of reading daily','Podcasts during commutes and walks','One new skill per quarter','Learn something outside your field'] },
    { icon:'💆', title:'Mental Health', desc:'Your mind is a muscle. It needs rest, exercise, and care.', tips:['Notice when you are burnt out — before it breaks you','Therapy is strength, not weakness','Journaling clears mental clutter','Protect solitude and silence'] },
    { icon:'🏡', title:'Environment', desc:'Your environment shapes your behaviour more than your willpower does.', tips:['Clean, organised spaces reduce stress and increase focus','Keep healthy food at eye level','Put your phone in a drawer when working','Your space reflects your mental state — and vice versa'] },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['morning','🌅 Morning Routine'],['pillars','🏛️ Life Pillars']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="lifestyle" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} />
        </div>
      )}

      {tab === 'morning' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>Your wake time:</div>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
              style={{ background:'rgba(255,255,255,0.07)', border:`1px solid ${accentBorder}`, borderRadius:9, padding:'8px 12px', color:'white', fontSize:14, fontFamily:'inherit', outline:'none' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            {getMorningRoutine().map((r, i, arr) => (
              <div key={i} style={{ display:'flex', gap:14 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:40 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background:accent, flexShrink:0, marginTop:16 }} />
                  {i < arr.length-1 && <div style={{ width:2, flex:1, background:`linear-gradient(${accent}60,${accent}20)`, minHeight:20 }} />}
                </div>
                <div style={{ padding:'12px 0 16px', flex:1 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:4 }}>
                    <span style={{ color:accent, fontSize:11, fontWeight:800 }}>{r.time}</span>
                    <span style={{ color:'white', fontSize:14, fontWeight:800 }}>{r.act}</span>
                    {r.dur > 0 && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>{r.dur} min</span>}
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6 }}>{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pillars' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
          {lifePillars.map(p => (
            <div key={p.title} style={{ padding:'18px', background:'rgba(255,255,255,0.03)', border:`1px solid ${accentBorder}`, borderRadius:16 }}>
              <div style={{ fontSize:26, marginBottom:8 }}>{p.icon}</div>
              <div style={{ color:accent, fontSize:14, fontWeight:800, marginBottom:6 }}>{p.title}</div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.6, marginBottom:12 }}>{p.desc}</div>
              {p.tips.map((t,i) => (
                <div key={i} style={{ display:'flex', gap:7, marginBottom:6 }}>
                  <span style={{ color:accent, fontSize:10, marginTop:4, flexShrink:0 }}>▸</span>
                  <span style={{ color:'rgba(255,255,255,0.7)', fontSize:12, lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Etiquette Module ───────────────────────────────────────────────────────
function EtiquetteModule({ accent, accentDim, accentBorder, userProfile }) {
  const [tab, setTab]     = useState('coach');
  const [scenario, setScenario] = useState(0);

  const etiquetteSections = [
    {
      icon:'🍽️', title:'Dining Etiquette',
      rules:[
        'Wait for everyone to be served before eating — or for the host to invite you to start.',
        'Napkin on your lap the moment you sit. Use it to dab, not wipe.',
        'Chew with your mouth closed. Always. No exceptions.',
        'Elbows off the table while eating. Fine between courses.',
        'Pass food to the right. Never reach across someone.',
        'Phone face-down or away. The person across from you is more important.',
        'When in doubt about cutlery: start from the outside, work inward.',
        'Ask for the bill quietly — never snap fingers or shout.',
        'Compliment the food. Criticise it only if asked, and gently.',
        'Offer to split or pay for the person who invited you.',
      ],
    },
    {
      icon:'💼', title:'Professional Etiquette',
      rules:[
        'Be on time. Being late says "my time matters more than yours."',
        'Firm handshake — 2–3 pumps. Eye contact. Smile.',
        'Remember names. Repeat them back when introduced.',
        'Never interrupt. Wait for a natural pause, then speak.',
        'In meetings: listen more than you talk. Ask good questions.',
        'Reply to emails within 24 hours, even if just to acknowledge.',
        'CC and BCC wisely — not everyone needs to be copied on everything.',
        'Dress one level above the dress code of the occasion.',
        'Thank people — specifically, not generically.',
        'Never badmouth colleagues or your previous employer.',
      ],
    },
    {
      icon:'📱', title:'Digital Etiquette',
      rules:[
        'WhatsApp voice notes: fine for friends, not for professional contacts.',
        'Do not forward unverified news. Ever.',
        'Reply to messages in reasonable time — leaving someone on read is rude.',
        'Do not call without texting first to check if it is a good time.',
        'Your profile photo on professional apps should be professional.',
        'Use punctuation in professional messages. "ok" and "OK." are different things.',
        'Do not add people to groups without asking.',
        'Avoid ALL CAPS — it reads as shouting.',
        'Read before you reply. Do not ask questions that are answered in the message.',
        'LinkedIn is not Instagram. Keep it professional.',
      ],
    },
    {
      icon:'🤝', title:'Social Etiquette',
      rules:[
        'Arrive within 15 minutes of the stated time. Do not arrive early.',
        'Bring something when invited to someone\'s home — mithai, wine, flowers.',
        'Compliment the host on the food and the space.',
        'Do not overstay. Read the room. When energy drops, leave.',
        'Introduce people to each other — never leave someone standing alone.',
        'Ask questions. Be genuinely interested in the people you meet.',
        'Do not dominate the conversation — aim to give, not take.',
        'If you RSVP yes, show up. If you cannot, give as much notice as possible.',
        'Thank the host — in person, and again the next day by message.',
        'Put your phone away. Presence is the greatest gift.',
      ],
    },
    {
      icon:'🗣️', title:'Conversation Skills',
      rules:[
        'Ask open-ended questions — "Tell me about..." beats "Did you...?"',
        'The best conversationalist makes the other person feel interesting — not themselves.',
        'Maintain eye contact 50–60% of the time. More feels aggressive, less feels shifty.',
        'Mirror body language subtly — it builds subconscious rapport.',
        'Avoid the three forbidden topics at mixed company: religion, politics, money.',
        'Never offer unsolicited advice. Wait to be asked.',
        'Disagree with respect: "I see it differently..." not "You\'re wrong."',
        'Silence is okay. You do not need to fill every gap.',
        'Name-drop sparingly. It signals insecurity.',
        'End conversations gracefully: "I have really enjoyed talking with you."',
      ],
    },
  ];

  const scenarios = [
    { title:'The Late Colleague', q:'Your colleague is 20 minutes late to a client meeting and does not acknowledge it. You cover for them. Later they take partial credit for the client winning over. What do you do?', options:['Say nothing — keep the peace','Address it privately and directly','Mention your contribution to your manager','Let it go this time, but set clear expectations going forward'] },
    { title:'The Uncomfortable Guest', q:'At a dinner party, a guest starts telling a clearly racist joke. Everyone goes quiet. What do you do?', options:['Laugh along so it is not awkward','Stay silent but look away','Say "I don\'t find that funny" calmly and change the subject','Walk away without a word'] },
    { title:'The Phone at Dinner', q:'You are having dinner with family. Your boss is texting you about a non-urgent work matter. Do you respond?', options:['Yes — it is the boss, you have to','Tell the boss you\'re unavailable and respond later','Excuse yourself and respond quickly','Respond under the table discreetly'] },
    { title:'The Introduction', q:'You are at a networking event and run into your CEO with an important client. You are not sure if they remember your name. What do you do?', options:['Wait for them to introduce you','Introduce yourself clearly and confidently','Stay quiet and hope they introduce you','Whisper your name to someone nearby first'] },
  ];

  const sc = scenarios[scenario % scenarios.length];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['coach','🤖 AI Coach'],['guide','📚 Etiquette Guide'],['scenarios','🎭 Scenarios']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding:'8px 16px', borderRadius:20, border:`1px solid ${tab===id ? accent : 'rgba(255,255,255,0.1)'}`, background:tab===id ? accentDim : 'transparent', color:tab===id ? accent : 'rgba(255,255,255,0.5)', fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', minHeight:36 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'coach' && (
        <div style={{ height:460, display:'flex', flexDirection:'column' }}>
          <AICoach moduleId="etiquette" accent={accent} accentDim={accentDim} accentBorder={accentBorder} userProfile={userProfile} />
        </div>
      )}

      {tab === 'guide' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {etiquetteSections.map(s => (
            <details key={s.title} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${accentBorder}`, borderRadius:14, overflow:'hidden' }}>
              <summary style={{ padding:'16px 18px', cursor:'pointer', color:'white', fontSize:14, fontWeight:800, display:'flex', alignItems:'center', gap:10, listStyle:'none' }}>
                <span>{s.icon}</span><span>{s.title}</span><span style={{ marginLeft:'auto', color:accent, fontSize:11, fontWeight:700 }}>▼</span>
              </summary>
              <div style={{ padding:'0 18px 16px' }}>
                {s.rules.map((r,i) => (
                  <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color:accent, fontWeight:800, fontSize:12, flexShrink:0, marginTop:2 }}>{i+1}.</span>
                    <span style={{ color:'rgba(255,255,255,0.75)', fontSize:13, lineHeight:1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {tab === 'scenarios' && (
        <div>
          <div style={{ padding:20, background:'rgba(255,255,255,0.03)', border:`1.5px solid ${accentBorder}`, borderRadius:16, marginBottom:14 }}>
            <div style={{ color:accent, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Scenario {(scenario%scenarios.length)+1} of {scenarios.length}</div>
            <div style={{ color:'white', fontSize:15, fontWeight:800, marginBottom:12 }}>{sc.title}</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.8 }}>{sc.q}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
            {sc.options.map((opt,i) => (
              <div key={i} style={{ padding:'13px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, color:'rgba(255,255,255,0.7)', fontSize:13, lineHeight:1.5 }}>
                <span style={{ color:accent, fontWeight:800, marginRight:8 }}>{String.fromCharCode(65+i)}.</span>{opt}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setScenario(s => s+1)}
              style={{ flex:1, padding:'12px', borderRadius:12, border:`1px solid ${accentBorder}`, background:accentDim, color:accent, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer' }}>
              Next Scenario →
            </button>
          </div>
          <div style={{ marginTop:12, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:12, color:'rgba(255,255,255,0.45)', fontSize:12, lineHeight:1.7 }}>
            Discuss your choice with the AI Coach for a deeper breakdown of what the most gracious response would be and why.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function LifeSkillsPage() {
  const [activeModule, setActive] = useState('finance');
  const [userProfile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lifeskills_profile') || '{}'); } catch { return {}; }
  });
  const mod = MODULES[activeModule];

  const saveProfile = (p) => {
    setProfile(p);
    localStorage.setItem('lifeskills_profile', JSON.stringify(p));
  };

  return (
    <div style={{ padding:'16px', maxWidth:900, margin:'0 auto', fontFamily:"'Nunito',sans-serif", minHeight:'100vh' }}>
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ls-card{animation:fadein 0.35s ease forwards}
        textarea::placeholder,input::placeholder{color:rgba(255,255,255,0.25)!important}
        details summary::-webkit-details-marker{display:none}
      `}</style>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontSize:28 }}>🧭</span>
          <div>
            <div style={{ color:'white', fontSize:22, fontWeight:900, lineHeight:1.1 }}>Life Skills</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:12 }}>Become a better version of yourself — one day at a time</div>
          </div>
        </div>
      </div>

      {/* Module tabs — 7 modules in a responsive grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8, marginBottom:20 }}>
        {Object.values(MODULES).map(m => (
          <button key={m.id} onClick={() => setActive(m.id)}
            style={{ padding:'12px 8px', borderRadius:14, border:`1.5px solid ${activeModule===m.id ? m.accent : 'rgba(255,255,255,0.07)'}`, background:activeModule===m.id ? m.accentDim : 'rgba(255,255,255,0.02)', color:activeModule===m.id ? m.accent : 'rgba(255,255,255,0.45)', fontFamily:'inherit', fontSize:11, fontWeight:800, cursor:'pointer', textAlign:'center', transition:'all 0.2s', lineHeight:1.4 }}>
            <div style={{ fontSize:20, marginBottom:4 }}>{m.icon}</div>
            <div>{m.label}</div>
          </button>
        ))}
      </div>

      {/* Tagline */}
      <div style={{ marginBottom:16, padding:'11px 16px', background:mod.accentDim, border:`1px solid ${mod.accentBorder}`, borderRadius:12, color:mod.accent, fontSize:13, fontStyle:'italic', fontWeight:700 }}>
        "{mod.tagline}"
      </div>

      {/* Main content */}
      <div className="ls-card" key={activeModule} style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* User profile — shown for context-dependent modules */}
        {['fitness','grooming','lifestyle','etiquette'].includes(activeModule) && (
          <UserProfileSetup profile={userProfile} onChange={saveProfile} accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />
        )}

        {/* Quote */}
        <QuoteCard moduleId={activeModule} accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />

        {/* Module-specific content */}
        {activeModule === 'finance'       && <FinanceModule       accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />}
        {activeModule === 'ethics'        && <EthicsModule        accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />}
        {activeModule === 'relationships' && <RelationshipsModule accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />}
        {activeModule === 'fitness'       && <FitnessModule       accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} userProfile={userProfile} />}
        {activeModule === 'grooming'      && <GroomingModule      accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} userProfile={userProfile} />}
        {activeModule === 'lifestyle'     && <LifestyleModule     accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} userProfile={userProfile} />}
        {activeModule === 'etiquette'     && <EtiquetteModule     accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} userProfile={userProfile} />}

        {/* Daily check-in */}
        <DailyCheckin moduleId={activeModule} accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />

        {/* Reflection journal */}
        <ReflectionJournal moduleId={activeModule} accent={mod.accent} accentDim={mod.accentDim} accentBorder={mod.accentBorder} />
      </div>
    </div>
  );
}
