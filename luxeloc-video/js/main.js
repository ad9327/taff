import { W, H, FPS, b, CUE, DURATION, TRANS, carStart, N_CARS, CAR_BEATS } from './timeline.mjs';
import { clamp, ease, hash, noise1, shake, h } from './engine.js';
import * as hook from './scenes/hook.js';
import * as logo from './scenes/logo.js';
import * as garage from './scenes/garage.js';
import * as end from './scenes/end.js';

const MODULES = { hook, logo, garage, end };
const ORDER = ['hook', 'logo', 'garage', 'end'];
const ONLY = new URLSearchParams(location.search).get('only');

// hits that shake the camera: the hook's cuts, the drop, each car's arrival and second shot
const HITS = [...CUE.flips, CUE.drop, CUE.endIn];
for (let i = 0; i < N_CARS; i++) HITS.push(carStart(i), carStart(i) + b(3));

// ---------- background: black, a few warm light trails drifting past ----------
const bg = document.getElementById('bg');
const g = bg.getContext('2d');
const TRAILS = Array.from({ length: 26 }, (_, i) => ({
  y: hash(i, 1) * H, len: 120 + hash(i, 2) * 420, speed: 140 + hash(i, 3) * 420, w: 1 + hash(i, 4) * 3,
  warm: hash(i, 5) < 0.6, off: hash(i, 6) * 4000, a: 0.08 + hash(i, 7) * 0.22,
}));
function drawBg(t) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#060607');
  grd.addColorStop(0.55, '#0b0b0e');
  grd.addColorStop(1, '#040405');
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, 900);
  glow.addColorStop(0, 'rgba(217,178,95,0.10)');
  glow.addColorStop(1, 'rgba(217,178,95,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  for (const tr of TRAILS) {
    const x = ((tr.off + t * tr.speed) % (W + tr.len + 400)) - tr.len - 200;
    const y = tr.y + noise1(t * 0.3, tr.off) * 20;
    const lg = g.createLinearGradient(x, 0, x + tr.len, 0);
    const c = tr.warm ? '255,190,120' : '220,230,255';
    lg.addColorStop(0, `rgba(${c},0)`);
    lg.addColorStop(1, `rgba(${c},${tr.a})`);
    g.strokeStyle = lg;
    g.lineWidth = tr.w;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + tr.len, y);
    g.stroke();
  }
}

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
const beam = h('div', 'beam', document.getElementById('stage'));
beam.style.zIndex = 6;

const windows = {};
for (const n of ORDER) windows[n] = [0, DURATION + 1];
for (const tr of TRANS) { windows[tr.from][1] = tr.at + tr.dur; windows[tr.to][0] = tr.at; }

let SC = [];
let pending = [];

async function init() {
  grain.style.backgroundImage = `url(${grainTile()})`;
  await Promise.all(['100px Anton', '100px Michroma', '400 40px Mont', '600 40px Mont', '800 40px Mont'].map((f) => document.fonts.load(f, 'AÉÊ€0')));
  const ctx = {
    wait: (p) => { if (p) pending.push(p); },
    // a car photo filling `box` px, graded like the others
    shot: (parent, name, w = W, hh = H) => {
      const box = h('div', 'shot', parent);
      Object.assign(box.style, { width: `${w}px`, height: `${hh}px` });
      const img = h('img', '', box);
      img.src = `assets/cars/${name}.jpg`;
      return { box, img };
    },
  };
  SC = ORDER.map((name) => {
    const root = h('div', 'scene', sceneHost);
    root.style.display = 'block';
    const update = MODULES[name].build(root, ctx);
    root.style.display = 'none';
    return { name, root, update, win: windows[name] };
  });
  await document.fonts.ready;
  await Promise.all([...document.images].filter((i) => i.src).map((i) => i.decode().catch(() => {})));
  window.__ready = true;
}

function transitionState(name, t) {
  const st = { clip: '' };
  for (const tr of TRANS) {
    if (t < tr.at || t > tr.at + tr.dur) continue;
    const k = clamp((t - tr.at) / tr.dur);
    if (tr.kind === 'beam' && name === tr.to) {
      const p = ease.inOutCubic(k);
      st.clip = `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`;
    }
  }
  return st;
}

// the beam that sweeps down the frame: between scenes and between cars
function beamAt(t) {
  const sweeps = TRANS.filter((tr) => tr.kind === 'beam').map((tr) => [tr.at, tr.dur]);
  for (let i = 1; i < N_CARS; i++) sweeps.push([carStart(i) - b(0.25), b(0.5)]);
  for (const [at, dur] of sweeps) {
    const k = (t - at) / dur;
    if (k >= 0 && k <= 1) return ease.inOutCubic(k);
  }
  return -1;
}

window.__render = async (t) => {
  pending = [];
  drawBg(t);
  const sh = shake(t, HITS, 12, 9);
  const big = shake(t, [CUE.drop], 30, 6, 5);
  cam.style.transform = `translate(${(sh.x + big.x).toFixed(2)}px, ${(sh.y + big.y).toFixed(2)}px) rotate(${(sh.r + big.r).toFixed(3)}deg)`;

  for (const sc of SC) {
    const on = (!ONLY || ONLY === sc.name) && t >= sc.win[0] - 1e-6 && t <= sc.win[1] + 1e-6;
    sc.root.style.display = on ? 'block' : 'none';
    if (!on) continue;
    const st = transitionState(sc.name, t);
    sc.root.style.clipPath = st.clip || 'none';
    sc.update(t);
  }

  const bp = beamAt(t);
  beam.style.visibility = bp >= 0 && !ONLY ? 'visible' : 'hidden';
  if (bp >= 0) {
    beam.style.top = `${(-20 + (H + 40) * bp).toFixed(1)}px`;
    beam.style.opacity = Math.sin(Math.PI * bp).toFixed(3);
  }

  // flashes: the hook's cuts, the drop (double flash, like headlights), the end card
  let fl = 0;
  for (const c of CUE.flips) if (t >= c) fl = Math.max(fl, 0.35 * Math.exp(-14 * (t - c)));
  if (t >= CUE.drop) fl = Math.max(fl, Math.exp(-10 * (t - CUE.drop)), t >= CUE.drop + b(0.5) ? 0.8 * Math.exp(-10 * (t - CUE.drop - b(0.5))) : 0);
  if (t >= CUE.endIn) fl = Math.max(fl, 0.4 * Math.exp(-9 * (t - CUE.endIn)));
  flash.style.opacity = fl.toFixed(3);

  const fr = Math.round(t * FPS * 2);
  grain.style.transform = `translate(${Math.floor(hash(fr, 3) * 64) - 32}px, ${Math.floor(hash(fr, 4) * 64) - 32}px)`;

  if (pending.length) await Promise.all(pending);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};

window.__duration = DURATION;
init();
