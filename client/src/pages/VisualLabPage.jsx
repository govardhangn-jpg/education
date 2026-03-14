import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────
   VISUAL LAB  —  SamarthaaEdu
   12 interactive 3D / animated science modules
   Pure CSS 3D + Canvas + SVG — zero extra dependencies
───────────────────────────────────────────────────────────────── */

const SUBJECTS = [
  { id:'anatomy',   icon:'🫀', label:'Anatomy',    color:'#e74c3c', bg:'rgba(231,76,60,0.12)',  desc:'3D organs & cell biology' },
  { id:'chemistry', icon:'⚗️',  label:'Chemistry',  color:'#3498db', bg:'rgba(52,152,219,0.12)', desc:'Molecules & reactions' },
  { id:'physics',   icon:'⚡',  label:'Physics',    color:'#f39c12', bg:'rgba(243,156,18,0.12)', desc:'Motion & wave simulations' },
  { id:'math',      icon:'📐',  label:'Mathematics',color:'#9b59b6', bg:'rgba(155,89,182,0.12)', desc:'3D geometry & functions' },
];

const MODULES = {
  anatomy: [
    { id:'heart',   title:'Human Heart',      icon:'🫀', desc:'Cross-section with chambers & valves' },
    { id:'cell',    title:'Cell Structure',   icon:'🔬', desc:'Organelles — hover to identify' },
    { id:'neuron',  title:'Neuron & Synapse', icon:'🧠', desc:'Action potential signal animation' },
  ],
  chemistry: [
    { id:'molecule', title:'Molecule Explorer', icon:'⚗️',  desc:'3D rotate bonded atoms' },
    { id:'periodic', title:'Element Cards',     icon:'🧪', desc:'Electron config flip cards' },
    { id:'reaction', title:'Reaction Flow',     icon:'🔥', desc:'Arrow-pushing mechanism' },
  ],
  physics: [
    { id:'projectile', title:'Projectile Motion', icon:'🎯', desc:'Adjust angle & velocity' },
    { id:'wave',       title:'Wave Interference', icon:'〰️', desc:'Superposition live canvas' },
    { id:'pendulum',   title:'Pendulum / SHM',    icon:'⏱️', desc:'Simple harmonic motion' },
  ],
  math: [
    { id:'geometry3d', title:'3D Geometry',       icon:'📦', desc:'Rotate cube / sphere / cone' },
    { id:'grapher',    title:'Function Grapher',  icon:'📈', desc:'Plot any y = f(x)' },
    { id:'trigcircle', title:'Unit Circle',       icon:'📐', desc:'Sin / cos visualised live' },
  ],
};

// ── STYLES ──────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  .vlab-wrap { font-family:'Space Grotesk',sans-serif; }
  .vlab-card { transition:all 0.25s cubic-bezier(.4,0,.2,1); }
  .vlab-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.4); }
  .vlab-mod-btn { transition:all 0.2s; }
  .vlab-mod-btn:hover { transform:scale(1.03); }
  .vlab-mod-btn:active { transform:scale(0.98); }
  @keyframes vlab-pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
  @keyframes vlab-spin  { to{transform:rotateY(360deg)} }
  @keyframes vlab-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
  @keyframes vlab-signal { 0%{left:-30%}100%{left:130%} }
  @keyframes vlab-fadein { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} }
  .vlab-fadein { animation:vlab-fadein 0.35s ease forwards; }
`;

// ══════════════════════════════════════════════════════════════════════════
//  MODULE COMPONENTS
// ══════════════════════════════════════════════════════════════════════════

// ── HEART ─────────────────────────────────────────────────────────────────
function HeartModule() {
  const [exploded, setExploded] = useState(false);
  const [rotY, setRotY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const chambers = [
    { id:'ra', label:'Right Atrium',    x:55, y:28, w:30, h:24, color:'#3498db', info:'Receives deoxygenated blood from body via vena cava' },
    { id:'rv', label:'Right Ventricle', x:55, y:57, w:30, h:30, color:'#2980b9', info:'Pumps blood to lungs via pulmonary artery' },
    { id:'la', label:'Left Atrium',     x:15, y:28, w:30, h:24, color:'#e74c3c', info:'Receives oxygenated blood from lungs via pulmonary veins' },
    { id:'lv', label:'Left Ventricle',  x:15, y:57, w:30, h:30, color:'#c0392b', info:'Pumps oxygenated blood to body via aorta' },
  ];
  const [active, setActive] = useState(null);
  const activeCh = chambers.find(c=>c.id===active);

  const onMouseDown = e => { setDragging(true); lastX.current=e.clientX; };
  const onMouseMove = e => { if(!dragging)return; setRotY(r=>r+(e.clientX-lastX.current)*0.5); lastX.current=e.clientX; };
  const onMouseUp   = () => setDragging(false);

  return (
    <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div style={{flex:'0 0 400px'}}>
        <div style={{display:'flex',gap:10,marginBottom:12}}>
          <button onClick={()=>setExploded(e=>!e)}
            style={{flex:1,padding:'9px',borderRadius:10,border:'1.5px solid rgba(231,76,60,0.4)',background:exploded?'rgba(231,76,60,0.2)':'rgba(255,255,255,0.04)',color:exploded?'#e74c3c':'rgba(255,255,255,0.7)',fontFamily:'Space Grotesk',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {exploded?'🫀 Collapse':'💥 Explode View'}
          </button>
          <button onClick={()=>setActive(null)}
            style={{padding:'9px 14px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.5)',fontFamily:'Space Grotesk',fontSize:12,cursor:'pointer'}}>
            Reset
          </button>
        </div>
        {/* 3D rotating heart diagram */}
        <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{cursor:'grab',userSelect:'none',perspective:600,width:'100%',height:320,position:'relative'}}>
          <div style={{width:'100%',height:'100%',transformStyle:'preserve-3d',transform:`rotateY(${rotY}deg)`,transition:dragging?'none':'transform 0.1s'}}>
            {/* Heart outline SVG */}
            <svg viewBox="0 0 100 100" style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
              <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {/* Outer heart shape */}
              <path d="M50,85 C50,85 10,60 10,35 C10,20 20,12 30,12 C38,12 45,17 50,25 C55,17 62,12 70,12 C80,12 90,20 90,35 C90,60 50,85 50,85 Z"
                fill="rgba(231,76,60,0.08)" stroke="rgba(231,76,60,0.4)" strokeWidth="0.8" filter="url(#glow)"/>
              {/* Septum line */}
              <line x1="50" y1="15" x2="50" y2="88" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2,2"/>
              <line x1="15" y1="55" x2="85" y2="55" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" strokeDasharray="2,2"/>
              {chambers.map(c=>(
                <g key={c.id} onClick={()=>setActive(a=>a===c.id?null:c.id)} style={{cursor:'pointer'}}>
                  <rect x={c.x + (exploded?(c.x<40?-8:8):0)} y={c.y + (exploded?(c.y<50?-6:6):0)}
                    width={c.w} height={c.h} rx="4"
                    fill={active===c.id?c.color:c.color+'55'} stroke={c.color}
                    strokeWidth={active===c.id?1.5:0.8}
                    style={{transition:'all 0.4s',filter:active===c.id?`drop-shadow(0 0 4px ${c.color})`:'none'}}/>
                  <text x={c.x+c.w/2 + (exploded?(c.x<40?-8:8):0)} y={c.y+c.h/2 + (exploded?(c.y<50?-6:6):0)}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="4.5" fontWeight="700" fontFamily="Space Grotesk" style={{pointerEvents:'none'}}>
                    {c.label.split(' ').map((w,i)=><tspan key={i} x={c.x+c.w/2+(exploded?(c.x<40?-8:8):0)} dy={i===0?0:5}>{w}</tspan>)}
                  </text>
                </g>
              ))}
              {/* Aorta */}
              <path d="M35,28 Q30,15 40,10 Q50,6 55,12" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round"/>
              {/* Pulmonary artery */}
              <path d="M65,30 Q72,18 68,10 Q64,4 58,8" fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round"/>
              {/* Labels */}
              <text x="43" y="8" fill="#e74c3c" fontSize="3.5" fontFamily="Space Grotesk">Aorta</text>
              <text x="58" y="6" fill="#3498db" fontSize="3.5" fontFamily="Space Grotesk">PA</text>
            </svg>
          </div>
        </div>
        <div style={{textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:11,marginTop:4}}>Drag to rotate • Click chambers to inspect</div>
      </div>
      {/* Info panel */}
      <div style={{flex:1,minWidth:220}}>
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Chamber Info</div>
        {activeCh ? (
          <div className="vlab-fadein" style={{background:activeCh.color+'18',border:`1.5px solid ${activeCh.color}55`,borderRadius:14,padding:16}}>
            <div style={{color:activeCh.color,fontSize:16,fontWeight:700,marginBottom:6}}>{activeCh.label}</div>
            <div style={{color:'rgba(255,255,255,0.75)',fontSize:13,lineHeight:1.7}}>{activeCh.info}</div>
          </div>
        ) : (
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>Click a chamber on the diagram to see details.</div>
        )}
        <div style={{marginTop:20}}>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Blood Flow</div>
          {[
            {from:'Body',to:'Right Atrium',color:'#3498db',label:'Deoxygenated'},
            {from:'Right Atrium',to:'Right Ventricle',color:'#2980b9'},
            {from:'Right Ventricle',to:'Lungs',color:'#3498db'},
            {from:'Lungs',to:'Left Atrium',color:'#e74c3c',label:'Oxygenated'},
            {from:'Left Atrium',to:'Left Ventricle',color:'#c0392b'},
            {from:'Left Ventricle',to:'Body',color:'#e74c3c'},
          ].map((step,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:step.color,flexShrink:0}}/>
              <div style={{color:'rgba(255,255,255,0.65)',fontSize:12}}>{step.from} → {step.to}</div>
              {step.label && <span style={{background:step.color+'25',color:step.color,fontSize:10,padding:'1px 7px',borderRadius:8,fontWeight:700}}>{step.label}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CELL ─────────────────────────────────────────────────────────────────
function CellModule() {
  const [hovered, setHovered] = useState(null);
  const organelles = [
    { id:'nucleus',    cx:50, cy:50, rx:14, ry:12, color:'#e74c3c', label:'Nucleus',          info:'Contains DNA; controls cell activity' },
    { id:'mito1',      cx:75, cy:35, rx:8,  ry:5,  color:'#f39c12', label:'Mitochondria',     info:'Powerhouse — produces ATP via cellular respiration' },
    { id:'mito2',      cx:25, cy:65, rx:7,  ry:4,  color:'#f39c12', label:'Mitochondria',     info:'Powerhouse — produces ATP via cellular respiration' },
    { id:'er',         cx:68, cy:62, rx:10, ry:6,  color:'#3498db', label:'Endoplasmic Reticulum', info:'Rough ER: protein synthesis. Smooth ER: lipid synthesis' },
    { id:'golgi',      cx:35, cy:35, rx:9,  ry:5,  color:'#9b59b6', label:'Golgi Apparatus',  info:'Modifies, packages and ships proteins and lipids' },
    { id:'lysosome',   cx:80, cy:70, rx:5,  ry:5,  color:'#e67e22', label:'Lysosome',         info:'Digests waste materials and cellular debris' },
    { id:'ribosome',   cx:55, cy:30, rx:3,  ry:3,  color:'#1abc9c', label:'Ribosome',         info:'Site of protein synthesis (translation)' },
    { id:'vacuole',    cx:28, cy:50, rx:8,  ry:8,  color:'#27ae60', label:'Vacuole',          info:'Storage organelle for water, nutrients, waste' },
  ];
  const active = organelles.find(o=>o.id===hovered);
  return (
    <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div style={{flex:'0 0 380px'}}>
        <svg viewBox="0 0 100 100" style={{width:'100%',height:360,display:'block'}}>
          <defs>
            <radialGradient id="cellbg" cx="50%" cy="50%"><stop offset="0%" stopColor="rgba(39,174,96,0.08)"/><stop offset="100%" stopColor="rgba(39,174,96,0.02)"/></radialGradient>
            <filter id="glow2"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {/* Cell membrane */}
          <ellipse cx="50" cy="50" rx="46" ry="44" fill="url(#cellbg)" stroke="rgba(39,174,96,0.5)" strokeWidth="1.2"/>
          {/* Cell wall */}
          <ellipse cx="50" cy="50" rx="48" ry="46" fill="none" stroke="rgba(39,174,96,0.2)" strokeWidth="1.5" strokeDasharray="3,2"/>
          {/* Cytoplasm dots */}
          {Array.from({length:30}).map((_,i)=>(
            <circle key={i} cx={20+Math.random()*60} cy={15+Math.random()*70} r="0.4" fill="rgba(255,255,255,0.15)"/>
          ))}
          {/* Nuclear envelope */}
          <ellipse cx="50" cy="50" rx="16" ry="14" fill="rgba(231,76,60,0.06)" stroke="rgba(231,76,60,0.4)" strokeWidth="0.8" strokeDasharray="2,1"/>
          {/* Organelles */}
          {organelles.map(o=>(
            <g key={o.id} onMouseEnter={()=>setHovered(o.id)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
              <ellipse cx={o.cx} cy={o.cy} rx={o.rx} ry={o.ry}
                fill={hovered===o.id?o.color:o.color+'55'} stroke={o.color} strokeWidth={hovered===o.id?1.5:0.6}
                filter={hovered===o.id?'url(#glow2)':'none'}
                style={{transition:'all 0.2s'}}/>
              {hovered===o.id && <text x={o.cx} y={o.cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.5" fontWeight="700" fontFamily="Space Grotesk" style={{pointerEvents:'none'}}>{o.label.split(' ')[0]}</text>}
            </g>
          ))}
        </svg>
        <div style={{textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:11,marginTop:-8}}>Hover over organelles to identify them</div>
      </div>
      <div style={{flex:1,minWidth:200}}>
        {active ? (
          <div className="vlab-fadein" style={{background:active.color+'18',border:`1.5px solid ${active.color}55`,borderRadius:14,padding:16,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:14,height:14,borderRadius:'50%',background:active.color}}/>
              <div style={{color:active.color,fontSize:15,fontWeight:700}}>{active.label}</div>
            </div>
            <div style={{color:'rgba(255,255,255,0.8)',fontSize:13,lineHeight:1.7}}>{active.info}</div>
          </div>
        ) : (
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:13,marginBottom:16}}>Hover an organelle on the cell diagram to learn about it.</div>
        )}
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Legend</div>
        {organelles.filter((o,i)=>i<6).map(o=>(
          <div key={o.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:o.color,flexShrink:0}}/>
            <div style={{color:'rgba(255,255,255,0.65)',fontSize:12}}>{o.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEURON ────────────────────────────────────────────────────────────────
function NeuronModule() {
  const [animating, setAnimating] = useState(false);
  const [phase, setPhase] = useState(0);
  const animRef = useRef(null);
  const startAnim = () => {
    setAnimating(true); setPhase(0);
    let p=0;
    animRef.current = setInterval(()=>{ p+=1; setPhase(p); if(p>=100){clearInterval(animRef.current);setAnimating(false);} },40);
  };
  useEffect(()=>()=>clearInterval(animRef.current),[]);
  const signalX = phase * 3.4;

  const parts = [
    {label:'Dendrites',    desc:'Receive signals from other neurons'},
    {label:'Cell Body',    desc:'Nucleus; integrates signals'},
    {label:'Axon',         desc:'Carries electrical impulse away'},
    {label:'Myelin Sheath',desc:'Insulates axon; speeds transmission'},
    {label:'Axon Terminal',desc:'Releases neurotransmitters to next neuron'},
  ];

  return (
    <div style={{display:'flex',gap:24,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div style={{flex:'1 1 400px'}}>
        <button onClick={startAnim} disabled={animating}
          style={{marginBottom:14,padding:'9px 20px',borderRadius:10,border:'1.5px solid rgba(52,152,219,0.4)',background:animating?'rgba(52,152,219,0.08)':'rgba(52,152,219,0.18)',color:'#3498db',fontFamily:'Space Grotesk',fontSize:13,fontWeight:700,cursor:animating?'not-allowed':'pointer'}}>
          {animating?'⚡ Transmitting...':'⚡ Fire Action Potential'}
        </button>
        <svg viewBox="0 0 340 120" style={{width:'100%',height:200,display:'block',overflow:'visible'}}>
          <defs>
            <filter id="glow3"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          {/* Dendrites */}
          {[[-30,-25],[-25,-5],[-20,15],[-15,30]].map(([dx,dy],i)=>(
            <line key={i} x1={40+dx} y1={60+dy} x2="60" y2="60" stroke="#9b59b6" strokeWidth="2.5" strokeLinecap="round"/>
          ))}
          {/* Cell body */}
          <ellipse cx="75" cy="60" rx="18" ry="16" fill="rgba(155,89,182,0.25)" stroke="#9b59b6" strokeWidth="2"/>
          <ellipse cx="75" cy="60" rx="8" ry="7" fill="rgba(231,76,60,0.4)" stroke="#e74c3c" strokeWidth="1.2"/>
          {/* Axon */}
          <line x1="93" y1="60" x2="295" y2="60" stroke="rgba(52,152,219,0.4)" strokeWidth="3"/>
          {/* Myelin sheaths */}
          {[110,148,186,224,262].map((x,i)=>(
            <rect key={i} x={x-10} y="50" width="18" height="20" rx="4" fill="rgba(241,196,15,0.25)" stroke="#f1c40f" strokeWidth="1.2"/>
          ))}
          {/* Signal pulse */}
          {animating && signalX > 0 && signalX < 350 && (
            <circle cx={93+signalX*0.62} cy="60" r="7" fill="#3498db" opacity="0.9" filter="url(#glow3)"/>
          )}
          {/* Axon terminal */}
          <ellipse cx="305" cy="60" rx="12" ry="10" fill="rgba(39,174,96,0.25)" stroke="#27ae60" strokeWidth="2"/>
          {/* Synapse gap */}
          <line x1="317" y1="60" x2="340" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="3,3"/>
          <ellipse cx="340" cy="60" rx="8" ry="7" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          {/* Labels */}
          {[
            [20, 98, '#9b59b6', 'Dendrites'],
            [75, 90, '#9b59b6', 'Cell Body'],
            [190, 88, '#f1c40f', 'Myelin Sheath'],
            [295, 88, '#27ae60', 'Axon Terminal'],
          ].map(([x,y,c,t],i)=>(
            <text key={i} x={x} y={y} textAnchor="middle" fill={c} fontSize="9" fontFamily="Space Grotesk" fontWeight="600">{t}</text>
          ))}
          <text x="190" y="48" textAnchor="middle" fill="#3498db" fontSize="9" fontFamily="Space Grotesk" fontWeight="600">Axon</text>
        </svg>
        {animating && (
          <div className="vlab-fadein" style={{background:'rgba(52,152,219,0.1)',border:'1.5px solid rgba(52,152,219,0.3)',borderRadius:10,padding:'10px 14px',marginTop:8,color:'#3498db',fontSize:12,fontWeight:600}}>
            ⚡ Action potential propagating — Na⁺ rush in, K⁺ rush out — depolarisation wave
          </div>
        )}
      </div>
      <div style={{flex:'0 0 220px'}}>
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Neuron Parts</div>
        {parts.map((p,i)=>(
          <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
            <div style={{color:'white',fontSize:12,fontWeight:700,marginBottom:3}}>{p.label}</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,lineHeight:1.5}}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MOLECULE ──────────────────────────────────────────────────────────────
function MoleculeModule() {
  const [mol, setMol] = useState('water');
  const [rotX, setRotX] = useState(-20);
  const [rotY, setRotY] = useState(30);
  const dragging = useRef(false);
  const lastPos = useRef({x:0,y:0});

  const molecules = {
    water:   { name:'H₂O — Water',      color:'#3498db', atoms:[{el:'O',x:50,y:50,r:16,c:'#e74c3c'},{el:'H',x:25,y:72,r:10,c:'#ecf0f1'},{el:'H',x:75,y:72,r:10,c:'#ecf0f1'}], bonds:[[0,1],[0,2]], info:'Polar covalent molecule. Bent shape (104.5°). Universal solvent.' },
    co2:     { name:'CO₂ — Carbon Dioxide', color:'#95a5a6', atoms:[{el:'O',x:20,y:50,r:14,c:'#e74c3c'},{el:'C',x:50,y:50,r:12,c:'#2c3e50'},{el:'O',x:80,y:50,r:14,c:'#e74c3c'}], bonds:[[0,1],[1,2]], info:'Linear nonpolar molecule. Double bonds. Greenhouse gas.' },
    methane: { name:'CH₄ — Methane',     color:'#f39c12', atoms:[{el:'C',x:50,y:50,r:14,c:'#2c3e50'},{el:'H',x:50,y:22,r:10,c:'#ecf0f1'},{el:'H',x:75,y:65,r:10,c:'#ecf0f1'},{el:'H',x:25,y:65,r:10,c:'#ecf0f1'},{el:'H',x:50,y:78,r:10,c:'#ecf0f1'}], bonds:[[0,1],[0,2],[0,3],[0,4]], info:'Tetrahedral geometry. 109.5° bond angles. Simplest hydrocarbon.' },
    ammonia: { name:'NH₃ — Ammonia',     color:'#27ae60', atoms:[{el:'N',x:50,y:42,r:14,c:'#3498db'},{el:'H',x:25,y:68,r:10,c:'#ecf0f1'},{el:'H',x:50,y:75,r:10,c:'#ecf0f1'},{el:'H',x:75,y:68,r:10,c:'#ecf0f1'}], bonds:[[0,1],[0,2],[0,3]], info:'Trigonal pyramidal. Has lone pair. Forms hydrogen bonds.' },
  };

  const m = molecules[mol];

  const onMouseDown = e => { dragging.current=true; lastPos.current={x:e.clientX,y:e.clientY}; };
  const onMouseMove = e => {
    if(!dragging.current)return;
    setRotY(r=>r+(e.clientX-lastPos.current.x)*0.6);
    setRotX(r=>r-(e.clientY-lastPos.current.y)*0.6);
    lastPos.current={x:e.clientX,y:e.clientY};
  };
  const onMouseUp = ()=>{ dragging.current=false; };

  return (
    <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
      <div style={{flex:'0 0 380px'}}>
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {Object.entries(molecules).map(([k,v])=>(
            <button key={k} onClick={()=>setMol(k)}
              style={{padding:'7px 14px',borderRadius:10,border:`1.5px solid ${mol===k?v.color:'rgba(255,255,255,0.1)'}`,background:mol===k?v.color+'22':'rgba(255,255,255,0.04)',color:mol===k?v.color:'rgba(255,255,255,0.6)',fontFamily:'Space Grotesk',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {k.charAt(0).toUpperCase()+k.slice(1)}
            </button>
          ))}
        </div>
        <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{cursor:'grab',userSelect:'none',height:300,perspective:500,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.02)',borderRadius:16,border:'1.5px solid rgba(255,255,255,0.06)'}}>
          <div style={{transformStyle:'preserve-3d',transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,width:160,height:160,position:'relative'}}>
            <svg viewBox="0 0 100 100" style={{width:160,height:160,position:'absolute',top:0,left:0,overflow:'visible'}}>
              <defs><filter id="glow4"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              {m.bonds.map(([a,b],i)=>{
                const A=m.atoms[a], B=m.atoms[b];
                return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeLinecap="round"/>;
              })}
              {m.atoms.map((a,i)=>(
                <g key={i}>
                  <circle cx={a.x} cy={a.y} r={a.r} fill={a.c} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" filter="url(#glow4)"/>
                  <text x={a.x} y={a.y} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={a.r*0.8} fontWeight="700" fontFamily="Space Grotesk">{a.el}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
        <div style={{textAlign:'center',color:'rgba(255,255,255,0.3)',fontSize:11,marginTop:6}}>Drag to rotate molecule</div>
      </div>
      <div style={{flex:1,minWidth:200}}>
        <div className="vlab-fadein" key={mol} style={{background:m.color+'15',border:`1.5px solid ${m.color}40`,borderRadius:14,padding:16}}>
          <div style={{color:m.color,fontSize:18,fontWeight:700,marginBottom:8}}>{m.name}</div>
          <div style={{color:'rgba(255,255,255,0.75)',fontSize:13,lineHeight:1.8}}>{m.info}</div>
        </div>
        <div style={{marginTop:16}}>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Atoms</div>
          {m.atoms.map((a,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:a.c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0}}>{a.el}</div>
              <div style={{color:'rgba(255,255,255,0.65)',fontSize:12}}>{a.el==='O'?'Oxygen':a.el==='H'?'Hydrogen':a.el==='C'?'Carbon':a.el==='N'?'Nitrogen':a.el}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PERIODIC ──────────────────────────────────────────────────────────────
function PeriodicModule() {
  const [flipped, setFlipped] = useState({});
  const elements = [
    {sym:'H',  name:'Hydrogen',  no:1,  mass:1.008,  cat:'nonmetal',  config:'1s¹',          color:'#3498db'},
    {sym:'He', name:'Helium',    no:2,  mass:4.003,  cat:'noble gas', config:'1s²',          color:'#9b59b6'},
    {sym:'Li', name:'Lithium',   no:3,  mass:6.941,  cat:'alkali',    config:'[He] 2s¹',     color:'#e74c3c'},
    {sym:'Na', name:'Sodium',    no:11, mass:22.99,  cat:'alkali',    config:'[Ne] 3s¹',     color:'#e74c3c'},
    {sym:'C',  name:'Carbon',    no:6,  mass:12.01,  cat:'nonmetal',  config:'[He] 2s² 2p²', color:'#27ae60'},
    {sym:'O',  name:'Oxygen',    no:8,  mass:16.00,  cat:'nonmetal',  config:'[He] 2s² 2p⁴', color:'#3498db'},
    {sym:'Fe', name:'Iron',      no:26, mass:55.85,  cat:'metal',     config:'[Ar] 3d⁶ 4s²', color:'#f39c12'},
    {sym:'Ca', name:'Calcium',   no:20, mass:40.08,  cat:'alkali earth','config':'[Ar] 4s²',  color:'#e67e22'},
    {sym:'N',  name:'Nitrogen',  no:7,  mass:14.01,  cat:'nonmetal',  config:'[He] 2s² 2p³', color:'#1abc9c'},
    {sym:'Cl', name:'Chlorine',  no:17, mass:35.45,  cat:'halogen',   config:'[Ne] 3s² 3p⁵', color:'#f39c12'},
    {sym:'Au', name:'Gold',      no:79, mass:196.97, cat:'metal',     config:'[Xe] 4f¹⁴ 5d¹⁰ 6s¹', color:'#ffd700'},
    {sym:'Ag', name:'Silver',    no:47, mass:107.87, cat:'metal',     config:'[Kr] 4d¹⁰ 5s¹', color:'#95a5a6'},
  ];
  return (
    <div>
      <div style={{color:'rgba(255,255,255,0.5)',fontSize:12,marginBottom:16}}>Click any element card to flip and see electron configuration</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:12}}>
        {elements.map(el=>(
          <div key={el.sym} onClick={()=>setFlipped(f=>({...f,[el.sym]:!f[el.sym]}))}
            style={{height:120,perspective:600,cursor:'pointer'}}>
            <div style={{width:'100%',height:'100%',transformStyle:'preserve-3d',transform:flipped[el.sym]?'rotateY(180deg)':'none',transition:'transform 0.5s cubic-bezier(.4,0,.2,1)',position:'relative'}}>
              {/* Front */}
              <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',background:el.color+'18',border:`1.5px solid ${el.color}55`,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>{el.no}</div>
                <div style={{color:el.color,fontSize:28,fontWeight:800,lineHeight:1}}>{el.sym}</div>
                <div style={{color:'rgba(255,255,255,0.7)',fontSize:10,fontWeight:600,textAlign:'center'}}>{el.name}</div>
                <div style={{color:'rgba(255,255,255,0.35)',fontSize:9}}>{el.mass}</div>
              </div>
              {/* Back */}
              <div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',transform:'rotateY(180deg)',background:el.color+'28',border:`2px solid ${el.color}80`,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:8,gap:6}}>
                <div style={{color:el.color,fontSize:13,fontWeight:800}}>{el.sym}</div>
                <div style={{color:'white',fontSize:10,fontFamily:'JetBrains Mono',textAlign:'center',lineHeight:1.6}}>{el.config}</div>
                <div style={{color:el.color+'cc',fontSize:9,textAlign:'center',textTransform:'capitalize'}}>{el.cat}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── REACTION ──────────────────────────────────────────────────────────────
function ReactionModule() {
  const [step, setStep] = useState(0);
  const reactions = [
    {
      name:'Combustion of Methane',
      steps:[
        {label:'Reactants',  eq:'CH₄ + 2O₂',    desc:'Methane and oxygen — ready to react',            color:'#e74c3c'},
        {label:'Activation', eq:'CH₄ + 2O₂ →',   desc:'Activation energy supplied (heat/spark)',        color:'#f39c12'},
        {label:'Transition', eq:'[CH₄·O₂]‡',     desc:'Transition state — bonds breaking & forming',   color:'#f39c12'},
        {label:'Products',   eq:'CO₂ + 2H₂O',    desc:'Carbon dioxide and water released + energy',     color:'#27ae60'},
      ]
    },
    {
      name:'Acid + Base Neutralisation',
      steps:[
        {label:'Acid',       eq:'HCl',             desc:'Hydrochloric acid — donates H⁺ proton',         color:'#e74c3c'},
        {label:'Base',       eq:'HCl + NaOH',      desc:'Sodium hydroxide — accepts H⁺ proton',          color:'#3498db'},
        {label:'Reaction',   eq:'HCl + NaOH →',    desc:'Proton transfer occurring',                     color:'#f39c12'},
        {label:'Products',   eq:'NaCl + H₂O',      desc:'Salt + water — neutral pH solution',            color:'#27ae60'},
      ]
    },
  ];
  const [rxn, setRxn] = useState(0);
  const r = reactions[rxn];
  const s = r.steps[step];

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {reactions.map((r,i)=>(
          <button key={i} onClick={()=>{setRxn(i);setStep(0);}}
            style={{padding:'8px 14px',borderRadius:10,border:`1.5px solid ${rxn===i?'#f39c12':'rgba(255,255,255,0.1)'}`,background:rxn===i?'rgba(243,156,18,0.15)':'rgba(255,255,255,0.04)',color:rxn===i?'#f39c12':'rgba(255,255,255,0.6)',fontFamily:'Space Grotesk',fontSize:12,fontWeight:700,cursor:'pointer'}}>
            {r.name}
          </button>
        ))}
      </div>
      {/* Step display */}
      <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
          {r.steps.map((s2,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flex:1}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:i<=step?s2.color+'30':'rgba(255,255,255,0.05)',border:`2px solid ${i<=step?s2.color:'rgba(255,255,255,0.1)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:i<=step?s2.color:'rgba(255,255,255,0.2)',transition:'all 0.3s'}}>
                {i+1}
              </div>
              <div style={{color:i<=step?s2.color:'rgba(255,255,255,0.25)',fontSize:10,fontWeight:700,textAlign:'center',transition:'all 0.3s'}}>{s2.label}</div>
              {i < r.steps.length-1 && <div style={{position:'absolute',width:0}} />}
            </div>
          ))}
        </div>
        {/* Current step */}
        <div className="vlab-fadein" key={`${rxn}-${step}`} style={{textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:800,color:s.color,fontFamily:'JetBrains Mono',marginBottom:12,letterSpacing:2}}>{s.eq}</div>
          <div style={{color:'rgba(255,255,255,0.7)',fontSize:14,lineHeight:1.7}}>{s.desc}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:10}}>
        <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0}
          style={{flex:1,padding:'10px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:step===0?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.7)',fontFamily:'Space Grotesk',fontSize:13,fontWeight:700,cursor:step===0?'not-allowed':'pointer'}}>
          ← Previous
        </button>
        <button onClick={()=>setStep(s=>Math.min(r.steps.length-1,s+1))} disabled={step===r.steps.length-1}
          style={{flex:1,padding:'10px',borderRadius:10,border:`1.5px solid ${s.color}55`,background:s.color+'18',color:step===r.steps.length-1?'rgba(255,255,255,0.2)':s.color,fontFamily:'Space Grotesk',fontSize:13,fontWeight:700,cursor:step===r.steps.length-1?'not-allowed':'pointer'}}>
          Next Step →
        </button>
      </div>
    </div>
  );
}

// ── PROJECTILE ───────────────────────────────────────────────────────────
function ProjectileModule() {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(50);
  const [running, setRunning] = useState(false);
  const animRef = useRef(null);

  const launch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W=canvas.width, H=canvas.height;
    const g=9.8, scale=3.5;
    const rad=angle*Math.PI/180;
    const vx=speed*Math.cos(rad)*scale, vy=speed*Math.sin(rad)*scale;
    let t=0, trail=[];
    cancelAnimationFrame(animRef.current);
    setRunning(true);

    const draw = () => {
      ctx.clearRect(0,0,W,H);
      // Grid
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=1;
      for(let x=0;x<W;x+=40){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
      for(let y=0;y<H;y+=40){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }
      // Ground
      ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();

      const x=vx*t, y=vy*t-0.5*g*t*t*scale;
      const px=40+x, py=H-30-y;
      trail.push({x:px,y:py});
      if(trail.length>120)trail.shift();

      // Trail
      trail.forEach((pt,i)=>{
        const a=i/trail.length;
        ctx.beginPath();ctx.arc(pt.x,pt.y,3*a,0,Math.PI*2);
        ctx.fillStyle=`rgba(243,156,18,${a*0.6})`;ctx.fill();
      });
      // Ball
      ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);
      const grd=ctx.createRadialGradient(px-2,py-2,1,px,py,8);
      grd.addColorStop(0,'#ffd700');grd.addColorStop(1,'#f39c12');
      ctx.fillStyle=grd;ctx.fill();
      // Info
      const vc=Math.sqrt((vx)**2+(vy-g*t*scale)**2)/scale;
      ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='12px Space Grotesk';
      ctx.fillText(`t = ${t.toFixed(2)}s`, 10, 20);
      ctx.fillText(`v = ${vc.toFixed(1)} m/s`, 10, 38);
      ctx.fillText(`x = ${(x/scale/scale).toFixed(1)} m`, 10, 56);
      ctx.fillText(`y = ${Math.max(0,y/scale/scale).toFixed(1)} m`, 10, 74);

      if(py <= H-30 && t > 0.05){
        t+=0.02;
        animRef.current=requestAnimationFrame(draw);
      } else {
        if(t>0.05){ ctx.fillStyle='#27ae60'; ctx.font='bold 13px Space Grotesk'; ctx.fillText('🏁 Landed!',px-20,py-20); }
        setRunning(false);
      }
    };
    t=0.02; animRef.current=requestAnimationFrame(draw);
  }, [angle, speed]);

  useEffect(()=>()=>cancelAnimationFrame(animRef.current),[]);

  // Draw initial state
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,H-30);ctx.lineTo(W,H-30);ctx.stroke();
    // Arrow showing angle
    const rad=angle*Math.PI/180;
    ctx.strokeStyle='#f39c12';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(40,H-30);ctx.lineTo(40+60*Math.cos(rad),H-30-60*Math.sin(rad));ctx.stroke();
    ctx.beginPath();ctx.arc(40,H-30,8,0,Math.PI*2);ctx.fillStyle='#ffd700';ctx.fill();
  },[angle]);

  const R=angle*Math.PI/180;
  const range=(speed*speed*Math.sin(2*R)/9.8).toFixed(1);
  const maxH=(speed*speed*Math.sin(R)*Math.sin(R)/(2*9.8)).toFixed(1);
  const tFlight=(2*speed*Math.sin(R)/9.8).toFixed(2);

  return (
    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
      <div style={{flex:'1 1 420px'}}>
        <canvas ref={canvasRef} width={500} height={320}
          style={{width:'100%',height:280,borderRadius:12,background:'#0a0a18',border:'1.5px solid rgba(255,255,255,0.07)',display:'block'}}/>
      </div>
      <div style={{flex:'0 0 220px'}}>
        <div style={{marginBottom:16}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>LAUNCH ANGLE: {angle}°</label>
          <input type="range" min="5" max="85" value={angle} onChange={e=>setAngle(+e.target.value)}
            style={{width:'100%',accentColor:'#f39c12'}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>INITIAL SPEED: {speed} m/s</label>
          <input type="range" min="10" max="100" value={speed} onChange={e=>setSpeed(+e.target.value)}
            style={{width:'100%',accentColor:'#f39c12'}}/>
        </div>
        <button onClick={launch} disabled={running}
          style={{width:'100%',padding:'11px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#f39c12,#e67e22)',color:'white',fontFamily:'Space Grotesk',fontSize:14,fontWeight:800,cursor:running?'not-allowed':'pointer',opacity:running?0.6:1,marginBottom:16}}>
          🚀 Launch
        </button>
        {[['Range',`${range} m`,'#27ae60'],['Max Height',`${maxH} m`,'#3498db'],['Flight Time',`${tFlight} s`,'#f39c12']].map(([k,v,c])=>(
          <div key={k} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'10px 12px',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:'rgba(255,255,255,0.55)',fontSize:12}}>{k}</span>
            <span style={{color:c,fontSize:14,fontWeight:800,fontFamily:'JetBrains Mono'}}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WAVE ─────────────────────────────────────────────────────────────────
function WaveModule() {
  const canvasRef=useRef(null);
  const animRef=useRef(null);
  const [freq1,setFreq1]=useState(1);
  const [freq2,setFreq2]=useState(1.5);
  const [amp1,setAmp1]=useState(40);
  const [amp2,setAmp2]=useState(30);
  const propsRef=useRef({freq1,freq2,amp1,amp2});
  propsRef.current={freq1,freq2,amp1,amp2};

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height;
    let t=0;
    const draw=()=>{
      const {freq1,freq2,amp1,amp2}=propsRef.current;
      ctx.clearRect(0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
      for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

      const drawWave=(f,a,color,yOff)=>{
        ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2;
        for(let x=0;x<W;x++){
          const y2=yOff+a*Math.sin(2*Math.PI*f*(x/W)*4+t);
          x===0?ctx.moveTo(x,y2):ctx.lineTo(x,y2);
        }ctx.stroke();
      };
      // Wave 1
      drawWave(freq1,amp1,'rgba(52,152,219,0.7)',H/3);
      // Wave 2
      drawWave(freq2,amp2,'rgba(231,76,60,0.7)',H*2/3);
      // Superposition
      ctx.beginPath();ctx.strokeStyle='rgba(255,215,0,0.9)';ctx.lineWidth=2.5;
      for(let x=0;x<W;x++){
        const y1=amp1*Math.sin(2*Math.PI*freq1*(x/W)*4+t);
        const y2=amp2*Math.sin(2*Math.PI*freq2*(x/W)*4+t);
        const yS=H/2+y1+y2;
        x===0?ctx.moveTo(x,yS):ctx.lineTo(x,yS);
      }ctx.stroke();
      // Labels
      ctx.fillStyle='rgba(52,152,219,0.9)';ctx.font='11px Space Grotesk';ctx.fillText(`Wave 1 (f=${freq1} Hz)`,8,H/3-amp1-8);
      ctx.fillStyle='rgba(231,76,60,0.9)';ctx.fillText(`Wave 2 (f=${freq2} Hz)`,8,H*2/3-amp2-8);
      ctx.fillStyle='rgba(255,215,0,0.9)';ctx.fillText('Superposition',8,H/2-amp1-amp2-8);
      t+=0.05;
      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>cancelAnimationFrame(animRef.current);
  },[]);

  return (
    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
      <div style={{flex:'1 1 420px'}}>
        <canvas ref={canvasRef} width={520} height={360}
          style={{width:'100%',borderRadius:12,background:'#070714',border:'1.5px solid rgba(255,255,255,0.07)',display:'block'}}/>
      </div>
      <div style={{flex:'0 0 200px'}}>
        {[['Wave 1 Frequency',freq1,setFreq1,0.5,4,0.5,'#3498db'],
          ['Wave 2 Frequency',freq2,setFreq2,0.5,4,0.5,'#e74c3c'],
          ['Wave 1 Amplitude',amp1,setAmp1,10,60,5,'#3498db'],
          ['Wave 2 Amplitude',amp2,setAmp2,10,60,5,'#e74c3c']].map(([lbl,val,setter,min,max,step,c])=>(
          <div key={lbl} style={{marginBottom:16}}>
            <label style={{color:'rgba(255,255,255,0.55)',fontSize:11,fontWeight:700,display:'block',marginBottom:5}}>
              {lbl}: <span style={{color:c}}>{val}</span>
            </label>
            <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setter(+e.target.value)} style={{width:'100%',accentColor:c}}/>
          </div>
        ))}
        <div style={{background:'rgba(255,215,0,0.08)',border:'1.5px solid rgba(255,215,0,0.2)',borderRadius:10,padding:12,marginTop:8}}>
          <div style={{color:'#ffd700',fontSize:11,fontWeight:700,marginBottom:4}}>Superposition Principle</div>
          <div style={{color:'rgba(255,255,255,0.6)',fontSize:11,lineHeight:1.6}}>When two waves overlap, their displacements add. Constructive when in phase, destructive when out of phase.</div>
        </div>
      </div>
    </div>
  );
}

// ── PENDULUM ─────────────────────────────────────────────────────────────
function PendulumModule() {
  const canvasRef=useRef(null);
  const animRef=useRef(null);
  const [length,setLength]=useState(150);
  const [damping,setDamping]=useState(0.999);
  const propsRef=useRef({length,damping});
  propsRef.current={length,damping};

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height;
    let theta=Math.PI/4, omega=0, t=0;
    const draw=()=>{
      const {length,damping}=propsRef.current;
      const g=980, dt=0.016;
      omega+=(-g/length)*Math.sin(theta)*dt;
      omega*=damping;
      theta+=omega*dt;
      t+=dt;

      ctx.clearRect(0,0,W,H);
      // Grid dots
      for(let x=0;x<W;x+=30)for(let y=0;y<H;y+=30){
        ctx.beginPath();ctx.arc(x,y,0.8,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fill();
      }
      const pivotX=W/2, pivotY=60;
      const bobX=pivotX+length*Math.sin(theta);
      const bobY=pivotY+length*Math.cos(theta);

      // String
      ctx.beginPath();ctx.moveTo(pivotX,pivotY);ctx.lineTo(bobX,bobY);
      ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1.5;ctx.stroke();
      // Pivot
      ctx.beginPath();ctx.arc(pivotX,pivotY,6,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fill();
      // Bob shadow
      ctx.beginPath();ctx.arc(bobX+3,bobY+3,20,0,Math.PI*2);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fill();
      // Bob
      ctx.beginPath();ctx.arc(bobX,bobY,18,0,Math.PI*2);
      const grd=ctx.createRadialGradient(bobX-5,bobY-5,2,bobX,bobY,18);
      grd.addColorStop(0,'#f39c12');grd.addColorStop(1,'#e67e22');
      ctx.fillStyle=grd;ctx.fill();
      // Angle arc
      ctx.beginPath();ctx.arc(pivotX,pivotY,40,Math.PI/2-0.01,Math.PI/2+theta,theta<0);
      ctx.strokeStyle='rgba(155,89,182,0.6)';ctx.lineWidth=1.5;ctx.stroke();

      // Info
      const period=(2*Math.PI*Math.sqrt(length/g)).toFixed(3);
      const KE=(0.5*length*length*omega*omega).toFixed(0);
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='12px Space Grotesk';
      ctx.fillText(`θ = ${(theta*180/Math.PI).toFixed(1)}°`,10,20);
      ctx.fillText(`T ≈ ${period} s`,10,38);
      ctx.fillText(`KE ~ ${KE}`,10,56);

      animRef.current=requestAnimationFrame(draw);
    };
    draw();
    return()=>cancelAnimationFrame(animRef.current);
  },[]);

  const T=(2*Math.PI*Math.sqrt(length/980)).toFixed(3);
  return (
    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
      <div style={{flex:'1 1 380px'}}>
        <canvas ref={canvasRef} width={460} height={360}
          style={{width:'100%',borderRadius:12,background:'#07071a',border:'1.5px solid rgba(255,255,255,0.07)',display:'block'}}/>
      </div>
      <div style={{flex:'0 0 200px'}}>
        <div style={{marginBottom:16}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>LENGTH: {length} px</label>
          <input type="range" min="60" max="220" value={length} onChange={e=>setLength(+e.target.value)} style={{width:'100%',accentColor:'#f39c12'}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>DAMPING: {damping}</label>
          <input type="range" min="0.990" max="1.000" step="0.001" value={damping} onChange={e=>setDamping(+e.target.value)} style={{width:'100%',accentColor:'#9b59b6'}}/>
        </div>
        <div style={{background:'rgba(243,156,18,0.08)',border:'1.5px solid rgba(243,156,18,0.2)',borderRadius:10,padding:12,marginBottom:12}}>
          <div style={{color:'#f39c12',fontSize:11,fontWeight:700,marginBottom:4}}>Period Formula</div>
          <div style={{color:'white',fontFamily:'JetBrains Mono',fontSize:14,marginBottom:4}}>T = 2π√(L/g)</div>
          <div style={{color:'#f39c12',fontSize:13,fontWeight:700}}>T = {T} s</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:12}}>
          <div style={{color:'rgba(255,255,255,0.6)',fontSize:11,lineHeight:1.7}}>Drag damping to 1.000 for perpetual motion. Reduce for energy loss simulation.</div>
        </div>
      </div>
    </div>
  );
}

// ── GEOMETRY 3D ──────────────────────────────────────────────────────────
function Geometry3DModule() {
  const [shape,setShape]=useState('cube');
  const [rotX,setRotX]=useState(20);
  const [rotY,setRotY]=useState(30);
  const [exploded,setExploded]=useState(false);
  const dragging=useRef(false);
  const lastPos=useRef({x:0,y:0});

  const onMouseDown=e=>{dragging.current=true;lastPos.current={x:e.clientX,y:e.clientY};};
  const onMouseMove=e=>{if(!dragging.current)return;setRotY(r=>r+(e.clientX-lastPos.current.x)*0.5);setRotX(r=>r-(e.clientY-lastPos.current.y)*0.5);lastPos.current={x:e.clientX,y:e.clientY};};
  const onMouseUp=()=>{dragging.current=false;};

  const shapes={
    cube:{label:'Cube',V:'V = a³',SA:'SA = 6a²',faces:6,edges:12,vertices:8,color:'#3498db'},
    sphere:{label:'Sphere',V:'V = 4/3 πr³',SA:'SA = 4πr²',faces:'∞',edges:0,vertices:0,color:'#e74c3c'},
    cone:{label:'Cone',V:'V = 1/3 πr²h',SA:'SA = πr(r+l)',faces:2,edges:1,vertices:1,color:'#27ae60'},
    cylinder:{label:'Cylinder',V:'V = πr²h',SA:'SA = 2πr(r+h)',faces:3,edges:2,vertices:0,color:'#f39c12'},
  };
  const s=shapes[shape];

  // CSS 3D cube faces
  const size=90;
  const faces=[
    {label:'Front', t:`translateZ(${size/2}px)`, bg:s.color+'40'},
    {label:'Back',  t:`rotateY(180deg) translateZ(${size/2}px)`, bg:s.color+'30'},
    {label:'Left',  t:`rotateY(-90deg) translateZ(${size/2}px)`, bg:s.color+'35'},
    {label:'Right', t:`rotateY(90deg) translateZ(${size/2}px)`, bg:s.color+'35'},
    {label:'Top',   t:`rotateX(90deg) translateZ(${size/2}px)`, bg:s.color+'50'},
    {label:'Bottom',t:`rotateX(-90deg) translateZ(${size/2}px)`, bg:s.color+'25'},
  ];

  return (
    <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
      <div style={{flex:'0 0 380px'}}>
        <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
          {Object.entries(shapes).map(([k,v])=>(
            <button key={k} onClick={()=>setShape(k)}
              style={{padding:'7px 14px',borderRadius:10,border:`1.5px solid ${shape===k?v.color:'rgba(255,255,255,0.1)'}`,background:shape===k?v.color+'22':'rgba(255,255,255,0.04)',color:shape===k?v.color:'rgba(255,255,255,0.6)',fontFamily:'Space Grotesk',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              {v.label}
            </button>
          ))}
        </div>
        <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          style={{cursor:'grab',userSelect:'none',height:300,perspective:800,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.02)',borderRadius:16,border:'1.5px solid rgba(255,255,255,0.06)'}}>
          {shape==='cube' && (
            <div style={{width:size,height:size,transformStyle:'preserve-3d',transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,position:'relative'}}>
              {faces.map((f,i)=>(
                <div key={i} style={{position:'absolute',width:size,height:size,background:f.bg,border:`1.5px solid ${s.color}99`,transform:f.t,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
                  {exploded?f.label:''}
                </div>
              ))}
            </div>
          )}
          {shape==='sphere' && (
            <div style={{width:size,height:size,borderRadius:'50%',background:`radial-gradient(circle at 35% 35%, ${s.color}dd, ${s.color}44)`,transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,boxShadow:`0 0 40px ${s.color}44, inset -10px -10px 30px rgba(0,0,0,0.4)`,border:`2px solid ${s.color}66`}}/>
          )}
          {shape==='cone' && (
            <div style={{width:0,height:0,borderLeft:`${size/2}px solid transparent`,borderRight:`${size/2}px solid transparent`,borderBottom:`${size}px solid ${s.color}88`,transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,filter:`drop-shadow(0 0 20px ${s.color}44)`}}/>
          )}
          {shape==='cylinder' && (
            <div style={{width:size,height:size,background:`linear-gradient(90deg, ${s.color}33, ${s.color}88, ${s.color}33)`,borderRadius:'50%/10px',border:`2px solid ${s.color}88`,transform:`rotateX(${rotX}deg) rotateY(${rotY}deg)`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 30px ${s.color}33`}}>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:10}}>cylinder</div>
            </div>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:11}}>Drag to rotate</div>
          {shape==='cube' && <button onClick={()=>setExploded(e=>!e)} style={{padding:'5px 12px',borderRadius:8,border:`1px solid ${s.color}44`,background:exploded?s.color+'22':'transparent',color:s.color,fontFamily:'Space Grotesk',fontSize:11,cursor:'pointer'}}>{exploded?'Hide':'Label Faces'}</button>}
        </div>
      </div>
      <div style={{flex:1,minWidth:180}}>
        <div className="vlab-fadein" key={shape} style={{background:s.color+'12',border:`1.5px solid ${s.color}40`,borderRadius:14,padding:16,marginBottom:14}}>
          <div style={{color:s.color,fontSize:18,fontWeight:700,marginBottom:12}}>{s.label}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[['Volume',s.V,s.color],['Surface Area',s.SA,s.color],['Faces',s.faces,'rgba(255,255,255,0.7)'],['Edges',s.edges,'rgba(255,255,255,0.7)'],['Vertices',s.vertices,'rgba(255,255,255,0.7)']].map(([k,v,c])=>(
              <div key={k} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px 10px'}}>
                <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,marginBottom:2}}>{k}</div>
                <div style={{color:c,fontSize:12,fontWeight:700,fontFamily:'JetBrains Mono'}}>{String(v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:12}}>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,marginBottom:6}}>EULER'S FORMULA</div>
          <div style={{color:'white',fontFamily:'JetBrains Mono',fontSize:16,marginBottom:4}}>V − E + F = 2</div>
          <div style={{color:'rgba(255,255,255,0.45)',fontSize:11}}>Vertices − Edges + Faces = 2 (for convex polyhedra)</div>
        </div>
      </div>
    </div>
  );
}

// ── FUNCTION GRAPHER ──────────────────────────────────────────────────────
function GrapherModule() {
  const canvasRef=useRef(null);
  const [expr,setExpr]=useState('Math.sin(x)');
  const [xMin,setXMin]=useState(-10);
  const [xMax,setXMax]=useState(10);
  const [error,setError]=useState('');
  const presets=[
    {label:'sin(x)',expr:'Math.sin(x)'},
    {label:'x²',expr:'x*x'},
    {label:'tan(x)',expr:'Math.tan(x)'},
    {label:'eˣ',expr:'Math.exp(x)'},
    {label:'|x|',expr:'Math.abs(x)'},
    {label:'sin(x)/x',expr:'Math.sin(x)/x'},
  ];

  const draw=useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H);
    // Background grid
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    const steps=10;
    for(let i=0;i<=steps;i++){
      const x=W*i/steps; ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
      const y=H*i/steps; ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    }
    // Axes
    const ox=W*(-xMin)/(xMax-xMin);
    const oy=H/2;
    ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(0,oy);ctx.lineTo(W,oy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ox,0);ctx.lineTo(ox,H);ctx.stroke();
    // Labels
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='10px JetBrains Mono';
    ctx.fillText('x',W-12,oy-6);ctx.fillText('y',ox+6,12);
    for(let v=Math.ceil(xMin);v<=Math.floor(xMax);v+=Math.ceil((xMax-xMin)/10)){
      const px=ox+v*W/(xMax-xMin);
      ctx.fillText(v,px-4,oy+14);
      ctx.beginPath();ctx.moveTo(px,oy-3);ctx.lineTo(px,oy+3);ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.stroke();
    }
    // Plot
    try {
      const fn=new Function('x',`"use strict"; try{return ${expr}}catch(e){return NaN;}`);
      ctx.beginPath();ctx.strokeStyle='#3498db';ctx.lineWidth=2.5;
      let started=false;
      for(let px=0;px<W;px++){
        const x=xMin+px*(xMax-xMin)/W;
        const y=fn(x);
        if(!isFinite(y)){started=false;continue;}
        const py=oy-y*H/(xMax-xMin)*((xMax-xMin)/10);
        if(!started){ctx.moveTo(px,py);started=true;}else{ctx.lineTo(px,py);}
      }
      ctx.stroke();
      setError('');
    } catch(e){ setError('Invalid expression'); }
  },[expr,xMin,xMax]);

  useEffect(()=>{draw();},[draw]);

  return (
    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
      <div style={{flex:'1 1 400px'}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
          {presets.map(p=>(
            <button key={p.label} onClick={()=>setExpr(p.expr)}
              style={{padding:'6px 12px',borderRadius:8,border:`1.5px solid ${expr===p.expr?'#3498db':'rgba(255,255,255,0.1)'}`,background:expr===p.expr?'rgba(52,152,219,0.2)':'rgba(255,255,255,0.04)',color:expr===p.expr?'#3498db':'rgba(255,255,255,0.6)',fontFamily:'JetBrains Mono',fontSize:12,cursor:'pointer'}}>
              {p.label}
            </button>
          ))}
        </div>
        <canvas ref={canvasRef} width={500} height={320}
          style={{width:'100%',height:280,borderRadius:12,background:'#07071a',border:`1.5px solid ${error?'rgba(231,76,60,0.5)':'rgba(255,255,255,0.07)'}`,display:'block'}}/>
      </div>
      <div style={{flex:'0 0 200px'}}>
        <div style={{marginBottom:12}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>y = f(x)</label>
          <input value={expr} onChange={e=>setExpr(e.target.value)}
            style={{width:'100%',background:'rgba(255,255,255,0.06)',border:`1.5px solid ${error?'rgba(231,76,60,0.5)':'rgba(255,255,255,0.15)'}`,borderRadius:10,padding:'10px 12px',color:'white',fontFamily:'JetBrains Mono',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
          {error && <div style={{color:'#e74c3c',fontSize:11,marginTop:4}}>⚠ {error}</div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
          {[['x min',xMin,setXMin],['x max',xMax,setXMax]].map(([lbl,val,setter])=>(
            <div key={lbl}>
              <label style={{color:'rgba(255,255,255,0.5)',fontSize:11,display:'block',marginBottom:4}}>{lbl}</label>
              <input type="number" value={val} onChange={e=>setter(+e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:8,padding:'8px',color:'white',fontFamily:'JetBrains Mono',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
        </div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:11,lineHeight:1.7}}>Use JavaScript math:<br/><code style={{color:'#3498db'}}>Math.sin(x)</code><br/><code style={{color:'#3498db'}}>Math.sqrt(x)</code><br/><code style={{color:'#3498db'}}>Math.log(x)</code><br/><code style={{color:'#3498db'}}>Math.PI</code></div>
      </div>
    </div>
  );
}

// ── TRIG CIRCLE ───────────────────────────────────────────────────────────
function TrigCircleModule() {
  const canvasRef=useRef(null);
  const animRef=useRef(null);
  const [angle,setAngle]=useState(45);
  const [animating,setAnimating]=useState(false);
  const angleRef=useRef(angle);

  useEffect(()=>{ angleRef.current=angle; },[angle]);

  const drawStatic=useCallback((a)=>{
    const canvas=canvasRef.current; if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const W=canvas.width,H=canvas.height;
    const cx=W/2,cy=H/2,R=Math.min(W,H)/2-30;
    ctx.clearRect(0,0,W,H);
    // Background circles
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    [0.5,1].forEach(f=>{ctx.beginPath();ctx.arc(cx,cy,R*f,0,2*Math.PI);ctx.stroke();});
    // Axes
    ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-R-20,cy);ctx.lineTo(cx+R+20,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-R-20);ctx.lineTo(cx,cy+R+20);ctx.stroke();
    // Unit circle
    ctx.beginPath();ctx.arc(cx,cy,R,0,2*Math.PI);ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1.5;ctx.stroke();
    // Labels
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='12px Space Grotesk';
    ctx.fillText('1',cx+R+4,cy-4);ctx.fillText('-1',cx-R-18,cy-4);
    ctx.fillText('1',cx+4,cy-R-4);ctx.fillText('-1',cx+4,cy+R+14);

    const rad=a*Math.PI/180;
    const px=cx+R*Math.cos(rad), py=cy-R*Math.sin(rad);
    // Radius line
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,py);ctx.strokeStyle='#ffd700';ctx.lineWidth=2.5;ctx.stroke();
    // sin (vertical)
    ctx.beginPath();ctx.moveTo(px,cy);ctx.lineTo(px,py);ctx.strokeStyle='#e74c3c';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
    // cos (horizontal)
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(px,cy);ctx.strokeStyle='#3498db';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
    // Point
    ctx.beginPath();ctx.arc(px,py,7,0,2*Math.PI);ctx.fillStyle='#ffd700';ctx.fill();
    // Angle arc
    ctx.beginPath();ctx.arc(cx,cy,30,0,-rad,rad<0);ctx.strokeStyle='#9b59b6';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#9b59b6';ctx.font='11px Space Grotesk';ctx.fillText(`${a}°`,cx+34,cy-10);

    // Values
    const sinV=Math.sin(rad),cosV=Math.cos(rad);
    ctx.fillStyle='#e74c3c';ctx.font='bold 13px JetBrains Mono';ctx.fillText(`sin = ${sinV.toFixed(4)}`,10,H-50);
    ctx.fillStyle='#3498db';ctx.fillText(`cos = ${cosV.toFixed(4)}`,10,H-32);
    ctx.fillStyle='rgba(255,215,0,0.9)';ctx.fillText(`tan = ${Math.abs(cosV)<0.001?'∞':Math.tan(rad).toFixed(4)}`,10,H-14);
  },[]);

  useEffect(()=>{drawStatic(angle);},[angle,drawStatic]);

  const toggleAnim=()=>{
    if(animating){cancelAnimationFrame(animRef.current);setAnimating(false);return;}
    setAnimating(true);
    let a=angleRef.current;
    const loop=()=>{
      a=(a+1)%360; setAngle(a); angleRef.current=a;
      animRef.current=requestAnimationFrame(loop);
    };
    animRef.current=requestAnimationFrame(loop);
  };
  useEffect(()=>()=>cancelAnimationFrame(animRef.current),[]);

  return (
    <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
      <div style={{flex:'1 1 360px'}}>
        <canvas ref={canvasRef} width={400} height={400}
          style={{width:'100%',height:340,borderRadius:12,background:'#07071a',border:'1.5px solid rgba(255,255,255,0.07)',display:'block'}}/>
      </div>
      <div style={{flex:'0 0 220px'}}>
        <div style={{marginBottom:16}}>
          <label style={{color:'rgba(255,255,255,0.6)',fontSize:12,fontWeight:700,display:'block',marginBottom:6}}>ANGLE: {angle}°</label>
          <input type="range" min="0" max="359" value={angle} onChange={e=>{cancelAnimationFrame(animRef.current);setAnimating(false);setAngle(+e.target.value);}} style={{width:'100%',accentColor:'#9b59b6'}}/>
        </div>
        <button onClick={toggleAnim}
          style={{width:'100%',padding:'10px',borderRadius:12,border:`1.5px solid ${animating?'#e74c3c':'#9b59b6'}55`,background:animating?'rgba(231,76,60,0.15)':'rgba(155,89,182,0.15)',color:animating?'#e74c3c':'#9b59b6',fontFamily:'Space Grotesk',fontSize:13,fontWeight:700,cursor:'pointer',marginBottom:16}}>
          {animating?'⏹ Stop':'▶ Animate'}
        </button>
        {[[45],[90],[135],[180],[270],[360]].map(([a])=>(
          <button key={a} onClick={()=>{cancelAnimationFrame(animRef.current);setAnimating(false);setAngle(a);}}
            style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${angle===a?'#9b59b6':'rgba(255,255,255,0.1)'}`,background:angle===a?'rgba(155,89,182,0.2)':'rgba(255,255,255,0.03)',color:angle===a?'#9b59b6':'rgba(255,255,255,0.5)',fontFamily:'JetBrains Mono',fontSize:11,cursor:'pointer',marginRight:5,marginBottom:6}}>
            {a}°
          </button>
        ))}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:12,marginTop:12}}>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:700,marginBottom:8}}>KEY IDENTITIES</div>
          {['sin²θ + cos²θ = 1','tan θ = sin θ / cos θ','sin(90-θ) = cosθ'].map((f,i)=>(
            <div key={i} style={{color:'rgba(255,255,255,0.6)',fontFamily:'JetBrains Mono',fontSize:10,marginBottom:5}}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MODULE REGISTRY
// ══════════════════════════════════════════════════════════════════════════
const MODULE_COMPONENTS = {
  heart:      <HeartModule/>,
  cell:       <CellModule/>,
  neuron:     <NeuronModule/>,
  molecule:   <MoleculeModule/>,
  periodic:   <PeriodicModule/>,
  reaction:   <ReactionModule/>,
  projectile: <ProjectileModule/>,
  wave:       <WaveModule/>,
  pendulum:   <PendulumModule/>,
  geometry3d: <Geometry3DModule/>,
  grapher:    <GrapherModule/>,
  trigcircle: <TrigCircleModule/>,
};

// ══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function VisualLabPage() {
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeModule, setActiveModule]   = useState(null);

  const subj = SUBJECTS.find(s=>s.id===activeSubject);
  const mods  = activeSubject ? MODULES[activeSubject] : [];
  const mod   = mods.find(m=>m.id===activeModule);

  return (
    <div className="vlab-wrap" style={{ padding:'16px 20px', maxWidth:1100, margin:'0 auto', fontFamily:"'Space Grotesk',sans-serif", minHeight:'100vh' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        {/* Breadcrumb */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, color:'rgba(255,255,255,0.35)', fontSize:12 }}>
          <span style={{ cursor: activeSubject?'pointer':'default', color:activeSubject?'rgba(255,255,255,0.5)':'rgba(255,255,255,0.35)' }}
            onClick={()=>{setActiveSubject(null);setActiveModule(null);}}>🔬 Visual Lab</span>
          {activeSubject && <>
            <span>›</span>
            <span style={{ cursor:activeModule?'pointer':'default', color:activeModule?'rgba(255,255,255,0.5)':'white' }}
              onClick={()=>setActiveModule(null)}>
              {subj?.icon} {subj?.label}
            </span>
          </>}
          {activeModule && <><span>›</span><span style={{ color:subj?.color }}>{mod?.title}</span></>}
        </div>

        {!activeSubject && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
              <div style={{ fontSize:28 }}>🔬</div>
              <div>
                <div style={{ color:'white', fontSize:24, fontWeight:800, lineHeight:1 }}>Visual Lab</div>
                <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:3 }}>Interactive 3D models & animated science simulations</div>
              </div>
            </div>
          </>
        )}

        {activeSubject && !activeModule && (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28 }}>{subj?.icon}</div>
            <div>
              <div style={{ color:'white', fontSize:22, fontWeight:800 }}>{subj?.label} Lab</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>{subj?.desc} — choose a module below</div>
            </div>
          </div>
        )}

        {activeModule && (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:28 }}>{mod?.icon}</div>
            <div>
              <div style={{ color:subj?.color, fontSize:22, fontWeight:800 }}>{mod?.title}</div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>{mod?.desc}</div>
            </div>
            <button onClick={()=>setActiveModule(null)}
              style={{ marginLeft:'auto', padding:'7px 16px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.6)', fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer' }}>
              ← Back
            </button>
          </div>
        )}
      </div>

      {/* Subject grid */}
      {!activeSubject && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14, marginBottom:32 }}>
          {SUBJECTS.map(s=>(
            <div key={s.id} className="vlab-card" onClick={()=>setActiveSubject(s.id)}
              style={{ background:s.bg, border:`1.5px solid ${s.color}40`, borderRadius:18, padding:'22px 18px', cursor:'pointer' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>{s.icon}</div>
              <div style={{ color:'white', fontSize:17, fontWeight:800, marginBottom:4 }}>{s.label}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:14, lineHeight:1.5 }}>{s.desc}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {MODULES[s.id].map(m=>(
                  <span key={m.id} style={{ background:`${s.color}18`, border:`1px solid ${s.color}30`, borderRadius:8, padding:'3px 9px', color:s.color, fontSize:10, fontWeight:700 }}>{m.title}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Module grid */}
      {activeSubject && !activeModule && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {mods.map(m=>(
            <div key={m.id} className="vlab-mod-btn" onClick={()=>setActiveModule(m.id)}
              style={{ background:'rgba(255,255,255,0.03)', border:`1.5px solid ${subj?.color}30`, borderRadius:16, padding:'22px 18px', cursor:'pointer' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{m.icon}</div>
              <div style={{ color:'white', fontSize:16, fontWeight:800, marginBottom:6 }}>{m.title}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.5, marginBottom:14 }}>{m.desc}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${subj?.color}20`, border:`1px solid ${subj?.color}40`, borderRadius:8, padding:'5px 12px', color:subj?.color, fontSize:12, fontWeight:700 }}>
                Open Module →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active module */}
      {activeModule && (
        <div className="vlab-fadein" style={{ background:'rgba(255,255,255,0.02)', border:`1.5px solid ${subj?.color}25`, borderRadius:20, padding:24 }}>
          {MODULE_COMPONENTS[activeModule]}
        </div>
      )}

      {/* Bottom info strip */}
      {!activeModule && (
        <div style={{ marginTop:32, padding:'14px 20px', background:'rgba(255,255,255,0.02)', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>🔬 Visual Lab</div>
          {[['12','Interactive Modules'],['4','Subjects'],['100%','Browser Native'],['0','Extra Installs']].map(([v,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ color:'#ffd700', fontWeight:800, fontSize:14 }}>{v}</span>
              <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
