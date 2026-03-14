/**
 * AR Routes — SamarthaaEdu
 *
 * GET /api/ar/model/:id   → serves a procedurally-generated GLB binary
 * GET /ar/:id             → serves a standalone HTML page with <model-viewer>
 *
 * This bypass-React architecture is required because:
 * 1. model-viewer needs a real HTTPS URL (not data: or blob:) for iOS Quick Look
 * 2. React's DOM management conflicts with model-viewer's custom element lifecycle
 * 3. A standalone HTML page has no CSP / re-render / timing issues
 */

import express from 'express';
const router = express.Router();

// ── Minimal GLB geometry builders (same logic as client) ──────────────────
function makeSphere(cx=0,cy=0,cz=0, r=0.04, rows=12, cols=12) {
  const pos=[], idx=[];
  for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
    const theta=Math.PI*i/rows, phi=2*Math.PI*j/cols;
    pos.push(cx+r*Math.sin(theta)*Math.cos(phi), cy+r*Math.cos(theta), cz+r*Math.sin(theta)*Math.sin(phi));
  }
  for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) {
    const a=i*(cols+1)+j, b=a+1, c=a+(cols+1), d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  return { positions:new Float32Array(pos), indices:new Uint16Array(idx) };
}

function makeCylinder(x1,y1,z1, x2,y2,z2, r=0.008, segs=8) {
  const dx=x2-x1,dy=y2-y1,dz=z2-z1, len=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(len<0.0001) return null;
  const pos=[], idx=[];
  for(let i=0;i<=segs;i++) {
    const a=2*Math.PI*i/segs, px=Math.cos(a)*r, pz=Math.sin(a)*r;
    pos.push(x1+px,y1,z1+pz, x2+px,y2,z2+pz);
  }
  for(let i=0;i<segs;i++) { const b=i*2; idx.push(b,b+1,b+2,b+1,b+3,b+2); }
  return { positions:new Float32Array(pos), indices:new Uint16Array(idx) };
}

function makeTorus(cx=0,cy=0,cz=0, R=0.05,r=0.015, segs=20, rings=10) {
  const pos=[], idx=[];
  for(let i=0;i<=rings;i++) for(let j=0;j<=segs;j++) {
    const u=2*Math.PI*j/segs, v=2*Math.PI*i/rings;
    pos.push(cx+(R+r*Math.cos(v))*Math.cos(u), cy+r*Math.sin(v), cz+(R+r*Math.cos(v))*Math.sin(u));
  }
  for(let i=0;i<rings;i++) for(let j=0;j<segs;j++) {
    const a=i*(segs+1)+j, b=a+1, c=a+(segs+1), d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  return { positions:new Float32Array(pos), indices:new Uint16Array(idx) };
}

function makeBox(cx=0,cy=0,cz=0, w=0.08,h=0.08,d=0.08) {
  const hw=w/2,hh=h/2,hd=d/2;
  const pos=new Float32Array([
    cx-hw,cy-hh,cz+hd,cx+hw,cy-hh,cz+hd,cx+hw,cy+hh,cz+hd,cx-hw,cy+hh,cz+hd,
    cx+hw,cy-hh,cz-hd,cx-hw,cy-hh,cz-hd,cx-hw,cy+hh,cz-hd,cx+hw,cy+hh,cz-hd,
    cx-hw,cy-hh,cz-hd,cx-hw,cy-hh,cz+hd,cx-hw,cy+hh,cz+hd,cx-hw,cy+hh,cz-hd,
    cx+hw,cy-hh,cz+hd,cx+hw,cy-hh,cz-hd,cx+hw,cy+hh,cz-hd,cx+hw,cy+hh,cz+hd,
    cx-hw,cy+hh,cz+hd,cx+hw,cy+hh,cz+hd,cx+hw,cy+hh,cz-hd,cx-hw,cy+hh,cz-hd,
    cx-hw,cy-hh,cz-hd,cx+hw,cy-hh,cz-hd,cx+hw,cy-hh,cz+hd,cx-hw,cy-hh,cz+hd,
  ]);
  return { positions:pos, indices:new Uint16Array([0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23]) };
}

// ── Model generators ──────────────────────────────────────────────────────
const GENERATORS = {
  heart() {
    const m = [];
    m.push({...makeSphere(0,0,0,0.055,16,16),color:[0.85,0.15,0.18]});
    m.push({...makeSphere(-0.02,-0.025,0.01,0.038,10,10),color:[0.75,0.1,0.12]});
    m.push({...makeSphere(0.02,-0.025,0.01,0.032,10,10),color:[0.5,0.25,0.7]});
    m.push({...makeSphere(-0.02,0.03,0,0.028,10,10),color:[0.9,0.3,0.3]});
    m.push({...makeSphere(0.02,0.03,0,0.025,10,10),color:[0.4,0.4,0.85]});
    const a=makeCylinder(-0.01,0.05,0,-0.01,0.13,0.01,0.012); if(a) m.push({...a,color:[0.9,0.2,0.2]});
    const p=makeCylinder(0.01,0.05,0,0.04,0.11,0,0.009); if(p) m.push({...p,color:[0.4,0.4,0.9]});
    return m;
  },
  cell() {
    const m = [];
    m.push({...makeSphere(0,0,0,0.09,16,16),color:[0.3,0.75,0.4]});
    m.push({...makeSphere(0,0,0,0.035,12,12),color:[0.85,0.2,0.2]});
    [[0.055,0.03,0.02],[-0.055,-0.04,0.01],[-0.04,0.05,-0.02]].forEach(([x,y,z])=>m.push({...makeSphere(x,y,z,0.018,8,8),color:[0.95,0.6,0.1]}));
    [0.03,0.04,0.05].forEach(y=>m.push({...makeTorus(-0.04,y,0,0.022,0.004,12,6),color:[0.6,0.2,0.85]}));
    m.push({...makeSphere(0.04,-0.04,0.03,0.022,8,8),color:[0.2,0.7,0.3]});
    return m;
  },
  neuron() {
    const m = [];
    m.push({...makeSphere(0,0,0,0.025,12,12),color:[0.6,0.3,0.85]});
    m.push({...makeSphere(0,0,0,0.012,8,8),color:[0.85,0.2,0.2]});
    const ax=makeCylinder(0.025,0,0,0.18,0,0,0.006); if(ax) m.push({...ax,color:[0.3,0.6,0.9]});
    for(let i=0;i<5;i++){const x=0.04+i*0.028;const sh=makeCylinder(x,0,0,x+0.016,0,0,0.012);if(sh)m.push({...sh,color:[0.95,0.9,0.3]});}
    m.push({...makeSphere(0.185,0,0,0.018,8,8),color:[0.2,0.85,0.5]});
    [[-0.03,0.03,0],[-0.03,-0.03,0],[-0.03,0.01,0.025],[-0.03,-0.01,-0.025]].forEach(([dx,dy,dz])=>{const d=makeCylinder(-0.025,0,0,-0.025+dx*3,dy*3,dz*3,0.005);if(d)m.push({...d,color:[0.7,0.4,0.9]});});
    return m;
  },
  water() {
    const m = [], ang=104.5*Math.PI/180, bl=0.065;
    m.push({...makeSphere(0,0,0,0.028,12,12),color:[0.9,0.1,0.1]});
    m.push({...makeSphere(bl*Math.cos(ang/2),bl*Math.sin(ang/2),0,0.016,10,10),color:[0.92,0.92,0.95]});
    m.push({...makeSphere(-bl*Math.cos(ang/2),bl*Math.sin(ang/2),0,0.016,10,10),color:[0.92,0.92,0.95]});
    const b1=makeCylinder(0,0,0,bl*Math.cos(ang/2),bl*Math.sin(ang/2),0,0.006); if(b1) m.push({...b1,color:[0.7,0.7,0.75]});
    const b2=makeCylinder(0,0,0,-bl*Math.cos(ang/2),bl*Math.sin(ang/2),0,0.006); if(b2) m.push({...b2,color:[0.7,0.7,0.75]});
    return m;
  },
  dna() {
    const m=[], turns=3, segs=60, rad=0.035, ht=0.18;
    for(let s=0;s<2;s++){
      const ph=s*Math.PI;
      for(let i=0;i<segs;i++){
        const t=i/(segs-1), angle=2*Math.PI*turns*t+ph;
        const x=rad*Math.cos(angle), y=ht*t-ht/2, z=rad*Math.sin(angle);
        m.push({...makeSphere(x,y,z,0.008,6,6),color:s===0?[0.9,0.2,0.2]:[0.2,0.4,0.9]});
        if(i%6===0&&s===0){const a2=angle+Math.PI,x2=rad*Math.cos(a2),z2=rad*Math.sin(a2);const bp=makeCylinder(x,y,z,x2,y,z2,0.004);if(bp)m.push({...bp,color:[0.3,0.8,0.3]});}
      }
    }
    return m;
  },
  crystal() {
    const m=[], sp=0.04, cols=[[0.9,0.3,0.3],[0.3,0.3,0.9]];
    for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++){
      m.push({...makeSphere(x*sp,y*sp,z*sp,(x+y+z)%2===0?0.012:0.016,8,8),color:cols[(x+y+z)%2===0?0:1]});
    }
    for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++){
      [[1,0,0],[0,1,0],[0,0,1]].forEach(([dx,dy,dz])=>{if(x+dx<=1&&y+dy<=1&&z+dz<=1){const b=makeCylinder(x*sp,y*sp,z*sp,(x+dx)*sp,(y+dy)*sp,(z+dz)*sp,0.003);if(b)m.push({...b,color:[0.7,0.7,0.7]});}});
    }
    return m;
  },
  projectile() {
    const m=[];
    for(let i=0;i<30;i++){const t=i/29,x=-0.1+0.2*t,y=0.08*4*t*(1-t);m.push({...makeSphere(x,y,0,i===0||i===29?0.012:0.005,6,6),color:i===0?[0.9,0.7,0.1]:[0.9,0.5,0.1]});}
    m.push({...makeBox(0,-0.005,0,0.25,0.002,0.04),color:[0.3,0.6,0.3]});
    return m;
  },
  wave() {
    const m=[], rows=20, cols=30, W=0.22, D=0.12, pos=[], idx=[];
    for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++){const x=-W/2+W*j/cols,z=-D/2+D*i/rows;pos.push(x,0.025*Math.sin(2*Math.PI*3*j/cols)+0.018*Math.sin(2*Math.PI*2*j/cols+1.2),z);}
    for(let i=0;i<rows;i++) for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+1,c=a+(cols+1),d=c+1;idx.push(a,c,b,b,c,d);}
    m.push({positions:new Float32Array(pos),indices:new Uint16Array(idx),color:[0.2,0.5,0.9]});
    return m;
  },
  pendulum() {
    const m=[];
    const s=makeCylinder(0,0.12,0,0.06,-0.06,0,0.003); if(s) m.push({...s,color:[0.7,0.6,0.4]});
    m.push({...makeSphere(0,0.12,0,0.01,8,8),color:[0.7,0.7,0.7]});
    m.push({...makeSphere(0.06,-0.06,0,0.025,12,12),color:[0.95,0.6,0.1]});
    const bar=makeCylinder(-0.05,0.13,0,0.05,0.13,0,0.006); if(bar) m.push({...bar,color:[0.5,0.5,0.55]});
    return m;
  },
  cube() {
    const m=[{...makeBox(0,0,0,0.1,0.1,0.1),color:[0.2,0.5,0.9]}];
    const s=0.05;
    [[-s,-s,-s,s,-s,-s],[-s,s,-s,s,s,-s],[-s,-s,s,s,-s,s],[-s,s,s,s,s,s],
     [-s,-s,-s,-s,s,-s],[s,-s,-s,s,s,-s],[-s,-s,s,-s,s,s],[s,-s,s,s,s,s],
     [-s,-s,-s,-s,-s,s],[s,-s,-s,s,-s,s],[-s,s,-s,-s,s,s],[s,s,-s,s,s,s]].forEach(([x1,y1,z1,x2,y2,z2])=>{
       const e=makeCylinder(x1,y1,z1,x2,y2,z2,0.003); if(e) m.push({...e,color:[0.9,0.9,0.95]});
     });
    return m;
  },
  sphere() {
    const m=[{...makeSphere(0,0,0,0.07,20,20),color:[0.85,0.15,0.2]}];
    m.push({...makeTorus(0,0,0,0.07,0.003,24,6),color:[0.95,0.85,0.2]});
    const mer=makeTorus(0,0,0,0.07,0.003,24,6);
    const rp=new Float32Array(mer.positions.length);
    for(let i=0;i<mer.positions.length;i+=3){rp[i]=mer.positions[i+1];rp[i+1]=-mer.positions[i];rp[i+2]=mer.positions[i+2];}
    m.push({positions:rp,indices:mer.indices,color:[0.2,0.7,0.95]});
    return m;
  },
  torus() {
    return [{...makeTorus(0,0,0,0.065,0.022,28,14),color:[0.7,0.2,0.9]}];
  },
};

// ── GLB binary builder ────────────────────────────────────────────────────
function buildGLBBuffer(meshes) {
  const accessors=[], bufferViews=[], meshDefs=[], materials=[], nodes=[];
  const chunks=[];
  let offset=0;

  meshes.forEach((mesh,mi)=>{
    const pos = mesh.positions instanceof Float32Array ? mesh.positions : new Float32Array(mesh.positions);
    const idx = mesh.indices  instanceof Uint16Array  ? mesh.indices   : new Uint16Array(mesh.indices);
    const [r,g,b] = mesh.color || [0.8,0.8,0.8];

    // Use pos.byteLength (not pos.buffer.byteLength) — the buffer may be larger if
    // the TypedArray is a slice/view. Same for idx.
    const posBuf = Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength);
    const idxBuf = Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength);
    const ipad   = idx.byteLength % 4 === 0 ? 0 : 4 - (idx.byteLength % 4);

    // bufferView index for positions = current bufferViews.length BEFORE push
    const bvPos = bufferViews.length;
    chunks.push(posBuf);
    bufferViews.push({buffer:0, byteOffset:offset, byteLength:pos.byteLength, target:34962});
    offset += pos.byteLength;

    // bufferView index for indices = current bufferViews.length BEFORE push
    const bvIdx = bufferViews.length;
    chunks.push(idxBuf);
    bufferViews.push({buffer:0, byteOffset:offset, byteLength:idx.byteLength, target:34963});
    offset += idx.byteLength + ipad;
    if (ipad > 0) chunks.push(Buffer.alloc(ipad));

    // Compute bounding box
    let mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<pos.length;i+=3){
      mn[0]=Math.min(mn[0],pos[i]);   mx[0]=Math.max(mx[0],pos[i]);
      mn[1]=Math.min(mn[1],pos[i+1]); mx[1]=Math.max(mx[1],pos[i+1]);
      mn[2]=Math.min(mn[2],pos[i+2]); mx[2]=Math.max(mx[2],pos[i+2]);
    }

    // Accessor indices = current accessors.length BEFORE each push
    const accPos = accessors.length;
    accessors.push({bufferView:bvPos, componentType:5126, count:pos.length/3, type:'VEC3', min:mn, max:mx});
    const accIdx = accessors.length;
    accessors.push({bufferView:bvIdx, componentType:5123, count:idx.length, type:'SCALAR'});

    materials.push({pbrMetallicRoughness:{baseColorFactor:[r,g,b,1],metallicFactor:0.1,roughnessFactor:0.6},doubleSided:true});
    meshDefs.push({primitives:[{attributes:{POSITION:accPos}, indices:accIdx, material:mi}]});
    nodes.push({mesh:mi});
  });

  const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:meshDefs,accessors,bufferViews,materials,buffers:[{byteLength:offset}]};
  const js=JSON.stringify(json);
  const jp=js.length%4===0?0:4-(js.length%4);
  const jb=Buffer.from(js+' '.repeat(jp));
  const bin=Buffer.concat(chunks);
  const total=12+8+jb.length+8+bin.length;
  const out=Buffer.alloc(total);
  let o=0;
  out.writeUInt32LE(0x46546C67,o);o+=4; // glTF
  out.writeUInt32LE(2,o);o+=4;
  out.writeUInt32LE(total,o);o+=4;
  out.writeUInt32LE(jb.length,o);o+=4;
  out.writeUInt32LE(0x4E4F534A,o);o+=4; // JSON
  jb.copy(out,o);o+=jb.length;
  out.writeUInt32LE(bin.length,o);o+=4;
  out.writeUInt32LE(0x004E4942,o);o+=4; // BIN
  bin.copy(out,o);
  return out;
}

// ── Model metadata ────────────────────────────────────────────────────────
const MODEL_META = {
  heart:      { label:'Human Heart',      color:'#e74c3c' },
  cell:       { label:'Animal Cell',      color:'#27ae60' },
  neuron:     { label:'Neuron',           color:'#9b59b6' },
  water:      { label:'H₂O Molecule',    color:'#3498db' },
  dna:        { label:'DNA Double Helix', color:'#e74c3c' },
  crystal:    { label:'NaCl Crystal',     color:'#f39c12' },
  projectile: { label:'Projectile Arc',   color:'#f39c12' },
  wave:       { label:'Wave',             color:'#3498db' },
  pendulum:   { label:'Pendulum',         color:'#27ae60' },
  cube:       { label:'Cube',             color:'#3498db' },
  sphere:     { label:'Sphere',           color:'#e74c3c' },
  torus:      { label:'Torus',            color:'#9b59b6' },
};

// ── GET /api/ar/model/:id  → serve raw GLB binary ─────────────────────────
router.get('/model/:id', (req, res) => {
  const { id } = req.params;
  const gen = GENERATORS[id];
  if (!gen) return res.status(404).json({ error: 'Model not found' });
  try {
    const meshes = gen();
    const glb = buildGLBBuffer(meshes);
    res.set({
      'Content-Type': 'model/gltf-binary',
      'Content-Disposition': `inline; filename="${id}.glb"`,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    res.send(glb);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /ar/view/:id  → standalone HTML page with embedded GLB ─────────────
// The GLB binary is base64-encoded and embedded directly in the HTML page.
// This eliminates ALL URL/env/CORS/proxy issues — no external fetch needed.
router.get('/view/:id', (req, res) => {
  const { id } = req.params;
  const meta = MODEL_META[id];
  const gen  = GENERATORS[id];
  if (!meta || !gen) return res.status(404).send(`<h2 style="color:white;padding:2rem">Model "${id}" not found</h2>`);

  let glbBase64;
  try {
    const meshes = gen();
    const glbBuf = buildGLBBuffer(meshes);
    glbBase64 = glbBuf.toString('base64');
  } catch(e) {
    return res.status(500).send(`<h2 style="color:red;padding:2rem">Error: ${e.message}</h2>`);
  }

  const backUrl = (process.env.CLIENT_URL || 'https://samarthaaedu.netlify.app') + '/ar-lab';
  const color   = meta.color || '#ffd700';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <title>${meta.label} — AR</title>
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;overflow:hidden;background:#050510}
    model-viewer{width:100%;height:100svh;background:linear-gradient(135deg,#050510,#0a0a1f);--poster-color:transparent}
    #ar-btn{background:${color};border:none;border-radius:16px;padding:14px 28px;color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,0.5);display:inline-flex;align-items:center;gap:10px}
    #back{position:fixed;top:max(env(safe-area-inset-top,0px),16px);left:16px;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:10px 18px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;z-index:200;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
    #lbl{position:fixed;top:max(env(safe-area-inset-top,0px),16px);left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:8px 20px;color:#fff;font-size:14px;font-weight:700;white-space:nowrap;z-index:200;pointer-events:none;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
    #st{position:fixed;bottom:110px;left:0;right:0;text-align:center;color:rgba(255,255,255,0.55);font-size:13px;pointer-events:none;z-index:100}
  </style>
</head>
<body>
  <a href="${backUrl}" id="back">← Back</a>
  <div id="lbl">${meta.label}</div>
  <div id="st">Decoding 3D model…</div>
  <model-viewer id="mv" alt="${meta.label}" ar ar-modes="quick-look webxr scene-viewer" ar-scale="auto" camera-controls auto-rotate auto-rotate-delay="1500" rotation-per-second="15deg" shadow-intensity="1" exposure="1.1" environment-image="neutral">
    <button slot="ar-button" id="ar-btn">🌍&nbsp; View in AR</button>
  </model-viewer>
  <script>
    const GLB = "${glbBase64}";
    const mv = document.getElementById('mv');
    const st = document.getElementById('st');
    customElements.whenDefined('model-viewer').then(() => {
      st.textContent = 'Loading 3D model…';
      try {
        const bin = atob(GLB);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const blobUrl = URL.createObjectURL(new Blob([buf], {type:'model/gltf-binary'}));
        mv.src = blobUrl;
      } catch(e) { st.textContent = 'Decode error: ' + e.message; }
    });
    mv.addEventListener('load', () => {
      st.textContent = mv.canActivateAR ? 'Tap "View in AR" to place in your room ↗' : '3D model ready — drag to rotate';
    });
    mv.addEventListener('error', e => {
      const msg = e.detail?.sourceError?.message || e.detail?.message || 'unknown';
      st.textContent = 'Load error: ' + msg;
      console.error('[AR]', e.detail);
    });
    mv.addEventListener('ar-status', e => { console.log('[AR]', e.detail.status); });
  </script>
</body>
</html>`);
});

export default router;
