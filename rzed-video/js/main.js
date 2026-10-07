import { W, H, FPS, b, CUE, DURATION } from './timeline.mjs';
import { clamp, ease, inv, hash, noise1, shake, set, h, tw } from './engine.js';
import * as hook from './scenes/hook.js';
import * as logo from './scenes/logo.js';
import * as services from './scenes/services.js';
import * as chat from './scenes/chat.js';
import * as tarifs from './scenes/tarifs.js';
import * as packs from './scenes/packs.js';
import * as end from './scenes/end.js';

const MODULES = { hook, logo, services, chat, tarifs, packs, end };
const ORDER = ['hook', 'logo', 'services', 'chat', 'tarifs', 'packs', 'end'];

// Transitions between neighbours. Picture and sound share the times through timeline.mjs.
export const TRANS = [
  { from: 'hook', to: 'logo', kind: 'iris', at: b(7.25), dur: b(0.75), cx: 540, cy: 720, r0: 460 },
  { from: 'logo', to: 'services', kind: 'up', at: b(19.5), dur: b(0.5) },
  { from: 'services', to: 'chat', kind: 'up', at: b(35.5), dur: b(0.5) },
  { from: 'chat', to: 'tarifs', kind: 'iris', at: b(51.5), dur: b(0.5), cx: 540, cy: 960 },
  { from: 'tarifs', to: 'packs', kind: 'left', at: b(59.5), dur: b(0.5) },
  { from: 'packs', to: 'end', kind: 'iris', at: b(67.5), dur: b(0.5), cx: 540, cy: 420, r0: 60 },
];

const HITS = [CUE.hook1, CUE.hook2, CUE.hook3, CUE.drop, CUE.servicesIn, CUE.card1, CUE.card2, CUE.card3, CUE.card4,
  CUE.chatIn, CUE.tarifsIn, CUE.price1, CUE.price2, CUE.price3, CUE.packsIn, CUE.pack1, CUE.pack2, CUE.pack3, CUE.endIn, CUE.endPhone];

const params = new URLSearchParams(location.search);
const ONLY = params.get('only');

// ---------- media manifest (Higgsfield shots, optional) ----------
async function loadManifest() {
  // media.json is versioned (the logo); media.local.json holds local shots and clips that stay out of git
  const read = async (f) => {
    try { const r = await fetch(f, { cache: 'no-store' }); if (r.ok) return await r.json(); } catch (e) { /* missing */ }
    return {};
  };
  return { ...(await read('assets/media.json')), ...(await read('assets/media.local.json')) };
}

function makeMedia(manifest, parent, name, cls = '') {
  const box = h('div', `media ${cls}`, parent);
  const fb = h('div', 'fallback', box);
  const img = h('img', '', box);
  img.decoding = 'sync';
  const m = manifest[name];
  if (!m) img.style.display = 'none';
  let last = '';
  return {
    box, img, fallback: fb, has: !!m, src: m && m.type === 'img' ? m.src : '',
    // Show the frame of the clip at `lt` seconds (or the still). Returns a decode promise when the source changed.
    frame(lt) {
      if (!m) return null;
      let src;
      if (m.type === 'clip') {
        const n = clamp(Math.floor(Math.max(0, lt) * m.fps), 0, m.frames - 1);
        src = `${m.dir}/${String(n + 1).padStart(4, '0')}.jpg`;
      } else src = m.src;
      if (src === last) return null;
      last = src;
      img.src = src;
      return img.decode().catch(() => {});
    },
  };
}

// ---------- background: deep-blue space, travel and warp ----------
const bg = document.getElementById('bg');
const g = bg.getContext('2d');
const STARS = Array.from({ length: 520 }, (_, i) => ({
  x: (hash(i, 1) * 2 - 1) * 1.15,
  y: (hash(i, 2) * 2 - 1) * 1.15,
  z: hash(i, 3),
  s: 0.6 + hash(i, 4) * 1.9,
  tw: 1.5 + hash(i, 5) * 4,
  ph: hash(i, 6) * 6.283,
  c: hash(i, 7),
}));

// Distance travelled through the star field: slow cruise, a surge on each iris and push.
function travel(t) {
  let d = 0.035 * t;
  for (const tr of TRANS) {
    const k = ease.inOutCubic(clamp((t - tr.at + 0.12) / (tr.dur + 0.3)));
    d += (tr.kind === 'iris' ? 0.55 : 0.22) * k;
  }
  d += 0.25 * ease.outCubic(clamp((t - CUE.drop) / 1.2));
  return d;
}
function pan(t) {
  let x = 0, y = 0;
  for (const tr of TRANS) {
    const k = ease.inOutCubic(clamp((t - tr.at) / tr.dur));
    if (tr.kind === 'up') y += 900 * k;
    if (tr.kind === 'left') x -= 900 * k;
  }
  return { x, y };
}
function starPos(st, t) {
  const d = travel(t);
  let z = st.z - d;
  z = z - Math.floor(z);              // wrap into [0, 1)
  const zz = 0.06 + z * 0.94;
  const p = pan(t);
  const par = 0.25 + (1 - z) * 0.75;
  const f = 520;
  return {
    x: W / 2 + (st.x * f) / zz + p.x * par * 0.18,
    y: H / 2 - 60 + (st.y * f * 1.75) / zz + p.y * par * 0.18,
    z, zz,
  };
}

function drawBg(t) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#020719');
  grd.addColorStop(0.45, '#05103a');
  grd.addColorStop(1, '#020717');
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);

  // nebula clouds drifting slowly
  const neb = [
    { x: 0.25, y: 0.3, r: 900, c: [26, 70, 255], a: 0.30, s: 1 },
    { x: 0.8, y: 0.62, r: 1000, c: [12, 120, 255], a: 0.20, s: 2 },
    { x: 0.5, y: 0.95, r: 800, c: [60, 50, 230], a: 0.20, s: 3 },
    { x: 0.6, y: 0.08, r: 600, c: [0, 170, 255], a: 0.12, s: 4 },
  ];
  g.globalCompositeOperation = 'lighter';
  for (const n of neb) {
    const x = W * n.x + noise1(t * 0.15, n.s) * 120;
    const y = H * n.y + noise1(t * 0.12, n.s + 9) * 160;
    const rg = g.createRadialGradient(x, y, 0, x, y, n.r);
    rg.addColorStop(0, `rgba(${n.c.join(',')},${n.a})`);
    rg.addColorStop(1, `rgba(${n.c.join(',')},0)`);
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);
  }

  // stars, drawn as streaks between two instants so speed reads as warp
  const dt = 1 / 40;
  g.lineCap = 'round';
  for (let i = 0; i < STARS.length; i++) {
    const st = STARS[i];
    const a = starPos(st, t);
    const p0 = starPos(st, t - dt);
    if (p0.z < a.z - 0.5 || a.zz < 0.07) continue; // wrapped between samples
    const near = 1 - a.z;
    const tw = 0.55 + 0.45 * Math.sin(t * st.tw + st.ph);
    const alpha = clamp((0.25 + near * 0.9) * tw * clamp(a.z * 6));
    if (alpha < 0.02) continue;
    const w = st.s * (0.5 + near * 1.6);
    const col = st.c < 0.7 ? '200,225,255' : st.c < 0.9 ? '120,180,255' : '255,255,255';
    g.strokeStyle = `rgba(${col},${alpha.toFixed(3)})`;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    const dx = a.x - p0.x, dy = a.y - p0.y;
    g.lineTo(Math.abs(dx) + Math.abs(dy) < 0.3 ? a.x + 0.3 : a.x, a.y);
    g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
}

// ---------- grain tile (fixed seed) ----------
function grainTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const im = x.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(hash(i, 77) * 255);
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c.toDataURL('image/png');
}

// ---------- assemble ----------
const sceneHost = document.getElementById('scenes');
const cam = document.getElementById('cam');
const flash = document.getElementById('flash');
const grain = document.getElementById('grain');

const windows = {};
for (const n of ORDER) windows[n] = [0, DURATION + 1];
for (const tr of TRANS) {
  windows[tr.from][1] = tr.at + tr.dur;
  windows[tr.to][0] = tr.at;
}

let SC = [];
let pending = [];

async function init() {
  const manifest = await loadManifest();
  grain.style.backgroundImage = `url(${grainTile()})`;
  // fonts must be in before scenes measure their text
  await Promise.all(['100px Anton', '100px Bebas', '400 40px Mont', '600 40px Mont', '800 40px Mont', 'italic 600 40px Mont']
    .map((f) => document.fonts.load(f, 'AÉ€0')));
  const ctx = {
    iris: TRANS[0],   // the hook places the iris on its ring
    media: (parent, name, cls) => makeMedia(manifest, parent, name, cls),
    // a still for thumbnails: the image itself, or a frame from the middle of a clip
    poster: (name) => {
      const m = manifest[name];
      if (!m) return '';
      return m.type === 'clip' ? `${m.dir}/${String(Math.ceil(m.frames / 2)).padStart(4, '0')}.jpg` : m.src;
    },
    wait: (p) => { if (p) pending.push(p); },
  };
  SC = ORDER.map((name) => {
    const root = h('div', 'scene', sceneHost);
    root.dataset.name = name;
    root.style.display = 'block';            // measurable while building
    const update = MODULES[name].build(root, ctx);
    root.style.display = 'none';
    return { name, root, update, win: windows[name] };
  });
  // wait for every still and font before the first frame
  await document.fonts.ready;
  await Promise.all([...document.images].filter((i) => i.src).map((i) => i.decode().catch(() => {})));
  window.__ready = true;
}

function transitionState(name, t) {
  // returns { x, y, blur, clip, mask, ring } applied to the scene root
  const st = { x: 0, y: 0, blur: 0, s: 1, clip: '', mask: '' };
  for (const tr of TRANS) {
    const k = clamp((t - tr.at) / tr.dur);
    if (t < tr.at - 0.001 || t > tr.at + tr.dur + 0.001) continue;
    const e = ease.inOutCubic(k);
    const vel = Math.sin(Math.PI * k); // 0 → 1 → 0
    if (tr.kind === 'iris') {
      const r0 = tr.r0 || 4;
      const r = r0 + (2300 - r0) * ease.inCubic(k);
      if (name === tr.to) st.clip = `circle(${r.toFixed(1)}px at ${tr.cx}px ${tr.cy}px)`;
      if (name === tr.from) {
        st.mask = `radial-gradient(circle at ${tr.cx}px ${tr.cy}px, transparent ${r.toFixed(1)}px, #000 ${(r + 2).toFixed(1)}px)`;
        st.s = 1 + 0.25 * ease.inCubic(k);
        st.blur = 10 * vel;
      }
      if (name === tr.to) st.s = 1.25 - 0.25 * ease.outCubic(k);
    } else if (tr.kind === 'up') {
      if (name === tr.from) { st.y = -H * e; st.blur = 18 * vel; }
      if (name === tr.to) { st.y = H * (1 - e); st.blur = 18 * vel; }
    } else if (tr.kind === 'left') {
      if (name === tr.from) { st.x = -W * e; st.blur = 18 * vel; }
      if (name === tr.to) { st.x = W * (1 - e); st.blur = 18 * vel; }
    }
  }
  return st;
}

// iris ring drawn on top of both scenes
const irisRing = h('div', 'ring', document.getElementById('stage'));
irisRing.style.zIndex = 5;

window.__render = async (t) => {
  pending = [];
  drawBg(t);

  // camera: slow breathing push, shakes on hits
  const sh = shake(t, HITS, 16, 8);
  const big = shake(t, [CUE.drop], 34, 6, 5);
  const breathe = 1 + 0.012 * Math.sin(t * 0.9);
  cam.style.transform = `translate(${(sh.x + big.x).toFixed(2)}px, ${(sh.y + big.y).toFixed(2)}px) rotate(${(sh.r + big.r).toFixed(3)}deg) scale(${breathe.toFixed(4)})`;

  for (const sc of SC) {
    const on = (!ONLY || ONLY === sc.name) && t >= sc.win[0] - 1e-6 && t <= sc.win[1] + 1e-6;
    sc.root.style.display = on ? 'block' : 'none';
    if (!on) continue;
    const st = transitionState(sc.name, t);
    sc.root.style.transform = `translate(${st.x.toFixed(1)}px, ${st.y.toFixed(1)}px) scale(${st.s.toFixed(4)})`;
    sc.root.style.transformOrigin = '540px 960px';
    sc.root.style.filter = st.blur > 0.1 ? `blur(${st.blur.toFixed(2)}px)` : 'none';
    sc.root.style.clipPath = st.clip || 'none';
    sc.root.style.webkitMaskImage = st.mask || 'none';
    sc.root.style.maskImage = st.mask || 'none';
    sc.update(t);
  }

  // iris ring
  let ringOn = false;
  for (const tr of TRANS) {
    if (tr.kind !== 'iris') continue;
    const k = (t - tr.at) / tr.dur;
    if (k < 0 || k > 1) continue;
    const r0 = tr.r0 || 4;
    const r = r0 + (2300 - r0) * ease.inCubic(k);
    irisRing.style.left = `${tr.cx - r}px`;
    irisRing.style.top = `${tr.cy - r}px`;
    irisRing.style.width = irisRing.style.height = `${2 * r}px`;
    irisRing.style.opacity = (1 - k * 0.3).toFixed(3);
    irisRing.style.borderWidth = `${(6 + 30 * k).toFixed(1)}px`;
    ringOn = true;
  }
  irisRing.style.visibility = ringOn && !ONLY ? 'visible' : 'hidden';

  // flash on the drop and the end card
  const fl = Math.max(
    Math.exp(-7 * Math.max(0, t - CUE.drop)) * (t >= CUE.drop ? 1 : 0),
    0.5 * Math.exp(-8 * Math.max(0, t - CUE.endIn)) * (t >= CUE.endIn ? 1 : 0),
    0.35 * Math.exp(-9 * Math.max(0, t - CUE.tarifsIn)) * (t >= CUE.tarifsIn ? 1 : 0),
  );
  flash.style.opacity = fl.toFixed(3);

  // grain moves every frame
  const fr = Math.round(t * FPS * 2);
  grain.style.transform = `translate(${Math.floor(hash(fr, 3) * 64) - 32}px, ${Math.floor(hash(fr, 4) * 64) - 32}px)`;

  if (pending.length) await Promise.all(pending);
  // two RAFs so the compositor has painted everything we wrote
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};

window.__duration = DURATION;
init();
