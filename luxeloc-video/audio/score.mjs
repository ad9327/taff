// The score: drift phonk at 136 BPM in C# minor — pitched cowbell riff, crushed 808, half-time clap, rolling hats —
// with the car itself as the brand-world sound: the rev with the hook's counter, the limiter before the drop,
// an exhaust bang on the drop, a gear shift on every car. Written on the picture's beat grid (js/timeline.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEAT, BAR, b, CUE, DURATION, carStart, N_CARS, GARAGE_START, GARAGE_END } from '../js/timeline.mjs';
import { SR, Bus, mtof, rng, kick, eight, snare, clap, hat, pad, whoosh, riser, impact, noise, filterBuf, sweepFilter, biquad, reverb, writeWav } from './synth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LEN = DURATION;
const S16 = BEAT / 4;
const N = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));

// ---------- voices of this video ----------
// 808 cowbell, pitched: two squares a fifth-ish apart through a band-pass
function cowbell(f, dur = 0.32) {
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

// engine: firing frequency follows rpmFn(t) (rev/min), a crushed buzz of harmonics, sub-firing burble and intake noise
function engine(dur, rpmFn, { cyl = 6, drive = 3.2, seed = 3, gateFn = null } = {}) {
  const out = N(dur); const r = rng(seed);
  const lp = biquad('lp', 3200, 0.7), nbp = biquad('bp', 900, 0.8);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const rpm = rpmFn(t);
    const f = (rpm / 60) * (cyl / 2);
    ph = (ph + f / SR) % 1; ph2 = (ph2 + (f / 2) / SR) % 1;
    const saw = 2 * ph - 1;
    const burble = Math.sin(2 * Math.PI * ph2) * 0.6;
    const n = nbp(r() * 2 - 1) * (0.4 + rpm / 9000);
    let v = saw * 0.7 + burble + n * 0.8 + Math.sin(2 * Math.PI * ph * 2) * 0.3;
    if (gateFn) v *= gateFn(t);
    out[i] = lp(Math.tanh(v * drive)) * 0.6;
  }
  return out;
}

// exhaust bangs: a handful of sharp low pops with a crackle tail
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

// gear shift: the revs fall, the blow-off hisses down
function shift(seed = 5) {
  const dur = 0.42; const out = N(dur); const r = rng(seed);
  const hiss = noise(dur, seed + 1);
  sweepFilter(hiss, 'bp', (i) => 4200 * Math.pow(0.18, i / hiss.length), 1.4);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph = (ph + (180 - 120 * Math.min(1, t / 0.12)) / SR) % 1;
    const thump = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 18);
    out[i] = Math.tanh(thump * 1.6) * 0.8 + hiss[i] * Math.exp(-t * 7) * 1.4 + (r() * 2 - 1) * Math.exp(-t * 90) * 0.4;
  }
  return out;
}

// ---------- harmony: C# minor; one table for 808, cowbell and pad ----------
const CH = {
  'C#m': { bass: [37, 37, 44, 37], pad: [61, 64, 68, 73] },
  A: { bass: [33, 33, 40, 33], pad: [57, 61, 64, 69] },
  'F#m': { bass: [42, 42, 37, 42], pad: [54, 57, 61, 66] },
  'G#': { bass: [44, 44, 39, 44], pad: [56, 60, 63, 68] },
};
const PROG = ['C#m', 'A', 'F#m', 'G#'];
const chordAt = (bar) => CH[PROG[((bar % 4) + 4) % 4]];
// the riff: 16 steps, MIDI or null (two variants, alternating bars)
const RIFF = [
  [85, null, 80, null, 85, null, 83, 80, null, 76, null, 78, 80, null, 76, null],
  [85, null, 80, null, 85, null, 88, 87, null, 85, null, 83, 80, null, 78, 76],
];
const NBARS = Math.ceil(LEN / BAR);

// ---------- buses ----------
const drums = new Bus(LEN), bass = new Bus(LEN), music = new Bus(LEN), sfx = new Bus(LEN), send = new Bus(LEN);
const BUILD0 = CUE.dream, DROP = CUE.drop, LIMIT = CUE.limiter;
const quiet = (t) => t >= BUILD0 && t < DROP;           // the build strips the beat back to the engine
const OUTRO = b(68);

const K = kick({ f0: 190, f1: 46, dur: 0.38, click: 0.8, drive: 3 });
const CL = clap({ seed: 21 });
const SN = snare({ tone: 210, seed: 23 });
const HC = hat({ dur: 0.04, seed: 25 });
const HO = hat({ open: true, seed: 27 });

for (let bar = 0; bar < NBARS; bar++) {
  const t0 = bar * BAR;
  // kick: phonk bounce
  for (const s of [0, 3, 6, 10, 11]) {
    const t = t0 + s * S16;
    if (t >= LEN || quiet(t) || (s === 11 && bar % 2 === 0) || t > OUTRO + b(1.5)) continue;
    drums.add(K, t, 0.9);
  }
  // clap + snare on beat 3, a ghost on the "a" of 4
  { const t = t0 + 8 * S16;
    if (!quiet(t) && t < LEN && t < OUTRO + b(1.5)) { drums.add(CL, t, 0.55, -0.1); drums.add(SN, t + 0.003, 0.35, 0.1); send.add(CL, t, 0.25); }
    const g = t0 + 15 * S16; if (!quiet(g) && g < LEN && bar % 2 && g < OUTRO) drums.add(SN, g, 0.14, 0.2); }
  // hats: 16ths with accents, triplet rolls every other bar
  for (let s = 0; s < 16; s++) {
    const t = t0 + s * S16;
    if (t >= LEN || quiet(t) || t > OUTRO + b(1.5)) continue;
    if (bar % 2 === 1 && s >= 12) continue;
    drums.add(HC, t, (s % 4 === 0 ? 0.24 : s % 2 === 0 ? 0.17 : 0.1), Math.sin(s * 1.3) * 0.25);
  }
  if (bar % 2 === 1) for (let i = 0; i < 6; i++) { const t = t0 + 12 * S16 + i * (4 * S16 / 6); if (!quiet(t) && t < LEN && t < OUTRO) drums.add(HC, t, 0.12 + 0.03 * i, 0.2); }
  { const t = t0 + 14 * S16; if (!quiet(t) && t < LEN && t < OUTRO && bar % 4 === 3) drums.add(HO, t, 0.12, 0.3); }

  // 808 under the kick, sliding into the next chord
  const ch = chordAt(bar);
  [[0, 0], [6, 1], [10, 2], [14, 3]].forEach(([s, j], n) => {
    const t = t0 + s * S16;
    if (t >= LEN || quiet(t) || t > OUTRO + b(1)) return;
    const len = (n < 3 ? [6, 4, 4][n] : 2) * S16 + 0.02;
    const from = n === 3 ? mtof(ch.bass[2] + 12) : null;
    bass.add(eight({ f: mtof(ch.bass[j] + 12), dur: len + 0.15, from, glide: 0.06, drive: 3.6, decay: 2.2 }), t, 0.55);
  });

  // cowbell riff (the hook of the genre), one octave down in the first bar of the build-up
  RIFF[bar % 2].forEach((m, s) => {
    if (m == null) return;
    const t = t0 + s * S16;
    if (t >= LEN || quiet(t) || t > OUTRO + b(2)) return;
    const v = cowbell(mtof(m - 12));
    music.add(v, t, 0.85, s % 2 ? 0.25 : -0.25);
    send.add(v, t, 0.25);
  });
  // dark pad from the drop on
  if (t0 >= DROP && t0 < OUTRO + BAR) {
    const p = pad({ notes: ch.pad.map((m) => m - 12), dur: Math.min(BAR, LEN - t0) + 0.05, cutoff: 900 });
    music.add(p, t0, 0.22, -0.2); music.add(p, t0 + 0.011, 0.22, 0.2);
  }
}

// ---------- the build: the engine climbs with the rev counter, the limiter stutters, silence, the drop ----------
{
  const dur = DROP - BUILD0 - b(0.15);
  const rise = LIMIT - BUILD0;
  const rpmFn = (t) => (t < rise ? 1100 + 6700 * Math.pow(t / rise, 2) : 7600 + 300 * Math.abs(Math.sin((t - rise) * 38)));
  const gateFn = (t) => (t < rise ? 1 : (Math.floor((t - rise) * 16) % 2 ? 0.25 : 1));
  const e = engine(dur, rpmFn, { gateFn });
  for (let i = 0; i < e.length; i++) e[i] *= Math.min(1, i / (0.05 * SR)) * Math.min(1, (e.length - i) / (0.03 * SR));
  sfx.add(e, BUILD0, 0.85, 0);
  sfx.add(riser({ dur: dur, seed: 31 }), BUILD0, 0.25);
}
// the hook's cuts: a hit per car
CUE.flips.forEach((c, i) => {
  sfx.add(impact({ dur: 0.45, f0: 150, f1: 55, seed: 40 + i }), Math.max(0, c - 0.01), 0.42);
  sfx.add(whoosh({ dur: 0.22, f0: 2000, f1: 6000, peak: 0.3, seed: 50 + i }), Math.max(0, c - 0.12), 0.18, i % 2 ? 0.4 : -0.4);
});
// the drop: impact, exhaust bangs, the riff's first notes as a sonic logo
sfx.add(impact({ dur: 1.8, f0: 95, f1: 30, seed: 61 }), DROP, 0.95);
sfx.add(bangs(1.2, [[0.0, 1], [0.13, 0.7], [0.21, 0.5], [0.42, 0.6], [0.55, 0.35]], 63), DROP, 0.55);
[[85, 0], [80, BEAT / 2], [85, BEAT]].forEach(([m, d]) => { const v = cowbell(mtof(m)); sfx.add(v, DROP + d, 0.4, 0); send.add(v, DROP + d, 0.3); });

// the garage: a gear shift on each car, a whoosh on each beam and each second shot
for (let i = 0; i < N_CARS; i++) {
  const s = carStart(i);
  if (i > 0) sfx.add(whoosh({ dur: 0.5, f0: 300, f1: 7000, peak: 0.55, seed: 70 + i }), s - b(0.35), 0.38, i % 2 ? 0.3 : -0.3);
  sfx.add(shift(80 + i), s - 0.02, 0.5, 0);
  sfx.add(whoosh({ dur: 0.34, f0: 1200, f1: 5000, peak: 0.45, seed: 90 + i }), s + b(3) - 0.15, 0.3, 0.4);
  // a short rev on the GT3, the last and loudest
  if (i === N_CARS - 1) {
    const e = engine(1.1, (t) => 2500 + 6000 * Math.sin(Math.min(1, t / 0.9) * Math.PI) ** 2, { cyl: 6, drive: 3.6, seed: 97 });
    for (let k = 0; k < e.length; k++) e[k] *= Math.min(1, k / (0.03 * SR)) * Math.min(1, (e.length - k) / (0.1 * SR));
    sfx.add(e, s + 0.15, 0.45, 0);
    sfx.add(bangs(0.8, [[0.95, 0.8], [1.06, 0.5], [1.2, 0.4]], 99), s + 0.15, 0.4);
  }
}
// scene beam into the garage and into the end card
sfx.add(whoosh({ dur: 0.6, f0: 300, f1: 7000, peak: 0.6, seed: 101 }), b(15.5) - 0.1, 0.4);
sfx.add(whoosh({ dur: 0.8, f0: 300, f1: 7000, peak: 0.6, seed: 103 }), b(57.75) - 0.1, 0.42);
// end card: impact, the sonic logo again, and a last rev with bangs over the outro
sfx.add(impact({ dur: 1.4, f0: 100, f1: 34, seed: 105 }), CUE.endIn, 0.8);
[[85, 0], [80, BEAT / 2], [85, BEAT]].forEach(([m, d]) => { const v = cowbell(mtof(m)); sfx.add(v, CUE.endIn + 0.05 + d, 0.36); send.add(v, CUE.endIn + 0.05 + d, 0.3); });
{
  const e = engine(1.6, (t) => 1500 + 6500 * Math.sin(Math.min(1, t / 1.3) * Math.PI) ** 1.5, { seed: 107 });
  for (let k = 0; k < e.length; k++) e[k] *= Math.min(1, k / (0.05 * SR)) * Math.min(1, (e.length - k) / (0.2 * SR));
  sfx.add(e, OUTRO + b(1.6), 0.5);
  sfx.add(bangs(1.0, [[1.35, 0.9], [1.47, 0.6], [1.6, 0.5], [1.85, 0.3]], 109), OUTRO + b(1.6), 0.5);
}

// ---------- mix ----------
const [rvL, rvR] = reverb(send.L, send.R, { fb: 0.78, damp: 0.45 });
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
  for (const [n, a, z] of [['hook', 0, BUILD0], ['build', BUILD0, DROP], ['logo', DROP, b(GARAGE_START)], ['garage', b(GARAGE_START), b(GARAGE_END)], ['end', b(GARAGE_END), OUTRO]])
    console.log(`${n.padEnd(7)} drums ${rms(drums, a, z).toFixed(1)}  bass ${rms(bass, a, z).toFixed(1)}  music ${rms(music, a, z).toFixed(1)}  sfx ${rms(sfx, a, z).toFixed(1)}  total ${rms(out, a, z).toFixed(1)} dBFS`);
}
