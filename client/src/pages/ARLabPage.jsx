import { useState, useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────
   AR LAB — SamarthaaEdu
   Google <model-viewer> + Three.js procedural GLB generation
   
   How it works:
   1. Three.js builds 3D geometry for each subject in-browser
   2. GLTFExporter converts it to a .glb binary blob
   3. URL.createObjectURL() creates a local URL
   4. <model-viewer> renders the model with AR button
   5. On Android → WebXR / Scene Viewer places it in real space
   6. On iOS    → model-viewer auto-converts to USDZ for Quick Look AR
   
   Zero external model files required. Works offline.
───────────────────────────────────────────────────────────────── */

// ── Subject catalogue ──────────────────────────────────────────────────
const SUBJECTS = [
  { id:'anatomy',   icon:'🫀', label:'Anatomy',     color:'#e74c3c', bg:'rgba(231,76,60,0.12)' },
  { id:'chemistry', icon:'⚗️',  label:'Chemistry',   color:'#3498db', bg:'rgba(52,152,219,0.12)' },
  { id:'physics',   icon:'⚡',  label:'Physics',     color:'#f39c12', bg:'rgba(243,156,18,0.12)' },
  { id:'math',      icon:'📐',  label:'Mathematics', color:'#9b59b6', bg:'rgba(155,89,182,0.12)' },
];

const MODELS = {
  anatomy: [
    { id:'heart',  label:'Human Heart',    icon:'🫀', desc:'4-chamber heart with aorta & vessels', color:'#e74c3c',
      hotspots:[{pos:'0 0.05m 0',normal:'0 1 0',label:'Left Ventricle'},{pos:'0.03m 0.08m 0',normal:'1 0 0',label:'Aorta'}] },
    { id:'cell',   label:'Animal Cell',    icon:'🔬', desc:'Nucleus, mitochondria & organelles', color:'#27ae60',
      hotspots:[{pos:'0 0 0',normal:'0 0 1',label:'Nucleus'},{pos:'0.04m 0.02m 0',normal:'1 0 0',label:'Mitochondria'}] },
    { id:'neuron', label:'Neuron',         icon:'🧠', desc:'Axon, myelin sheath & dendrites', color:'#9b59b6',
      hotspots:[{pos:'-0.1m 0 0',normal:'-1 0 0',label:'Dendrites'},{pos:'0.1m 0 0',normal:'1 0 0',label:'Axon Terminal'}] },
  ],
  chemistry: [
    { id:'water',   label:'H₂O Molecule',  icon:'💧', desc:'Water: bent polar covalent bond', color:'#3498db',
      hotspots:[{pos:'0 0.02m 0',normal:'0 1 0',label:'Oxygen'},{pos:'0.025m -0.01m 0',normal:'1 0 0',label:'Hydrogen'}] },
    { id:'dna',     label:'DNA Double Helix', icon:'🧬', desc:'Watson-Crick double helix structure', color:'#e74c3c',
      hotspots:[{pos:'0 0.06m 0',normal:'0 1 0',label:'Base Pair'},{pos:'0.02m 0 0',normal:'1 0 0',label:'Sugar-Phosphate Backbone'}] },
    { id:'crystal', label:'NaCl Crystal',  icon:'🔷', desc:'Ionic lattice: Na⁺ and Cl⁻ ions', color:'#f39c12',
      hotspots:[{pos:'0 0 0',normal:'0 1 0',label:'Na⁺ Ion'},{pos:'0.03m 0 0',normal:'1 0 0',label:'Cl⁻ Ion'}] },
  ],
  physics: [
    { id:'projectile', label:'Projectile Arc', icon:'🎯', desc:'Parabolic trajectory in 3D space', color:'#f39c12',
      hotspots:[{pos:'-0.08m 0 0',normal:'-1 0 0',label:'Launch Point'},{pos:'0 0.05m 0',normal:'0 1 0',label:'Peak Height'}] },
    { id:'wave',      label:'Wave Interference', icon:'〰️', desc:'Two-wave superposition surface', color:'#3498db',
      hotspots:[{pos:'-0.05m 0 0',normal:'-1 0 0',label:'Wave 1'},{pos:'0.05m 0 0',normal:'1 0 0',label:'Wave 2'}] },
    { id:'pendulum',  label:'Pendulum',     icon:'⏱️', desc:'Simple harmonic motion bob & string', color:'#27ae60',
      hotspots:[{pos:'0 0.08m 0',normal:'0 1 0',label:'Pivot'},{pos:'0.04m -0.06m 0',normal:'1 0 0',label:'Bob'}] },
  ],
  math: [
    { id:'cube',    label:'Cube',          icon:'📦', desc:'Regular hexahedron: 6 faces, 12 edges', color:'#3498db',
      hotspots:[{pos:'0.04m 0.04m 0.04m',normal:'1 1 1',label:'Vertex'},{pos:'0 0.04m 0',normal:'0 1 0',label:'Face'}] },
    { id:'sphere',  label:'Sphere',        icon:'🔵', desc:'Every point equidistant from centre', color:'#e74c3c',
      hotspots:[{pos:'0 0.04m 0',normal:'0 1 0',label:'North Pole'},{pos:'0.04m 0 0',normal:'1 0 0',label:'Equator'}] },
    { id:'torus',   label:'Torus / Donut', icon:'🍩', desc:'Surface of revolution — topology', color:'#9b59b6',
      hotspots:[{pos:'0.05m 0 0',normal:'1 0 0',label:'Outer Radius'},{pos:'0.02m 0 0',normal:'1 0 0',label:'Inner Radius'}] },
  ],
};

// ══════════════════════════════════════════════════════════════════════════
//  MINIMAL GLB WRITER
//  Returns a base64 data: URI — iOS Quick Look REQUIRES this format.
//  blob: URLs are blocked by Apple's AR Quick Look security policy.
//  Each mesh: { positions: Float32Array, indices: Uint16Array, color: [r,g,b] }
// ══════════════════════════════════════════════════════════════════════════
function buildGLBDataURI(meshes) {
  // We'll create one node per mesh, each with its own material
  const accessors = [], bufferViews = [], meshDefs = [], materials = [], nodes = [];
  const buffers = [];
  let bufferOffset = 0;

  meshes.forEach((mesh, mi) => {
    const pos = mesh.positions instanceof Float32Array ? mesh.positions : new Float32Array(mesh.positions);
    const idx = mesh.indices instanceof Uint16Array ? mesh.indices : new Uint16Array(mesh.indices);
    const [r, g, b] = mesh.color || [0.8, 0.8, 0.8];

    // Pad to 4-byte boundary
    const posBytes = pos.buffer.byteLength || pos.byteLength;
    const idxBytes = idx.buffer.byteLength || idx.byteLength;
    const idxPad   = idxBytes % 4 === 0 ? 0 : 4 - (idxBytes % 4);

    buffers.push(Buffer.from ? Buffer.from(pos.buffer) : pos.buffer);
    const bvPos = bufferViews.length;
    bufferViews.push({ buffer:0, byteOffset:bufferOffset, byteLength:posBytes, target:34962 });
    bufferOffset += posBytes;

    buffers.push(idx.buffer);
    const bvIdx = bufferViews.length;
    bufferViews.push({ buffer:0, byteOffset:bufferOffset, byteLength:idxBytes, target:34963 });
    bufferOffset += idxBytes + idxPad;
    if (idxPad > 0) buffers.push(new ArrayBuffer(idxPad));

    // Compute min/max of positions
    let minPos = [Infinity,Infinity,Infinity], maxPos = [-Infinity,-Infinity,-Infinity];
    for (let i=0;i<pos.length;i+=3) {
      minPos[0]=Math.min(minPos[0],pos[i]);   maxPos[0]=Math.max(maxPos[0],pos[i]);
      minPos[1]=Math.min(minPos[1],pos[i+1]); maxPos[1]=Math.max(maxPos[1],pos[i+1]);
      minPos[2]=Math.min(minPos[2],pos[i+2]); maxPos[2]=Math.max(maxPos[2],pos[i+2]);
    }

    const accPos = accessors.length;
    accessors.push({ bufferView:bvPos, componentType:5126, count:pos.length/3, type:'VEC3', min:minPos, max:maxPos });
    const accIdx = accessors.length;
    accessors.push({ bufferView:bvIdx, componentType:5123, count:idx.length, type:'SCALAR' });

    const matIdx = materials.length;
    materials.push({ pbrMetallicRoughness:{ baseColorFactor:[r,g,b,1], metallicFactor:0.1, roughnessFactor:0.6 }, doubleSided:true });

    meshDefs.push({ primitives:[{ attributes:{ POSITION:accPos }, indices:accIdx, material:matIdx }] });
    nodes.push({ mesh:mi });
  });

  const json = {
    asset:{ version:'2.0', generator:'SamarthaaEdu-ARLab' },
    scene:0,
    scenes:[{ nodes:nodes.map((_,i)=>i) }],
    nodes,
    meshes:meshDefs,
    accessors,
    bufferViews,
    materials,
    buffers:[{ byteLength:bufferOffset }],
  };

  const jsonStr  = JSON.stringify(json);
  const jsonPad  = jsonStr.length%4===0 ? 0 : 4-(jsonStr.length%4);
  const jsonBuf  = new TextEncoder().encode(jsonStr + ' '.repeat(jsonPad));

  // Concatenate all binary buffers
  const totalBin = bufferOffset;
  const binBuf   = new Uint8Array(totalBin);
  let   binOff   = 0;
  buffers.forEach(b => {
    const arr = b instanceof ArrayBuffer ? new Uint8Array(b) : new Uint8Array(b.buffer || b);
    binBuf.set(arr, binOff);
    binOff += arr.byteLength;
  });
  const binPad = totalBin%4===0 ? 0 : 4-(totalBin%4);
  const binPadBuf = new Uint8Array(binPad);

  // GLB header: magic, version, total length
  const totalLen = 12 + 8 + jsonBuf.length + 8 + totalBin + binPad;
  const header   = new ArrayBuffer(12);
  const hv       = new DataView(header);
  hv.setUint32(0, 0x46546C67, true); // 'glTF'
  hv.setUint32(4, 2, true);
  hv.setUint32(8, totalLen, true);

  const jsonChunkHeader = new ArrayBuffer(8);
  const jch = new DataView(jsonChunkHeader);
  jch.setUint32(0, jsonBuf.length, true);
  jch.setUint32(4, 0x4E4F534A, true); // 'JSON'

  const binChunkHeader = new ArrayBuffer(8);
  const bch = new DataView(binChunkHeader);
  bch.setUint32(0, totalBin + binPad, true);
  bch.setUint32(4, 0x004E4942, true); // 'BIN\0'

  const out = new Uint8Array(totalLen);
  let off = 0;
  const write = arr => { out.set(new Uint8Array(arr instanceof ArrayBuffer ? arr : arr.buffer || arr), off); off += arr.byteLength || arr.length; };
  write(header); write(jsonChunkHeader); write(jsonBuf);
  write(binChunkHeader); write(binBuf); write(binPadBuf);

  // Convert to base64 data URI — iOS Quick Look requires this, not blob: URLs
  let binary = '';
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return 'data:model/gltf-binary;base64,' + btoa(binary);
}

// ══════════════════════════════════════════════════════════════════════════
//  3D MODEL GENERATORS
//  Each returns an array of mesh descriptors for buildGLBDataURI()
// ══════════════════════════════════════════════════════════════════════════

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
  const dx=x2-x1,dy=y2-y1,dz=z2-z1;
  const len=Math.sqrt(dx*dx+dy*dy+dz*dz);
  if(len<0.0001) return null;
  const ux=-dz/len, uz=dx/len; // perpendicular in xz
  const pos=[], idx=[];
  for(let i=0;i<=segs;i++) {
    const a=2*Math.PI*i/segs;
    const px=Math.cos(a)*r, pz=Math.sin(a)*r;
    const wx=px*Math.cos(0)-pz*Math.sin(0), wz=px*Math.sin(0)+pz*Math.cos(0);
    pos.push(x1+wx,y1,z1+wz, x2+wx,y2,z2+wz);
  }
  for(let i=0;i<segs;i++) {
    const b=i*2; idx.push(b,b+1,b+2, b+1,b+3,b+2);
  }
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
    cx-hw,cy-hh,cz+hd, cx+hw,cy-hh,cz+hd, cx+hw,cy+hh,cz+hd, cx-hw,cy+hh,cz+hd, // front
    cx+hw,cy-hh,cz-hd, cx-hw,cy-hh,cz-hd, cx-hw,cy+hh,cz-hd, cx+hw,cy+hh,cz-hd, // back
    cx-hw,cy-hh,cz-hd, cx-hw,cy-hh,cz+hd, cx-hw,cy+hh,cz+hd, cx-hw,cy+hh,cz-hd, // left
    cx+hw,cy-hh,cz+hd, cx+hw,cy-hh,cz-hd, cx+hw,cy+hh,cz-hd, cx+hw,cy+hh,cz+hd, // right
    cx-hw,cy+hh,cz+hd, cx+hw,cy+hh,cz+hd, cx+hw,cy+hh,cz-hd, cx-hw,cy+hh,cz-hd, // top
    cx-hw,cy-hh,cz-hd, cx+hw,cy-hh,cz-hd, cx+hw,cy-hh,cz+hd, cx-hw,cy-hh,cz+hd, // bottom
  ]);
  const idx=new Uint16Array([0,1,2,0,2,3, 4,5,6,4,6,7, 8,9,10,8,10,11, 12,13,14,12,14,15, 16,17,18,16,18,19, 20,21,22,20,22,23]);
  return { positions:pos, indices:idx };
}

// ── Per-model GLB generators ───────────────────────────────────────────
const MODEL_GENERATORS = {
  // ANATOMY
  heart() {
    const meshes = [];
    // Main heart body (large torus-like shape)
    const body = makeSphere(0,0,0, 0.055, 16,16);
    meshes.push({ ...body, color:[0.85,0.15,0.18] });
    // Left ventricle (larger lower bulge)
    const lv = makeSphere(-0.02,-0.025,0.01, 0.038, 10,10);
    meshes.push({ ...lv, color:[0.75,0.1,0.12] });
    // Right ventricle
    const rv = makeSphere(0.02,-0.025,0.01, 0.032, 10,10);
    meshes.push({ ...rv, color:[0.5,0.25,0.7] });
    // Left atrium
    const la = makeSphere(-0.02,0.03,0, 0.028, 10,10);
    meshes.push({ ...la, color:[0.9,0.3,0.3] });
    // Right atrium
    const ra = makeSphere(0.02,0.03,0, 0.025, 10,10);
    meshes.push({ ...ra, color:[0.4,0.4,0.85] });
    // Aorta (cylinder going up)
    const aorta = makeCylinder(-0.01,0.05,0, -0.01,0.13,0.01, 0.012);
    if(aorta) meshes.push({ ...aorta, color:[0.9,0.2,0.2] });
    // Pulmonary artery
    const pa = makeCylinder(0.01,0.05,0, 0.04,0.11,0, 0.009);
    if(pa) meshes.push({ ...pa, color:[0.4,0.4,0.9] });
    return meshes;
  },

  cell() {
    const meshes = [];
    // Cell membrane (large transparent-ish sphere)
    const membrane = makeSphere(0,0,0, 0.09, 16,16);
    meshes.push({ ...membrane, color:[0.3,0.75,0.4] });
    // Nucleus (large central sphere)
    const nucleus = makeSphere(0,0,0, 0.035, 12,12);
    meshes.push({ ...nucleus, color:[0.85,0.2,0.2] });
    // Nucleolus
    const nucleolus = makeSphere(0.01,0.01,0, 0.012, 8,8);
    meshes.push({ ...nucleolus, color:[0.6,0.1,0.1] });
    // Mitochondria (oval spheres)
    [[0.055,0.03,0.02],[−0.055,-0.04,0.01],[-0.04,0.05,-0.02]].forEach(([x,y,z])=>{
      const m = makeSphere(x||0,y,z, 0.018, 8,8);
      meshes.push({ ...m, color:[0.95,0.6,0.1] });
    });
    // Golgi (small stacked discs via thin tori)
    [0.03,0.04,0.05].forEach((y,i)=>{
      const g = makeTorus(-0.04,y,0, 0.022,0.004, 12,6);
      meshes.push({ ...g, color:[0.6,0.2,0.85] });
    });
    // Vacuole
    const vac = makeSphere(0.04,-0.04,0.03, 0.022, 8,8);
    meshes.push({ ...vac, color:[0.2,0.7,0.3] });
    return meshes;
  },

  neuron() {
    const meshes = [];
    // Cell body (soma)
    const soma = makeSphere(0,0,0, 0.025, 12,12);
    meshes.push({ ...soma, color:[0.6,0.3,0.85] });
    // Nucleus inside soma
    const nuc = makeSphere(0,0,0, 0.012, 8,8);
    meshes.push({ ...nuc, color:[0.85,0.2,0.2] });
    // Axon (long cylinder going right)
    const axon = makeCylinder(0.025,0,0, 0.18,0,0, 0.006);
    if(axon) meshes.push({ ...axon, color:[0.3,0.6,0.9] });
    // Myelin sheaths
    for(let i=0;i<5;i++) {
      const mx = 0.04 + i*0.028;
      const sheath = makeCylinder(mx,0,0, mx+0.016,0,0, 0.012);
      if(sheath) meshes.push({ ...sheath, color:[0.95,0.9,0.3] });
    }
    // Axon terminal bulb
    const terminal = makeSphere(0.185,0,0, 0.018, 8,8);
    meshes.push({ ...terminal, color:[0.2,0.85,0.5] });
    // Dendrites (4 cylinders fanning out from soma left)
    [[-0.03,0.03,0],[-0.03,-0.03,0],[-0.03,0.01,0.025],[-0.03,-0.01,-0.025]].forEach(([dx,dy,dz])=>{
      const d = makeCylinder(-0.025,0,0, -0.025+dx*3, dy*3, dz*3, 0.005);
      if(d) meshes.push({ ...d, color:[0.7,0.4,0.9] });
    });
    return meshes;
  },

  water() {
    const meshes = [];
    // Oxygen (large red sphere)
    const O = makeSphere(0,0,0, 0.028, 12,12);
    meshes.push({ ...O, color:[0.9,0.1,0.1] });
    // Hydrogen atoms (2 smaller white spheres, bent 104.5°)
    const angle = 104.5 * Math.PI / 180;
    const bondLen = 0.065;
    const H1 = makeSphere(bondLen*Math.cos(angle/2), bondLen*Math.sin(angle/2), 0, 0.016, 10,10);
    meshes.push({ ...H1, color:[0.92,0.92,0.95] });
    const H2 = makeSphere(-bondLen*Math.cos(angle/2), bondLen*Math.sin(angle/2), 0, 0.016, 10,10);
    meshes.push({ ...H2, color:[0.92,0.92,0.95] });
    // Bond cylinders
    const b1 = makeCylinder(0,0,0, bondLen*Math.cos(angle/2), bondLen*Math.sin(angle/2), 0, 0.006);
    if(b1) meshes.push({ ...b1, color:[0.7,0.7,0.75] });
    const b2 = makeCylinder(0,0,0, -bondLen*Math.cos(angle/2), bondLen*Math.sin(angle/2), 0, 0.006);
    if(b2) meshes.push({ ...b2, color:[0.7,0.7,0.75] });
    return meshes;
  },

  dna() {
    const meshes = [];
    const turns = 3, segments = 60, radius = 0.035, height = 0.18;
    // Two strands + base pairs
    for(let s=0;s<2;s++) {
      const phase = s * Math.PI;
      const strandPos = [], strandIdx = [];
      // Build strand as series of small spheres linked together
      for(let i=0;i<segments;i++) {
        const t = i/(segments-1);
        const angle = 2*Math.PI*turns*t + phase;
        const x = radius*Math.cos(angle);
        const y = height*t - height/2;
        const z = radius*Math.sin(angle);
        const sphere = makeSphere(x,y,z, 0.008, 6,6);
        meshes.push({ ...sphere, color: s===0 ? [0.9,0.2,0.2] : [0.2,0.4,0.9] });
        // Base pair connections every ~6 segments
        if(i%6===0 && s===0) {
          const angle2 = angle + Math.PI;
          const x2 = radius*Math.cos(angle2);
          const z2 = radius*Math.sin(angle2);
          const bp = makeCylinder(x,y,z, x2,y,z2, 0.004);
          if(bp) meshes.push({ ...bp, color:[0.3,0.8,0.3] });
        }
      }
    }
    return meshes;
  },

  crystal() {
    const meshes = [];
    const spacing = 0.04;
    const colors = [[0.9,0.3,0.3],[0.3,0.3,0.9]]; // Na=red, Cl=blue
    // 3×3×3 NaCl lattice
    for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++) {
      const isNa = (x+y+z) % 2 === 0;
      const sphere = makeSphere(x*spacing, y*spacing, z*spacing, isNa ? 0.012 : 0.016, 8,8);
      meshes.push({ ...sphere, color: isNa ? colors[0] : colors[1] });
    }
    // Bond lines between adjacent atoms
    for(let x=-1;x<=1;x++) for(let y=-1;y<=1;y++) for(let z=-1;z<=1;z++) {
      [[1,0,0],[0,1,0],[0,0,1]].forEach(([dx,dy,dz]) => {
        if(x+dx<=1 && y+dy<=1 && z+dz<=1) {
          const bond = makeCylinder(x*spacing,y*spacing,z*spacing, (x+dx)*spacing,(y+dy)*spacing,(z+dz)*spacing, 0.003);
          if(bond) meshes.push({ ...bond, color:[0.7,0.7,0.7] });
        }
      });
    }
    return meshes;
  },

  projectile() {
    const meshes = [];
    // Parabolic arc as series of small spheres
    const N = 30;
    for(let i=0;i<N;i++) {
      const t = i/(N-1);
      const x = -0.1 + 0.2*t;
      const y = 0.08*4*t*(1-t); // parabola
      const z = 0;
      const size = i===0 || i===N-1 ? 0.012 : 0.005;
      const sphere = makeSphere(x,y,z, size, 6,6);
      meshes.push({ ...sphere, color: i===0 ? [0.9,0.7,0.1] : [0.9,0.5,0.1] });
    }
    // Ground plane (thin box)
    const ground = makeBox(0,-0.005,0, 0.25,0.002,0.04);
    meshes.push({ ...ground, color:[0.3,0.6,0.3] });
    // Launch arrow
    const arrow = makeCylinder(-0.1,0,0, -0.06,0.06,0, 0.004);
    if(arrow) meshes.push({ ...arrow, color:[0.95,0.8,0.1] });
    return meshes;
  },

  wave() {
    const meshes = [];
    const rows=20, cols=30;
    const W=0.22, D=0.12;
    // Wave surface grid as triangles
    const positions = [], indices = [];
    for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
      const x = -W/2 + W*j/cols;
      const z = -D/2 + D*i/rows;
      const f1 = 0.025*Math.sin(2*Math.PI*3*j/cols);
      const f2 = 0.018*Math.sin(2*Math.PI*2*j/cols + 1.2);
      positions.push(x, f1+f2, z);
    }
    for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) {
      const a=i*(cols+1)+j, b=a+1, c=a+(cols+1), d=c+1;
      indices.push(a,c,b, b,c,d);
    }
    meshes.push({ positions:new Float32Array(positions), indices:new Uint16Array(indices), color:[0.2,0.5,0.9] });
    // Wave 2 (red, offset)
    const positions2 = positions.map((v,i)=>i%3===1 ? v*0.7+0.005 : v);
    meshes.push({ positions:new Float32Array(positions2), indices:new Uint16Array(indices), color:[0.9,0.2,0.2] });
    // Flat baseline
    const base = makeBox(0,-0.005,0, 0.24,0.002,0.14);
    meshes.push({ ...base, color:[0.15,0.15,0.25] });
    return meshes;
  },

  pendulum() {
    const meshes = [];
    // String (thin cylinder)
    const string = makeCylinder(0,0.12,0, 0.06,-0.06,0, 0.003);
    if(string) meshes.push({ ...string, color:[0.7,0.6,0.4] });
    // Pivot (small sphere)
    const pivot = makeSphere(0,0.12,0, 0.01, 8,8);
    meshes.push({ ...pivot, color:[0.7,0.7,0.7] });
    // Bob (decorative sphere)
    const bob = makeSphere(0.06,-0.06,0, 0.025, 12,12);
    meshes.push({ ...bob, color:[0.95,0.6,0.1] });
    // Support bar
    const bar = makeCylinder(-0.05,0.13,0, 0.05,0.13,0, 0.006);
    if(bar) meshes.push({ ...bar, color:[0.5,0.5,0.55] });
    // Ghost position showing SHM
    const ghost = makeSphere(-0.06,-0.06,0, 0.025, 12,12);
    meshes.push({ ...ghost, color:[0.9,0.5,0.1] });
    const ghostStr = makeCylinder(0,0.12,0, -0.06,-0.06,0, 0.002);
    if(ghostStr) meshes.push({ ...ghostStr, color:[0.5,0.5,0.4] });
    return meshes;
  },

  cube() {
    const meshes = [];
    const box = makeBox(0,0,0, 0.1,0.1,0.1);
    meshes.push({ ...box, color:[0.2,0.5,0.9] });
    // Wireframe edges (thin cylinders)
    const s=0.05;
    const edges=[[[-s,-s,-s],[s,-s,-s]],[[-s,s,-s],[s,s,-s]],[[-s,-s,s],[s,-s,s]],[[-s,s,s],[s,s,s]],
                 [[-s,-s,-s],[-s,s,-s]],[[s,-s,-s],[s,s,-s]],[[-s,-s,s],[-s,s,s]],[[s,-s,s],[s,s,s]],
                 [[-s,-s,-s],[-s,-s,s]],[[s,-s,-s],[s,-s,s]],[[-s,s,-s],[-s,s,s]],[[s,s,-s],[s,s,s]]];
    edges.forEach(([a,b])=>{
      const e=makeCylinder(a[0],a[1],a[2],b[0],b[1],b[2],0.003);
      if(e) meshes.push({...e,color:[0.9,0.9,0.95]});
    });
    return meshes;
  },

  sphere() {
    const meshes = [];
    // Main sphere
    const s = makeSphere(0,0,0, 0.07, 20,20);
    meshes.push({ ...s, color:[0.85,0.15,0.2] });
    // Equator ring
    const eq = makeTorus(0,0,0, 0.07,0.003, 24,6);
    meshes.push({ ...eq, color:[0.95,0.85,0.2] });
    // Meridian ring
    const mer = makeTorus(0,0,0, 0.07,0.003, 24,6);
    // Rotate 90° → rotate positions
    const rotPos = new Float32Array(mer.positions.length);
    for(let i=0;i<mer.positions.length;i+=3) {
      rotPos[i]   = mer.positions[i+1];
      rotPos[i+1] = -mer.positions[i];
      rotPos[i+2] = mer.positions[i+2];
    }
    meshes.push({ positions:rotPos, indices:mer.indices, color:[0.2,0.7,0.95] });
    return meshes;
  },

  torus() {
    const meshes = [];
    const t = makeTorus(0,0,0, 0.065,0.022, 28,14);
    meshes.push({ ...t, color:[0.7,0.2,0.9] });
    // Inner circle hint
    const inner = makeTorus(0,0,0, 0.065,0.003, 28,6);
    meshes.push({ ...inner, color:[0.95,0.85,0.2] });
    return meshes;
  },
};

// ── Backend URL ───────────────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace(/\/api$/, '')
  : 'http://localhost:5000';

// ══════════════════════════════════════════════════════════════════════════
//  AR VIEWER COMPONENT
//  Opens a standalone HTML page served by Express — completely outside React.
//  This is the only architecture that works reliably on iOS Safari because:
//  1. The GLB is a real HTTPS URL (required for USDZ generation)
//  2. model-viewer lives in its own HTML document (no React re-renders)
//  3. No custom element registration race conditions
// ══════════════════════════════════════════════════════════════════════════
function ARViewer({ model, subjectColor, onBack }) {
  const arPageUrl = `${BACKEND}/ar/view/${model.id}`;

  return (
    <div style={{ position:'relative', width:'100%' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={onBack}
          style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.7)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', minHeight:40 }}>
          ← Back
        </button>
        <div style={{ fontSize:28 }}>{model.icon}</div>
        <div>
          <div style={{ color:'white', fontSize:18, fontWeight:800, lineHeight:1.1 }}>{model.label}</div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>{model.desc}</div>
        </div>
      </div>

      {/* Open AR page button */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:`1.5px solid ${subjectColor}30`, borderRadius:18, padding:28, textAlign:'center', marginBottom:16 }}>
        <div style={{ fontSize:64, marginBottom:16 }}>{model.icon}</div>
        <div style={{ color:'white', fontSize:18, fontWeight:800, marginBottom:8 }}>{model.label}</div>
        <div style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginBottom:24, lineHeight:1.6 }}>
          Opens a full-screen AR viewer.<br/>
          On iPhone/iPad, tap <strong style={{color:'white'}}>🌍 View in AR</strong> inside to place it in your room.
        </div>

        <a href={arPageUrl} target="_blank" rel="noopener noreferrer"
          style={{ display:'inline-flex', alignItems:'center', gap:10, background:subjectColor, border:'none', borderRadius:14, padding:'14px 32px', color:'white', fontSize:16, fontWeight:800, textDecoration:'none', boxShadow:`0 6px 24px ${subjectColor}66`, letterSpacing:'0.3px' }}>
          🌍&nbsp; Open AR Viewer
        </a>

        <div style={{ color:'rgba(255,255,255,0.3)', fontSize:11, marginTop:14 }}>
          Opens in a new tab • Use Safari on iPhone for AR
        </div>
      </div>

      {/* iOS tip */}
      <div style={{ padding:'12px 16px', background:'rgba(52,152,219,0.08)', border:'1px solid rgba(52,152,219,0.3)', borderRadius:12, display:'flex', gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0 }}>💡</span>
        <div>
          <div style={{ color:'#3498db', fontSize:13, fontWeight:700, marginBottom:4 }}>iPhone 16 Pro — Steps</div>
          <div style={{ color:'rgba(255,255,255,0.65)', fontSize:12, lineHeight:1.8 }}>
            1. Tap <strong style={{color:'white'}}>Open AR Viewer</strong> above<br/>
            2. The 3D model appears in a new tab<br/>
            3. Tap <strong style={{color:'white'}}>🌍 View in AR</strong> button (bottom-right)<br/>
            4. Point camera at a flat surface<br/>
            5. Tap the surface to place the model<br/>
            6. Walk around it — LiDAR holds it in place
          </div>
        </div>
      </div>

      {/* Platform badges */}
      <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
        {[
          { icon:'🍎', label:'iOS Safari',     note:'Full AR via Quick Look', ok:true },
          { icon:'🤖', label:'Android Chrome', note:'Full AR via WebXR',      ok:true },
          { icon:'🖥️', label:'Desktop',        note:'3D view only',           ok:false },
        ].map(p=>(
          <div key={p.label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 12px', display:'flex', gap:8 }}>
            <span style={{ fontSize:20 }}>{p.icon}</span>
            <div>
              <div style={{ color:p.ok?'#27ae60':'rgba(255,255,255,0.4)', fontSize:12, fontWeight:700 }}>{p.label} {p.ok?'✅':''}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, marginTop:1 }}>{p.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function ARLabPage() {
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeModel,   setActiveModel]   = useState(null);
  // model-viewer script is loaded in public/index.html — no runtime injection needed

  const subj = SUBJECTS.find(s => s.id === activeSubject);
  const mods  = activeSubject ? MODELS[activeSubject] : [];
  const model = mods.find(m => m.id === activeModel);

  return (
    <div style={{ padding:'14px 16px', maxWidth:1100, margin:'0 auto', fontFamily:"'Nunito',sans-serif", minHeight:'100vh' }}>
      <style>{`
        @keyframes spin { to{ transform:rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }
        @keyframes fadein { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} }
        .ar-card { transition:all 0.25s cubic-bezier(.4,0,.2,1); cursor:pointer; }
        .ar-card:hover { transform:translateY(-4px); box-shadow:0 12px 40px rgba(0,0,0,0.5); }
        .ar-card:active { transform:scale(0.97); }
        .ar-fadein { animation:fadein 0.35s ease forwards; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, color:'rgba(255,255,255,0.35)', fontSize:12, flexWrap:'wrap' }}>
        <span onClick={()=>{setActiveSubject(null);setActiveModel(null);}} style={{ cursor:activeSubject?'pointer':'default', color:activeSubject?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.35)' }}>
          🌍 AR Lab
        </span>
        {activeSubject && <><span>›</span><span onClick={()=>setActiveModel(null)} style={{ cursor:activeModel?'pointer':'default', color:activeModel?'rgba(255,255,255,0.55)':'white' }}>{subj?.icon} {subj?.label}</span></>}
        {activeModel   && <><span>›</span><span style={{ color:subj?.color }}>{model?.label}</span></>}
      </div>

      {/* ── Page header ── */}
      {!activeModel && (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
            <div style={{ fontSize:32 }}>🌍</div>
            <div>
              <div style={{ color:'white', fontSize:22, fontWeight:800, lineHeight:1.1 }}>
                {activeSubject ? `${subj?.label} — AR Models` : 'AR Lab'}
              </div>
              <div style={{ color:'rgba(255,255,255,0.45)', fontSize:13, marginTop:3 }}>
                {activeSubject ? 'Select a model to view in 3D or place in your room' : '3D models you can place in real space with your phone'}
              </div>
            </div>
          </div>

          {/* AR platform info banner */}
          {!activeSubject && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10, marginBottom:20, padding:'14px 16px', background:'rgba(255,255,255,0.02)', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)' }}>
              {[
                { icon:'🤖', platform:'Android',  detail:'Chrome + ARCore required', color:'#27ae60', works:true  },
                { icon:'🍎', platform:'iOS',       detail:'Safari + ARKit built-in',   color:'#3498db', works:true  },
                { icon:'🖥️', platform:'Desktop',   detail:'3D view, no AR',            color:'#f39c12', works:false },
              ].map(p=>(
                <div key={p.platform} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:p.works?p.color+'18':'rgba(255,255,255,0.05)', border:`1px solid ${p.works?p.color:'rgba(255,255,255,0.1)'}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{p.icon}</div>
                  <div>
                    <div style={{ color:p.works?p.color:'rgba(255,255,255,0.4)', fontSize:12, fontWeight:700 }}>{p.platform} {p.works?'✅':'🖥️'}</div>
                    <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10 }}>{p.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Subject grid ── */}
      {!activeSubject && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
          {SUBJECTS.map(s=>(
            <div key={s.id} className="ar-card" onClick={()=>setActiveSubject(s.id)}
              style={{ background:s.bg, border:`1.5px solid ${s.color}40`, borderRadius:18, padding:'22px 18px' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>{s.icon}</div>
              <div style={{ color:'white', fontSize:17, fontWeight:800, marginBottom:5 }}>{s.label}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, marginBottom:14, lineHeight:1.5 }}>
                {MODELS[s.id].length} AR models
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {MODELS[s.id].map(m=>(
                  <span key={m.id} style={{ background:`${s.color}18`, border:`1px solid ${s.color}30`, borderRadius:7, padding:'3px 8px', color:s.color, fontSize:10, fontWeight:700 }}>{m.label}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Model grid ── */}
      {activeSubject && !activeModel && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
          {mods.map(m=>(
            <div key={m.id} className="ar-card" onClick={()=>setActiveModel(m.id)}
              style={{ background:'rgba(255,255,255,0.03)', border:`1.5px solid ${subj?.color}30`, borderRadius:16, padding:'22px 18px' }}>
              <div style={{ fontSize:32, marginBottom:10 }}>{m.icon}</div>
              <div style={{ color:'white', fontSize:16, fontWeight:800, marginBottom:5 }}>{m.label}</div>
              <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12, lineHeight:1.5, marginBottom:14 }}>{m.desc}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${subj?.color}20`, border:`1px solid ${subj?.color}40`, borderRadius:9, padding:'6px 14px', color:subj?.color, fontSize:12, fontWeight:700 }}>
                🌍 Open in AR →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── AR Viewer ── */}
      {activeSubject && activeModel && model && (
        <div className="ar-fadein">
          <ARViewer model={model} subjectColor={subj?.color || '#ffd700'} onBack={()=>setActiveModel(null)} />
        </div>
      )}

      {/* Footer */}
      {!activeModel && (
        <div style={{ marginTop:28, padding:'12px 16px', background:'rgba(255,255,255,0.02)', borderRadius:12, border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ color:'rgba(255,255,255,0.25)', fontSize:11 }}>🌍 AR Lab</div>
          {[['12','AR Models'],['100%','Browser-native'],['0','App installs needed']].map(([v,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ color:'#ffd700', fontWeight:800, fontSize:13 }}>{v}</span>
              <span style={{ color:'rgba(255,255,255,0.35)', fontSize:11 }}>{l}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
