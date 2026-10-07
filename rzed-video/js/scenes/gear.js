// Animated studio gear for the service cards, driven by the same groove as the score
// (kick on 16th-steps 0/6/10, snare on 8, hats on 8ths — see audio/score.mjs).
import { BEAT } from '../timeline.mjs';
import { clamp, h, noise1, snap } from '../engine.js';
import { icon } from '../icons.js';

const S16 = BEAT / 4;
const BAR = BEAT * 4;
const KICKS = [0, 6, 10], SNARE = [8];

// envelope of the latest hit among `steps` (16th steps in the bar) before t
function env(t, steps, decay = 7) {
  if (t < 0) return 0;
  const inBar = t % BAR;
  let best = Infinity;
  for (const s of steps) {
    let d = inBar - s * S16;
    if (d < 0) d += BAR;
    best = Math.min(best, d);
  }
  return Math.exp(-decay * best);
}
export const kickEnv = (t, d) => env(t, KICKS, d);
export const snareEnv = (t, d) => env(t, SNARE, d);

const W = 820, HH = 780;

export function gear(parent, key) {
  const g = h('div', 'abs', parent);
  Object.assign(g.style, { width: `${W}px`, height: `${HH}px` });
  if (key === 'rec') return rec(g);
  if (key === 'mix') return mix(g);
  if (key === 'master') return master(g);
  return pads(g);
}

function rec(g) {
  const rings = Array.from({ length: 3 }, () => {
    const r = h('div', 'ring abs', g);
    r.style.borderWidth = '4px';
    return r;
  });
  const mic = h('div', 'abs', g, icon('mic', { stroke: '#e3f1ff', sw: 1.1 }));
  Object.assign(mic.style, { width: '300px', height: '300px', left: `${W / 2 - 150}px`, top: '150px', filter: 'drop-shadow(0 0 24px #4cb8ff) drop-shadow(0 0 60px #2f7bff)' });
  const NB = 44;
  const bars = Array.from({ length: NB }, (_, i) => {
    const b = h('div', 'abs', g);
    Object.assign(b.style, { width: '10px', left: `${60 + i * ((W - 120) / NB)}px`, borderRadius: '5px', background: 'linear-gradient(180deg,#9fd8ff,#2f7bff)', boxShadow: '0 0 10px rgba(76,184,255,.7)' });
    return b;
  });
  const recPill = h('div', 'abs', g, '<span class="dot" style="display:inline-block;width:22px;height:22px;border-radius:50%;background:#ff3b4e;box-shadow:0 0 14px #ff3b4e;margin-right:14px;vertical-align:-2px"></span><span>REC</span><span class="tc" style="margin-left:18px;font-weight:600;opacity:.85"></span>');
  Object.assign(recPill.style, { left: '40px', top: '40px', padding: '12px 26px', borderRadius: '999px', background: 'rgba(4,10,40,.7)', border: '2px solid rgba(255,90,110,.6)', fontWeight: '800', fontSize: '32px', letterSpacing: '2px' });
  const dot = recPill.querySelector('.dot'), tc = recPill.querySelector('.tc');
  return (t, local) => {
    const k = kickEnv(t, 6);
    rings.forEach((r, i) => {
      const ph = ((t / BEAT + i / 3) % 1);
      const rad = 170 + ph * 260;
      Object.assign(r.style, { left: `${W / 2 - rad}px`, top: `${300 - rad}px`, width: `${2 * rad}px`, height: `${2 * rad}px`, opacity: ((1 - ph) * 0.7).toFixed(3) });
    });
    mic.style.transform = `scale(${(1 + 0.05 * k).toFixed(4)})`;
    bars.forEach((b, i) => {
      const x = i / (NB - 1);
      const shape = Math.sin(Math.PI * x);
      const a = clamp(0.12 + shape * (0.35 + 0.55 * Math.abs(noise1(t * 7 + i * 0.6, 2))) * (0.6 + 0.6 * k));
      const hgt = 16 + a * 190;
      b.style.height = `${hgt.toFixed(1)}px`;
      b.style.top = `${(640 - hgt / 2).toFixed(1)}px`;
    });
    dot.style.opacity = (Math.floor(t / BEAT) % 2 === 0 ? 1 : 0.25).toString();
    const s = Math.max(0, Math.floor(snap(local)));
    tc.textContent = `00:0${Math.min(9, s)}`;
  };
}

function mix(g) {
  const NCH = 6;
  const ch = Array.from({ length: NCH }, (_, i) => {
    const x = 80 + i * 118;
    const track = h('div', 'abs', g);
    Object.assign(track.style, { left: `${x + 36}px`, top: '110px', width: '8px', height: '520px', borderRadius: '4px', background: 'rgba(150,190,255,.25)' });
    const ticks = h('div', 'abs', g);
    Object.assign(ticks.style, { left: `${x + 14}px`, top: '110px', width: '52px', height: '520px',
      background: 'repeating-linear-gradient(180deg, rgba(160,200,255,.35) 0 2px, transparent 2px 52px)' });
    const meter = Array.from({ length: 16 }, (_, s) => {
      const seg = h('div', 'abs', g);
      Object.assign(seg.style, { left: `${x + 76}px`, top: `${610 - s * 32}px`, width: '16px', height: '24px', borderRadius: '4px' });
      return seg;
    });
    const cap = h('div', 'abs', g);
    Object.assign(cap.style, { left: `${x}px`, width: '80px', height: '46px', borderRadius: '10px',
      background: 'linear-gradient(180deg,#f4f9ff,#9fc3ff 50%,#5d8ff0)', boxShadow: '0 6px 16px rgba(0,0,0,.5), 0 0 20px rgba(76,184,255,.6)' });
    const line = h('div', 'abs', cap);
    Object.assign(line.style, { left: '8px', top: '21px', width: '64px', height: '4px', background: '#0b2170', borderRadius: '2px' });
    return { cap, meter, i };
  });
  return (t) => {
    const k = kickEnv(t, 5), sn = snareEnv(t, 6);
    for (const c of ch) {
      const pos = 0.5 + 0.32 * noise1(t * 0.9 + c.i * 3.1, 5) + 0.06 * Math.sin(t * 2 + c.i);
      c.cap.style.top = `${(110 + 520 * (1 - pos) - 23).toFixed(1)}px`;
      const lvl = clamp(0.25 + 0.5 * (c.i % 2 ? sn : k) + 0.2 * Math.abs(noise1(t * 9 + c.i, 6)));
      c.meter.forEach((seg, s) => {
        const on = s / 16 < lvl;
        const col = s > 13 ? '#ff4d6a' : s > 10 ? '#7fe3ff' : '#2f8bff';
        seg.style.background = on ? col : 'rgba(120,160,255,.12)';
        seg.style.boxShadow = on ? `0 0 10px ${col}` : 'none';
      });
    }
  };
}

function master(g) {
  const cone = Array.from({ length: 3 }, (_, i) => {
    const c = h('div', 'abs', g);
    const r = [150, 105, 45][i];
    Object.assign(c.style, { left: `${W / 2 - r}px`, top: `${250 - r}px`, width: `${2 * r}px`, height: `${2 * r}px`, borderRadius: '50%',
      border: `${i === 2 ? 0 : 6}px solid rgba(160,205,255,.7)`, background: i === 2 ? 'radial-gradient(circle at 40% 35%, #cfe6ff, #2f7bff 60%, #0b2170)' : 'radial-gradient(circle, rgba(20,50,140,.6), rgba(4,12,50,.9))',
      boxShadow: '0 0 30px rgba(76,184,255,.45)' });
    return c;
  });
  const NB = 36;
  const bars = Array.from({ length: NB }, (_, i) => {
    const b = h('div', 'abs', g);
    Object.assign(b.style, { width: '14px', left: `${70 + i * ((W - 140) / NB)}px`, borderRadius: '4px 4px 0 0', background: 'linear-gradient(0deg,#1f5fff,#4cb8ff 60%,#e0f2ff)' });
    return b;
  });
  const floor = h('div', 'abs', g);
  Object.assign(floor.style, { left: '60px', top: '700px', width: `${W - 120}px`, height: '3px', background: 'rgba(160,205,255,.6)' });
  return (t) => {
    const k = kickEnv(t, 8);
    cone.forEach((c, i) => { c.style.transform = `scale(${(1 + (i === 0 ? 0.06 : 0.1) * k).toFixed(4)})`; });
    bars.forEach((b, i) => {
      const x = i / (NB - 1);
      const shape = 0.95 - 0.55 * x + 0.25 * Math.exp(-Math.pow((x - 0.15) / 0.12, 2));
      const a = clamp(shape * (0.55 + 0.45 * (x < 0.25 ? k : snareEnv(t, 6) * 0.6 + 0.4)) + 0.12 * noise1(t * 6 + i * 0.7, 9));
      const hgt = 20 + a * 280;
      b.style.height = `${hgt.toFixed(1)}px`;
      b.style.top = `${(700 - hgt).toFixed(1)}px`;
    });
  };
}

function pads(g) {
  const P = 150, G = 24, X0 = (W - (4 * P + 3 * G)) / 2, Y0 = 80;
  const cells = Array.from({ length: 16 }, (_, s) => {
    const c = h('div', 'abs', g);
    Object.assign(c.style, { left: `${X0 + (s % 4) * (P + G)}px`, top: `${Y0 + Math.floor(s / 4) * (P + G)}px`, width: `${P}px`, height: `${P}px`, borderRadius: '22px', border: '2px solid rgba(140,190,255,.35)' });
    return { c, s, kind: KICKS.includes(s) ? 'kick' : SNARE.includes(s) ? 'snare' : s % 2 === 0 ? 'hat' : 'none' };
  });
  const COL = { kick: [76, 184, 255], snare: [255, 255, 255], hat: [47, 123, 255], none: [47, 90, 200] };
  return (t) => {
    const inBar = ((t % BAR) + BAR) % BAR;
    const step = Math.floor(inBar / S16);
    for (const p of cells) {
      let d = inBar - p.s * S16;
      if (d < 0) d += BAR;
      const hit = p.kind === 'none' ? 0 : Math.exp(-d * 5);
      const head = p.s === step ? 1 : 0;
      const [r, g2, b] = COL[p.kind];
      const a = 0.12 + 0.75 * hit + 0.13 * head;
      p.c.style.background = `rgba(${r},${g2},${b},${a.toFixed(3)})`;
      p.c.style.boxShadow = hit > 0.05 ? `0 0 ${(40 * hit).toFixed(0)}px rgba(${r},${g2},${b},${(0.9 * hit).toFixed(2)}), inset 0 0 20px rgba(255,255,255,${(0.3 * hit).toFixed(2)})` : 'none';
      p.c.style.borderColor = head ? 'rgba(220,240,255,.95)' : 'rgba(140,190,255,.35)';
      p.c.style.transform = `scale(${(1 - 0.06 * hit).toFixed(4)})`;
    }
  };
}
