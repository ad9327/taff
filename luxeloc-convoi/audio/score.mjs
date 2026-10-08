// The score: drift phonk at 140 BPM in C# minor — pitched 808 cowbell riff, crushed 808, clap on 3, rolling hats —
// written on the picture's beat grid. Each car brings its own sound when it is hit: an impact, the hologram's
// shimmer and its engine — V8 burble, flat-six shriek, four-pot with Akrapovič pops. The runs cut with ticks,
// the pull-backs to the convoy sweep down, the end card closes on the riff's three notes and a last rev.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEAT, BAR, b, DURATION, HITS, HOLO_BEATS, RUN_END, END_AT, PHONE_AT, PHONE_SWIPE, PHONE_CHAT, CHAT, CHAT_CPS } from '../js/timeline.mjs';
import { CARS, COPY, shotSpans } from '../js/copy.mjs';
const COPY_SOCIALS = COPY.socials;
import { SR, Bus, mtof, rng, kick, eight, snare, clap, hat, pad, bell, whoosh, riser, impact, blip, crackle, noise, filterBuf, sweepFilter, biquad, reverb, writeWav } from './synth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEN = DURATION;
const S16 = BEAT / 4;
const N = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));
const fadeIO = (buf, a, z) => { for (let k = 0; k < buf.length; k++) buf[k] *= Math.min(1, k / (a * SR)) * Math.min(1, (buf.length - k) / (z * SR)); return buf; };

// ---------- voices of this video ----------
function cowbell(f, dur = 0.3) {
  const out = N(dur); const bp = biquad('bp', 2400, 0.9), hp = biquad('hp', 500);
  let p1 = 0, p2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    p1 = (p1 + f / SR) % 1; p2 = (p2 + (f * 1.4836) / SR) % 1;
    const v = (p1 < 0.5 ? 1 : -1) + 0.8 * (p2 < 0.5 ? 1 : -1);
    const env = (t < 0.006 ? t / 0.006 : 1) * (0.65 * Math.exp(-t * 26) + 0.35 * Math.exp(-t * 7));
    out[i] = hp(bp(v)) * env * 1.4;
  }
  return out;
}

// engine: firing frequency follows rpmFn(t), crushed harmonics, sub-firing burble, intake noise
function engine(dur, rpmFn, { cyl = 6, drive = 3.2, seed = 3, rough = 0.6, bright = 3200 } = {}) {
  const out = N(dur); const r = rng(seed);
  const lp = biquad('lp', bright, 0.7), nbp = biquad('bp', 900, 0.8);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const rpm = rpmFn(t);
    const f = (rpm / 60) * (cyl / 2);
    ph = (ph + f / SR) % 1; ph2 = (ph2 + (f / 2) / SR) % 1;
    const saw = 2 * ph - 1;
    const burble = Math.sin(2 * Math.PI * ph2) * rough;
    const n = nbp(r() * 2 - 1) * (0.4 + rpm / 9000);
    const v = saw * 0.7 + burble + n * 0.8 + Math.sin(2 * Math.PI * ph * 2) * 0.3;
    out[i] = lp(Math.tanh(v * drive)) * 0.6;
  }
  return out;
}

function bangs(dur, times, seed = 9) {
  const out = N(dur); const r = rng(seed); const lp = biquad('lp', 1800, 0.8);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [at, g] of times) {
      const d = t - at;
      if (d < 0 || d > 0.25) continue;
      v += (r() * 2 - 1) * Math.exp(-d * 45) * g + Math.sin(2 * Math.PI * 70 * d) * Math.exp(-d * 30) * g * 0.8;
    }
    out[i] = Math.tanh(lp(v) * 2.2);
  }
  return out;
}

// the hologram powering up: a rising sine chirp through a comb of partials + digital grit
function holoUp(seed = 1) {
  const dur = 0.7; const out = N(dur); const r = rng(seed);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = 380 * Math.pow(9, Math.min(1, t / 0.45));
    ph = (ph + f / SR) % 1;
    const tone = Math.sin(2 * Math.PI * ph) + 0.4 * Math.sin(4 * Math.PI * ph) + 0.2 * Math.sin(6 * Math.PI * ph);
    const crush = Math.round(tone * 6) / 6;
    const env = Math.min(1, t / 0.02) * Math.exp(-Math.max(0, t - 0.4) * 9);
    const grit = (r() * 2 - 1) * (Math.floor(t * 90) % 3 === 0 ? 0.25 : 0) * Math.exp(-t * 4);
    out[i] = (crush * 0.5 + grit) * env * 0.6;
  }
  return out;
}

// the pull-back: a swept noise falling with a low thump
function pullBack(seed = 2) {
  const dur = 0.5; const n = noise(dur, seed);
  sweepFilter(n, 'bp', (i) => 6000 * Math.pow(0.08, i / n.length), 1.6);
  const out = N(dur); let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph = (ph + (140 - 90 * Math.min(1, t / 0.3)) / SR) % 1;
    out[i] = n[i] * Math.exp(-t * 6) * 1.4 + Math.sin(2 * Math.PI * ph) * Math.exp(-t * 10) * 0.6;
  }
  return out;
}

// a shutter tick for the cuts in a run
function tick(seed = 3) {
  const dur = 0.06; const out = N(dur); const r = rng(seed); const hp = biquad('hp', 3000);
  for (let i = 0; i < out.length; i++) { const t = i / SR; out[i] = hp(r() * 2 - 1) * Math.exp(-t * 90); }
  return out;
}

// ---------- each car's voice ----------
const ENGINES = {
  sl:   { cyl: 8, idle: 1500, peak: 6600, drive: 3.0, rough: 0.8, bright: 2600, pops: [[0.98, 0.7], [1.1, 0.4]] },
  m5:   { cyl: 8, idle: 1700, peak: 7000, drive: 3.4, rough: 0.6, bright: 3000, pops: [[1.0, 0.5]] },
  golf: { cyl: 4, idle: 2200, peak: 7200, drive: 3.8, rough: 0.4, bright: 3800, pops: [[0.95, 0.9], [1.05, 0.7], [1.13, 0.6], [1.3, 0.4]] },
  gt3:  { cyl: 6, idle: 2600, peak: 9000, drive: 3.8, rough: 0.3, bright: 5200, pops: [] },
  rs5:  { cyl: 6, idle: 1600, peak: 6800, drive: 3.2, rough: 0.6, bright: 3000, pops: [[1.0, 0.5], [1.12, 0.35]] },
  rs6:  { cyl: 8, idle: 1500, peak: 6500, drive: 3.4, rough: 0.9, bright: 2600, pops: [[0.96, 0.8], [1.08, 0.6], [1.22, 0.4]] },
  rs4:  { cyl: 6, idle: 1600, peak: 6900, drive: 3.2, rough: 0.6, bright: 3100, pops: [[1.02, 0.5]] },
  rs7:  { cyl: 8, idle: 1500, peak: 6600, drive: 3.3, rough: 0.85, bright: 2700, pops: [[0.98, 0.7], [1.12, 0.5]] },
};
function carRev(id, seed) {
  const e = ENGINES[id];
  const dur = 1.5;
  const rpm = (t) => e.idle + (e.peak - e.idle) * Math.sin(Math.min(1, t / 1.15) * Math.PI) ** 1.4;
  const v = fadeIO(engine(dur, rpm, { cyl: e.cyl, drive: e.drive, seed, rough: e.rough, bright: e.bright }), 0.04, 0.25);
  return { v, pops: e.pops.length ? bangs(1.6, e.pops, seed + 1) : null };
}

// ---------- harmony ----------
const CH = {
  'C#m': { bass: [37, 37, 44, 37], pad: [61, 64, 68, 73] },
  A: { bass: [33, 33, 40, 33], pad: [57, 61, 64, 69] },
  'F#m': { bass: [42, 42, 37, 42], pad: [54, 57, 61, 66] },
  'G#': { bass: [44, 44, 39, 44], pad: [56, 60, 63, 68] },
};
const PROG = ['C#m', 'A', 'F#m', 'G#'];
const chordAt = (bar) => CH[PROG[((bar % 4) + 4) % 4]];
const RIFF = [
  [85, null, 80, null, 85, null, 83, 80, null, 76, null, 78, 80, null, 76, null],
  [85, null, 80, null, 85, null, 88, 87, null, 85, null, 83, 80, null, 78, 76],
];

// ---------- buses ----------
const drums = new Bus(LEN), bass = new Bus(LEN), music = new Bus(LEN), sfx = new Bus(LEN), send = new Bus(LEN);
const START = b(HITS[0]);                 // the beat drops on the first hit
const OUTRO = b(END_AT + 9);              // the beat stops, the end card rings out
const holoAt0 = (t) => HITS.some((hb) => t >= b(hb) && t < b(hb + HOLO_BEATS));   // hologram: half-time, no hats
// the chat on the phone is a breakdown too (the same thinning), so the keys and the pops are heard
const chatAt = (t) => t >= b(PHONE_AT + PHONE_CHAT) && t < b(END_AT);
const holoAt = (t) => holoAt0(t) || chatAt(t);

const K = kick({ f0: 190, f1: 46, dur: 0.38, click: 0.8, drive: 3 });
const CL = clap({ seed: 21 });
const SN = snare({ tone: 210, seed: 23 });
const HC = hat({ dur: 0.04, seed: 25 });
const HO = hat({ open: true, seed: 27 });

const NBARS = Math.ceil(LEN / BAR);
for (let bar = 0; bar < NBARS; bar++) {
  const t0 = bar * BAR;
  const live = (t) => t >= START - 1e-6 && t < OUTRO && t < LEN;
  for (const s of [0, 3, 6, 10, 11]) {
    const t = t0 + s * S16;
    if (!live(t) || (s === 11 && bar % 2 === 0) || (holoAt(t) && s !== 0 && s !== 10)) continue;
    drums.add(K, t, 0.9);
  }
  { const t = t0 + 8 * S16;
    if (live(t)) { drums.add(CL, t, 0.55, -0.1); drums.add(SN, t + 0.003, 0.35, 0.1); send.add(CL, t, 0.25); }
    const g = t0 + 15 * S16; if (live(g) && bar % 2 && !holoAt(g)) drums.add(SN, g, 0.14, 0.2); }
  for (let s = 0; s < 16; s++) {
    const t = t0 + s * S16;
    if (!live(t) || holoAt(t)) continue;
    if (bar % 2 === 1 && s >= 12) continue;
    drums.add(HC, t, (s % 4 === 0 ? 0.24 : s % 2 === 0 ? 0.17 : 0.1), Math.sin(s * 1.3) * 0.25);
  }
  if (bar % 2 === 1) for (let i = 0; i < 6; i++) { const t = t0 + 12 * S16 + i * (4 * S16 / 6); if (live(t) && !holoAt(t)) drums.add(HC, t, 0.12 + 0.03 * i, 0.2); }
  { const t = t0 + 14 * S16; if (live(t) && bar % 4 === 3 && !holoAt(t)) drums.add(HO, t, 0.12, 0.3); }

  const ch = chordAt(bar);
  [[0, 0], [6, 1], [10, 2], [14, 3]].forEach(([s, j], n) => {
    const t = t0 + s * S16;
    if (!live(t)) return;
    const len = (n < 3 ? [6, 4, 4][n] : 2) * S16 + 0.02;
    const from = n === 3 ? mtof(ch.bass[2] + 12) : null;
    bass.add(eight({ f: mtof(ch.bass[j] + 12), dur: len + 0.15, from, glide: 0.06, drive: 3.6, decay: 2.2 }), t, holoAt(t) && n > 0 ? 0.28 : 0.55);
  });

  RIFF[bar % 2].forEach((m, s) => {
    if (m == null) return;
    const t = t0 + s * S16;
    if (!live(t)) return;
    const v = cowbell(mtof(m - 12));
    const g = chatAt(t) ? 0.3 : holoAt(t) ? 0.45 : 0.8;   // the riff steps back while the name is up / the chat runs
    music.add(v, t, g, s % 2 ? 0.25 : -0.25);
    send.add(v, t, 0.25);
  });
  if (t0 >= START - BAR && t0 < OUTRO + BAR) {
    const p = pad({ notes: ch.pad.map((m) => m - 12), dur: Math.min(BAR, LEN - t0) + 0.05, cutoff: 900 });
    music.add(p, t0, 0.2, -0.2); music.add(p, t0 + 0.011, 0.2, 0.2);
  }
}

// ---------- intro: the convoy rolling in, a V8 idling, the scan locking on ----------
{
  const idle = fadeIO(engine(START + 0.1, (t) => 1100 + 500 * (t / START) ** 2 + 60 * Math.sin(t * 9), { cyl: 8, drive: 2.6, seed: 201, rough: 0.9, bright: 1600 }), 0.15, 0.05);
  sfx.add(idle, 0, 0.5);
  sfx.add(riser({ dur: START, seed: 203 }), 0, 0.3);
}

// ---------- each car ----------
HITS.forEach((hb, i) => {
  const c = CARS[i];
  const hit = b(hb);
  // lock-on blips
  [0.36, 0.24, 0.12].forEach((d, j) => sfx.add(blip({ f0: 1400 + j * 300, f1: 2000 + j * 300, dur: 0.06 }), hit - d, 0.16, 0.3));
  if (c.arrival) {
    sfx.add(crackle(0.3, 300 + i), hit - b(1) - 0.02, 0.35);
    sfx.add(whoosh({ dur: 0.4, f0: 600, f1: 6000, peak: 0.4, seed: 310 + i }), hit - b(1) - 0.2, 0.3);
  }
  // the punch-in
  sfx.add(whoosh({ dur: 0.26, f0: 400, f1: 7000, peak: 0.85, seed: 320 + i }), hit - 0.2, 0.45, i % 2 ? 0.3 : -0.3);
  sfx.add(impact({ dur: 1.1, f0: 140, f1: 38, seed: 330 + i }), hit, 0.75);
  sfx.add(crackle(0.12, 340 + i), hit, 0.3);
  // hologram
  const hu = holoUp(350 + i);
  sfx.add(hu, hit + 0.18, 0.32, -0.2); send.add(hu, hit + 0.18, 0.4);
  [88, 92, 95].forEach((m, j) => { const v = bell({ f: mtof(m), dur: 0.6, ratio: 2, index: 1.6, decay: 7, bright: 0.8 }); sfx.add(v, hit + 0.3 + j * 0.07, 0.12, 0.3 - 0.3 * j); send.add(v, hit + 0.3 + j * 0.07, 0.2); });
  // the car's engine under the name
  const rev = carRev(c.id, 360 + i * 3);
  sfx.add(rev.v, hit + 0.12, 0.52, 0);
  if (rev.pops) sfx.add(rev.pops, hit + 0.12, 0.45, 0.1);
  // the dive into the run, a tick on every cut
  const run = hit + b(HOLO_BEATS);
  sfx.add(whoosh({ dur: 0.3, f0: 2000, f1: 300, peak: 0.2, seed: 370 + i }), run - 0.12, 0.35);
  shotSpans(c).slice(1).forEach(([a], k) => {
    sfx.add(tick(380 + i), run + b(a), 0.35, 0.4);
    sfx.add(whoosh({ dur: 0.18, f0: 1500, f1: 5000, peak: 0.5, seed: 390 + i * 7 + k }), run + b(a) - 0.1, 0.16, -0.4);
  });
  // the rate card: a lift and a tick per price
  const card = run + b(2);
  sfx.add(whoosh({ dur: 0.3, f0: 500, f1: 4000, peak: 0.7, seed: 420 + i }), card - 0.05, 0.22, 0.2);
  c.rates.forEach((_, n) => sfx.add(blip({ f0: 1200 + n * 260, f1: 1700 + n * 260, dur: 0.07 }), card + 0.22 + n * 0.09, 0.13, -0.3 + 0.3 * n));
  // the pull-back to the convoy (not after the arrivals)
  const back = b(RUN_END[i]);
  if (c.convoy) sfx.add(pullBack(400 + i), back, 0.5);
});

// ---------- the phone: a low sweep as it comes in, it powers on (a chime), the swipe, WhatsApp's pop ----------
{
  const P = b(PHONE_AT);
  sfx.add(whoosh({ dur: 0.7, f0: 200, f1: 3000, peak: 0.5, seed: 601 }), P - 0.35, 0.4);
  sfx.add(impact({ dur: 1.2, f0: 110, f1: 36, seed: 603 }), P, 0.7);
  const on = P + b(5);
  sfx.add(blip({ f0: 900, f1: 1400, dur: 0.09 }), on - 0.02, 0.2);
  [76, 83, 88, 92].forEach((m, j) => { const v = bell({ f: mtof(m), dur: 0.9, ratio: 2, index: 1.4, decay: 5, bright: 0.8 }); sfx.add(v, on + j * 0.06, 0.13, -0.2 + 0.15 * j); send.add(v, on + j * 0.06, 0.25); });
  const sw = P + b(PHONE_SWIPE);
  sfx.add(whoosh({ dur: 0.3, f0: 3000, f1: 800, peak: 0.4, seed: 607 }), sw - 0.05, 0.32, 0.3);
  [[88, 0], [95, 0.09]].forEach(([m, d]) => { const v = bell({ f: mtof(m), dur: 0.5, ratio: 1, index: 0.6, decay: 9, bright: 1 }); sfx.add(v, sw + 0.3 + d, 0.16); });
}

// ---------- the chat: a soft key click per character, a swoosh as a message goes, a two-note pop as one comes in ----------
{
  const C = b(PHONE_AT + PHONE_CHAT);
  const key = (seed) => { const n = noise(0.025, seed); filterBuf(n, 'bp', 3800, 1.2); for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / (0.004 * SR)); return n; };
  const KEYS = [key(701), key(702), key(703)];
  CHAT.msgs.forEach((m, j) => {
    const t0 = C + b(m.type), land = C + b(m.land);
    if (m.who === 'me') {
      const n = Array.from(m.text).length;
      for (let i = 1; i <= n; i++) sfx.add(KEYS[i % 3], t0 + i / CHAT_CPS - 0.01, 0.16, ((i * 37) % 7) / 7 - 0.5);
      sfx.add(whoosh({ dur: 0.22, f0: 900, f1: 4500, peak: 0.25, seed: 710 + j }), land - 0.08, 0.2, 0.3);
      sfx.add(blip({ f0: 1500, f1: 2100, dur: 0.06 }), land, 0.1, 0.3);
    } else {
      [[84, 0], [91, 0.08]].forEach(([mm, d]) => { const v = bell({ f: mtof(mm), dur: 0.45, ratio: 1, index: 0.5, decay: 10, bright: 1 }); sfx.add(v, land + d, 0.15, -0.3); });
    }
  });
}

// ---------- end card ----------
{
  const E = b(END_AT);
  sfx.add(whoosh({ dur: 0.6, f0: 300, f1: 7000, peak: 0.6, seed: 501 }), E - 0.4, 0.4);
  sfx.add(impact({ dur: 1.6, f0: 100, f1: 32, seed: 503 }), E, 0.9);
  [[85, 0], [80, BEAT / 2], [85, BEAT]].forEach(([m, d]) => { const v = cowbell(mtof(m)); sfx.add(v, E + 0.05 + d, 0.4); send.add(v, E + 0.05 + d, 0.3); });
  sfx.add(whoosh({ dur: 0.4, f0: 500, f1: 4500, peak: 0.7, seed: 509 }), E + 0.95, 0.25);
  COPY_SOCIALS.forEach((_, n) => sfx.add(blip({ f0: 1300 + n * 250, f1: 1900 + n * 250, dur: 0.07 }), E + 1.75 + n * 0.1, 0.12));
  const e = fadeIO(engine(1.8, (t) => 1500 + 6000 * Math.sin(Math.min(1, t / 1.4) * Math.PI) ** 1.5, { cyl: 8, seed: 505 }), 0.05, 0.2);
  sfx.add(e, OUTRO - b(1), 0.5);
  sfx.add(bangs(1.4, [[1.4, 0.9], [1.52, 0.6], [1.66, 0.5], [1.9, 0.3]], 507), OUTRO - b(1), 0.5);
}

// ---------- mix ----------
const [rvL, rvR] = reverb(send.L, send.R, { fb: 0.8, damp: 0.45 });
const out = new Bus(LEN);
out.mix(drums, 1.0); out.mix(bass, 1.0); out.mix(music, 1.0); out.mix(sfx, 1.0);
for (let i = 0; i < out.n; i++) { out.L[i] += rvL[i] * 0.45; out.R[i] += rvR[i] * 0.45; }
for (let i = 0; i < out.n; i++) {
  const f = Math.min(1, (out.n - i) / (0.08 * SR));
  out.L[i] = Math.tanh(out.L[i] * 0.85) * f;
  out.R[i] = Math.tanh(out.R[i] * 0.85) * f;
}
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const dest = path.join(ROOT, 'out/music_raw.wav');
writeWav(dest, out.L, out.R, fs);
console.log(`wrote ${dest}  ${(out.n / SR).toFixed(2)} s`);

if (process.argv.includes('--report')) {
  const rms = (bus, a, z) => { let s = 0, n = 0; for (let i = Math.round(a * SR); i < Math.min(bus.n, Math.round(z * SR)); i++) { s += bus.L[i] ** 2 + bus.R[i] ** 2; n += 2; } return 20 * Math.log10(Math.sqrt(s / Math.max(1, n)) + 1e-9); };
  for (const [n, a, z] of [['intro', 0, START], ['cars', START, b(END_AT)], ['end', b(END_AT), LEN]])
    console.log(`${n.padEnd(6)} drums ${rms(drums, a, z).toFixed(1)}  bass ${rms(bass, a, z).toFixed(1)}  music ${rms(music, a, z).toFixed(1)}  sfx ${rms(sfx, a, z).toFixed(1)}  total ${rms(out, a, z).toFixed(1)} dBFS`);
}

if (process.argv.includes('--holo')) {
  const rms = (bus, a, z) => { let s = 0, n = 0; for (let i = Math.round(a * SR); i < Math.min(bus.n, Math.round(z * SR)); i++) { s += bus.L[i] ** 2 + bus.R[i] ** 2; n += 2; } return 20 * Math.log10(Math.sqrt(s / Math.max(1, n)) + 1e-9); };
  HITS.forEach((hb, i) => { const a = b(hb) + 0.2, z = b(hb + HOLO_BEATS); console.log(`${CARS[i].id.padEnd(5)} holo: drums ${rms(drums, a, z).toFixed(1)} bass ${rms(bass, a, z).toFixed(1)} music ${rms(music, a, z).toFixed(1)} sfx ${rms(sfx, a, z).toFixed(1)}`); });
}
