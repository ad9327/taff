// Tiny offline synth: every voice renders into Float32Arrays at SR. Deterministic (seeded noise).
export const SR = 48000;

export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const db = (d) => Math.pow(10, d / 20);

export class Bus {
  constructor(seconds) { this.n = Math.ceil(seconds * SR); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
  // add a mono buffer at time t (s) with gain and pan (-1..1)
  add(buf, t, gain = 1, pan = 0) {
    const s0 = Math.round(t * SR);
    const gl = gain * Math.cos((pan + 1) * Math.PI / 4), gr = gain * Math.sin((pan + 1) * Math.PI / 4);
    for (let i = 0; i < buf.length; i++) {
      const j = s0 + i;
      if (j < 0 || j >= this.n) continue;
      this.L[j] += buf[i] * gl;
      this.R[j] += buf[i] * gr;
    }
  }
  addStereo(L, R, t, gain = 1) {
    const s0 = Math.round(t * SR);
    for (let i = 0; i < L.length; i++) { const j = s0 + i; if (j < 0 || j >= this.n) continue; this.L[j] += L[i] * gain; this.R[j] += R[i] * gain; }
  }
  mix(other, gain = 1) { for (let i = 0; i < this.n; i++) { this.L[i] += other.L[i] * gain; this.R[i] += other.R[i] * gain; } }
}

// ---------- filters ----------
export function biquad(type, f, q = 0.707) {
  const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
  else { b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; } // bandpass
  const k = { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; };
}
export function filterBuf(buf, type, f, q) { const fl = biquad(type, f, q); for (let i = 0; i < buf.length; i++) buf[i] = fl(buf[i]); return buf; }
// time-varying filter: fFn(i) gives cutoff per sample (recomputed every 32 samples)
export function sweepFilter(buf, type, fFn, q = 0.9) {
  let fl = null;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let k;
  for (let i = 0; i < buf.length; i++) {
    if (i % 32 === 0) {
      const f = Math.min(SR * 0.45, Math.max(20, fFn(i)));
      const w = 2 * Math.PI * f / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
      let b0, b1, b2, a0, a1, a2;
      if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
      else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
      else { b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * c; a2 = 1 - a; }
      k = { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
    }
    const x = buf[i];
    const y = k.b0 * x + k.b1 * x1 + k.b2 * x2 - k.a1 * y1 - k.a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; buf[i] = y;
  }
  return buf;
}

// ---------- voices ----------
const N = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));

export function kick({ f0 = 160, f1 = 48, dur = 0.32, click = 0.6, drive = 1.6 } = {}) {
  const b = N(dur); let ph = 0;
  const r = rng(7);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = f1 + (f0 - f1) * Math.exp(-t * 38);
    ph += 2 * Math.PI * f / SR;
    const env = Math.exp(-t * 9) * Math.min(1, t * 2000);
    let v = Math.sin(ph) * env;
    if (t < 0.006) v += (r() * 2 - 1) * click * (1 - t / 0.006);
    b[i] = Math.tanh(v * drive) / Math.tanh(drive);
  }
  return b;
}

// 808: sustained sine with a pitch drop at the attack, optional glide from `from`, saturated.
export function eight({ f, dur, from = null, glide = 0.07, drive = 2.2, decay = 1.6 }) {
  const b = N(dur); let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let fr = f * (1 + 0.9 * Math.exp(-t * 55));
    if (from) fr = (from + (f - from) * Math.min(1, t / glide)) * (1 + 0.15 * Math.exp(-t * 40));
    ph += 2 * Math.PI * fr / SR;
    const env = Math.exp(-t * decay) * Math.min(1, t * 900) * Math.min(1, (dur - t) * 200);
    const v = Math.sin(ph) + 0.18 * Math.sin(2 * ph);
    b[i] = Math.tanh(v * env * drive) * 0.85;
  }
  return b;
}

export function snare({ dur = 0.26, tone = 190, seed = 3 } = {}) {
  const b = N(dur); const r = rng(seed); let ph = 0;
  const bp = biquad('bp', 2200, 0.8), hp = biquad('hp', 900);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    ph += 2 * Math.PI * (tone * (1 + 0.5 * Math.exp(-t * 60))) / SR;
    const n = hp(bp(r() * 2 - 1) * 2.2);
    b[i] = (Math.sin(ph) * Math.exp(-t * 28) * 0.55 + n * Math.exp(-t * 16)) * Math.min(1, t * 3000);
  }
  return b;
}

export function clap({ seed = 5 } = {}) {
  const b = N(0.3); const r = rng(seed); const bp = biquad('bp', 1500, 1.1);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let env = 0;
    for (const o of [0, 0.011, 0.022]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) * (o < 0.02 ? 140 : 18)));
    b[i] = bp(r() * 2 - 1) * env * 2.4;
  }
  return b;
}

// 808-style hat: six detuned squares, band-passed, short.
export function hat({ dur = 0.05, open = false, seed = 9 } = {}) {
  const d = open ? 0.32 : dur;
  const b = N(d); const fs = [205.3, 304.4, 369.6, 522.7, 540, 800].map((x) => x * 2.1);
  const hp = biquad('hp', 7000, 0.7), bp = biquad('bp', 10000, 0.6);
  const ph = fs.map(() => 0);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    for (let k = 0; k < fs.length; k++) { ph[k] += fs[k] / SR; v += (ph[k] % 1 < 0.5 ? 1 : -1); }
    const env = Math.exp(-t * (open ? 9 : 70)) * Math.min(1, t * 4000);
    b[i] = hp(bp(v / 6)) * env * 2.2;
  }
  return b;
}

// FM bell / pluck
export function bell({ f, dur = 0.9, ratio = 3.5, index = 2.4, decay = 4.2, bright = 1 } = {}) {
  const b = N(dur); let pc = 0, pm = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    pm += 2 * Math.PI * f * ratio / SR;
    const idx = index * bright * Math.exp(-t * 7);
    pc += 2 * Math.PI * f / SR;
    const env = Math.exp(-t * decay) * Math.min(1, t * 1500);
    b[i] = (Math.sin(pc + idx * Math.sin(pm)) + 0.25 * Math.sin(2 * pc)) * env * 0.6;
  }
  return b;
}

// detuned saw pad, low-passed
export function pad({ notes, dur, cutoff = 1300 }) {
  const b = N(dur);
  const det = [-0.11, 0, 0.13];
  const ph = [];
  for (const m of notes) for (const d of det) ph.push({ f: mtof(m + d), p: 0 });
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const o of ph) { o.p = (o.p + o.f / SR) % 1; v += 2 * o.p - 1; }
    const env = Math.min(1, t / 0.08) * Math.min(1, (dur - t) / 0.12);
    b[i] = v / ph.length * env;
  }
  return filterBuf(filterBuf(b, 'lp', cutoff, 0.6), 'lp', cutoff * 1.4, 0.6);
}

export function noise(dur, seed = 11) { const b = N(dur); const r = rng(seed); for (let i = 0; i < b.length; i++) b[i] = r() * 2 - 1; return b; }

// whoosh: band-passed noise sweeping up or down with a bell envelope
export function whoosh({ dur = 0.5, f0 = 400, f1 = 5000, peak = 0.6, seed = 13 } = {}) {
  const b = noise(dur, seed);
  sweepFilter(b, 'bp', (i) => f0 * Math.pow(f1 / f0, i / b.length), 1.2);
  for (let i = 0; i < b.length; i++) {
    const k = i / b.length;
    const env = k < peak ? Math.pow(k / peak, 2) : Math.pow((1 - k) / (1 - peak), 1.5);
    b[i] *= env * 2.5;
  }
  return b;
}

export function riser({ dur = 1.8, seed = 17 } = {}) {
  const b = noise(dur, seed);
  sweepFilter(b, 'bp', (i) => 300 * Math.pow(30, i / b.length), 2);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const k = i / b.length;
    ph += 2 * Math.PI * (200 * Math.pow(6, k)) / SR;
    b[i] = (b[i] * 1.8 + 0.18 * Math.sin(ph)) * Math.pow(k, 2.2);
  }
  return b;
}

// impact: sub drop + noise crack
export function impact({ dur = 1.6, f0 = 90, f1 = 30, seed = 19 } = {}) {
  const b = N(dur); const r = rng(seed); let ph = 0;
  const lp = biquad('lp', 3500);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    ph += 2 * Math.PI * (f1 + (f0 - f1) * Math.exp(-t * 6)) / SR;
    const sub = Math.sin(ph) * Math.exp(-t * 2.4);
    const crack = lp(r() * 2 - 1) * Math.exp(-t * 7);
    b[i] = Math.tanh((sub * 1.2 + crack * 0.7) * 1.5) * Math.min(1, t * 2000);
  }
  return b;
}

// UI blip (messages, pills)
export function blip({ f0 = 900, f1 = 1500, dur = 0.09 } = {}) {
  const b = N(dur); let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    ph += 2 * Math.PI * (f0 + (f1 - f0) * Math.min(1, t / 0.03)) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 40) * Math.min(1, t * 3000);
  }
  return b;
}

// vinyl crackle bed
export function crackle(dur, seed = 23) {
  const b = N(dur); const r = rng(seed); const hp = biquad('hp', 1200);
  for (let i = 0; i < b.length; i++) {
    let v = (r() * 2 - 1) * 0.02;
    if (r() < 0.0009) v += (r() * 2 - 1) * 0.9;
    b[i] = hp(v);
  }
  return b;
}

// stereo Schroeder reverb
export function reverb(L, R, { mix = 1, fb = 0.78, damp = 0.35 } = {}) {
  const outL = new Float32Array(L.length), outR = new Float32Array(R.length);
  const run = (inp, out, ds) => {
    const combs = ds.map((d) => ({ buf: new Float32Array(Math.round(d * SR / 1000)), i: 0, lp: 0 }));
    const aps = [5.0, 1.7].map((d) => ({ buf: new Float32Array(Math.round(d * SR / 1000)), i: 0 }));
    for (let n = 0; n < inp.length; n++) {
      let s = 0;
      for (const c of combs) {
        const y = c.buf[c.i];
        c.lp = y * (1 - damp) + c.lp * damp;
        c.buf[c.i] = inp[n] * 0.25 + c.lp * fb;
        c.i = (c.i + 1) % c.buf.length;
        s += y;
      }
      for (const a of aps) {
        const y = a.buf[a.i];
        const v = s + y * 0.5;
        a.buf[a.i] = v;
        a.i = (a.i + 1) % a.buf.length;
        s = y - v * 0.5;
      }
      out[n] = s * mix;
    }
  };
  run(L, outL, [29.7, 37.1, 41.1, 43.7]);
  run(R, outR, [31.3, 35.9, 42.7, 45.1]);
  return [outL, outR];
}

export function writeWav(path, L, R, fs) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 8);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 8, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(3, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 8, 28); buf.writeUInt16LE(8, 32); buf.writeUInt16LE(32, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 8, 40);
  for (let i = 0; i < n; i++) { buf.writeFloatLE(L[i], 44 + i * 8); buf.writeFloatLE(R[i], 48 + i * 8); }
  fs.writeFileSync(path, buf);
}
