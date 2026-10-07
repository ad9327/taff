// The score: dark trap at 140 BPM in F minor, written on the picture's beat grid (js/timeline.mjs).
// node audio/score.mjs [--report]  →  out/music_raw.wav (then tools/master.sh normalises to -14 LUFS)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEAT, BAR, b, CUE, DURATION, WHIPS } from '../js/timeline.mjs';
import { SR, Bus, mtof, kick, eight, snare, clap, hat, bell, pad, whoosh, riser, impact, blip, crackle, reverb, noise, filterBuf, writeWav, rng } from './synth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TAIL = 0.0;
const LEN = DURATION + TAIL;
const S16 = BEAT / 4;

// ---------- harmony: one table drives bass, bell and pad ----------
// bars 0–1 (hook) sit on iv–V so the drop lands on the tonic
const CHORDS = {
  Fm: { root: 41, pad: [53, 56, 60, 65], mel: [80, 84, 77, 84, 80, 79, 77, 72], bass: [41, 41, 48, 39] },
  Db: { root: 37, pad: [49, 53, 56, 60], mel: [80, 77, 73, 77, 80, 82, 80, 77], bass: [37, 37, 44, 41] },
  Bbm: { root: 34, pad: [49, 53, 58, 61], mel: [77, 85, 82, 77, 73, 77, 82, 80], bass: [34, 34, 41, 37] },
  C: { root: 36, pad: [48, 52, 55, 58], mel: [79, 76, 72, 76, 79, 84, 85, 84], bass: [36, 36, 43, 48] },
};
const PROG = ['Fm', 'Db', 'Bbm', 'C'];
const chordAt = (bar) => (bar < 2 ? CHORDS[['Bbm', 'C'][bar]] : CHORDS[PROG[(bar - 2) % 4]]);
const NBARS = Math.ceil(DURATION / BAR);

// section of a beat → energy shape
const beatOf = (t) => t / BEAT;
const section = (beat) => (beat < 8 ? 'hook' : beat < 19.5 ? 'logo' : beat < 35.5 ? 'services' : beat < 47.5 ? 'chat' : beat < 55.5 ? 'tarifs' : beat < 63.5 ? 'packs' : 'end');

// ---------- buses ----------
const drums = new Bus(LEN), bass = new Bus(LEN), music = new Bus(LEN), sfx = new Bus(LEN), send = new Bus(LEN);

// hook gap: the music stops for the tape stop and the silence before the drop
const DROP = CUE.drop;
const GAP0 = CUE.tapeStop;
const inGap = (t) => t >= GAP0 && t < DROP;
const END_STOP = b(74);

// ---------- drums ----------
const K = kick();
const SN = snare();
const CL = clap();
const HC = hat();
const HC2 = hat({ dur: 0.035, seed: 4 });
const HO = hat({ open: true });

for (let bar = 0; bar < NBARS; bar++) {
  const t0 = bar * BAR;
  const sec = section(beatOf(t0));
  // kick
  for (const s of [0, 6, 10]) {
    const t = t0 + s * S16;
    if (t >= LEN || inGap(t) || t >= END_STOP + b(1.5)) continue;
    drums.add(K, t, 0.95);
  }
  // snare + clap on beat 3 (half-time), ghosts on some bars
  {
    const t = t0 + 8 * S16;
    if (!inGap(t) && t < LEN && t < END_STOP + b(1.5)) {
      drums.add(SN, t, 0.62, 0.05); drums.add(CL, t + 0.004, 0.42, -0.1);
      send.add(SN, t, 0.22); send.add(CL, t, 0.15);
    }
    if (bar % 2 === 1 && bar !== 1) drums.add(SN, t0 + 15 * S16, 0.16, 0.2);
  }
  // hats: 8ths with trap rolls
  const hits = [];
  for (let s = 0; s < 16; s += 2) hits.push([s, s % 4 === 0 ? 1 : 0.72]);
  if (bar >= 2) {
    if (bar % 4 === 1) { hits.splice(hits.findIndex((h) => h[0] === 12)); for (let i = 0; i < 8; i++) hits.push([12 + i * 0.5, 0.45 + 0.5 * (i / 7)]); }
    if (bar % 4 === 3) { hits.splice(2, 2); for (let i = 0; i < 6; i++) hits.push([4 + i * (4 / 6), 0.5 + 0.08 * i]); }
    if (bar % 2 === 0) { hits.push([7, 0.5], [15, 0.55]); }
    if (bar % 4 === 2) { hits.push([13, 0.4], [13.5, 0.45]); }
  }
  for (const [s, v] of hits) {
    const t = t0 + s * S16;
    if (t >= LEN || inGap(t) || t >= END_STOP + b(1.5)) continue;
    const pan = Math.sin(s * 1.7) * 0.25;
    drums.add(s % 1 ? HC2 : HC, t, 0.26 * v, pan);
  }
  // open hat on the "and" of 4 in the high sections
  if (['tarifs', 'packs', 'end'].includes(sec) || (bar >= 2 && bar % 4 === 0)) {
    const t = t0 + 14 * S16;
    if (t < END_STOP) drums.add(HO, t, 0.12, 0.3);
  }
}
// snare roll building into the tape stop (hook bar 1)
for (let i = 0; i < 12; i++) {
  const t = b(4) + i * S16 * (i < 8 ? 1 : 0.5) + (i >= 8 ? 8 * S16 * 0.5 : 0);
  if (t >= GAP0) break;
  drums.add(SN, t, 0.18 + 0.4 * (i / 11), 0.1 * Math.sin(i));
}

// ---------- 808 (monophonic: each note runs until the next) ----------
const bassEvents = [];
for (let bar = 0; bar < NBARS; bar++) {
  const ch = chordAt(bar);
  const steps = [0, 6, 10, 14];
  steps.forEach((s, i) => bassEvents.push({ t: bar * BAR + s * S16, m: ch.bass[i] + 12, glide: i === 3 }));
}
for (let i = 0; i < bassEvents.length; i++) {
  const e = bassEvents[i];
  if (e.t >= LEN || inGap(e.t) || e.t >= END_STOP) continue;
  const next = bassEvents[i + 1];
  let end = next ? next.t : LEN;
  if (e.t < GAP0 && end > GAP0) end = GAP0 + 0.6;        // tape stop eats the tail
  if (e.t < END_STOP && end > END_STOP) end = END_STOP + 0.8;
  const prev = bassEvents[i - 1];
  const buf = eight({ f: mtof(e.m), dur: Math.min(end - e.t, 1.6), from: e.glide && prev ? mtof(prev.m) : null });
  bass.add(buf, e.t, 0.62);
}

// ---------- bell melody + pad ----------
for (let bar = 0; bar < NBARS; bar++) {
  const ch = chordAt(bar);
  const t0 = bar * BAR;
  const sec = section(beatOf(t0));
  const soft = sec === 'chat';
  ch.mel.forEach((m, i) => {
    if ((bar + i) % 4 === 3 && i % 2 === 1) return;         // breathe
    const t = t0 + i * 2 * S16;
    if (t >= LEN || inGap(t) || t >= END_STOP + b(1)) return;
    const note = soft ? m - 12 : m;
    const v = bell({ f: mtof(note), dur: 0.8, index: soft ? 1.2 : 2.4, decay: soft ? 5 : 4.2 });
    const g = (sec === 'hook' ? 0.55 : soft ? 0.6 : 0.5) * (i % 2 ? 0.8 : 1);
    music.add(v, t, g, (i % 2 ? 0.35 : -0.35));
    send.add(v, t, g * 0.7, 0);
  });
  if (bar >= 2 && t0 < END_STOP) {
    const p = pad({ notes: ch.pad, dur: Math.min(BAR, LEN - t0) + 0.05, cutoff: soft ? 1700 : 1100 });
    music.add(p, t0, soft ? 0.42 : 0.3, -0.15);
    music.add(p, t0 + 0.012, soft ? 0.42 : 0.3, 0.15);
  }
}

// ---------- tape stop (studio tape slowing to a halt) ----------
function tapeStop(bus, a, z) {
  const D = z - a;
  for (const ch of [bus.L, bus.R]) {
    const src = Float32Array.from(ch);
    const s0 = Math.round(a * SR), s1 = Math.round(z * SR);
    for (let j = s0; j < Math.min(s1, ch.length); j++) {
      const u = (j - s0) / SR;
      const pos = a + u - (u * u) / (2 * D);           // rate falls linearly to 0
      const x = pos * SR, i0 = Math.floor(x), fr = x - i0;
      const v = (src[i0] || 0) * (1 - fr) + (src[i0 + 1] || 0) * fr;
      ch[j] = v * Math.min(1, (s1 - j) / (0.05 * SR));
    }
  }
}
for (const bus of [drums, bass, music, send]) {
  tapeStop(bus, GAP0, b(7.4));
  // silence until the drop
  for (const ch of [bus.L, bus.R]) for (let j = Math.round(b(7.4) * SR); j < Math.round(DROP * SR); j++) ch[j] = 0;
  tapeStop(bus, END_STOP, END_STOP + b(1.6));
}

// ---------- SFX, placed from the same cues as the picture ----------
const BIG = impact();
const MID = impact({ dur: 1.0, f0: 120, f1: 45, seed: 29 });
const THUMP = impact({ dur: 0.5, f0: 140, f1: 50, seed: 31 });
const crash = (() => { const n = filterBuf(noise(2.4, 37), 'hp', 3000); for (let i = 0; i < n.length; i++) n[i] *= Math.exp(-i / SR * 1.6) * 0.5; return n; })();
const sonicLogo = (t, g = 1) => {
  [[84, 0], [80, BEAT / 2], [89, BEAT]].forEach(([m, d]) => {
    const v = bell({ f: mtof(m), dur: 1.6, index: 3, decay: 2.2 });
    sfx.add(v, t + d, 0.28 * g, d === 0 ? -0.2 : d < BEAT ? 0.2 : 0);
    send.add(v, t + d, 0.3 * g);
  });
};
const tick = (t, g = 0.18) => sfx.add(blip({ f0: 2400, f1: 2000, dur: 0.04 }), t, g);

// hook slams
for (const c of [CUE.hook1, CUE.hook2, CUE.hook3]) { sfx.add(THUMP, Math.max(0, c), 0.5); sfx.add(CL, Math.max(0, c), 0.25); }
// crackle (the record)
{ const c = crackle(LEN); for (let i = 0; i < c.length; i++) c[i] *= i / SR < DROP ? 1 : 0.35; sfx.add(c, 0, 0.35); }
// ring closing: rising shimmer
[72, 75, 79, 84, 87, 91].forEach((m, i) => { const v = bell({ f: mtof(m), dur: 0.6, index: 1.5, decay: 6 }); sfx.add(v, CUE.ringForm + i * S16 / 2, 0.08, (i % 2 ? 0.4 : -0.4)); send.add(v, CUE.ringForm + i * S16 / 2, 0.08); });
// riser into the tape stop, a breath in the gap
sfx.add(riser({ dur: b(3.4) }), b(4), 0.32);
sfx.add(whoosh({ dur: b(0.7), f0: 3000, f1: 300, peak: 0.85, seed: 41 }), b(7.3), 0.25);
// the drop
sfx.add(BIG, DROP, 0.95); sfx.add(crash, DROP, 0.5, -0.2); sfx.add(crash, DROP + 0.01, 0.5, 0.2); send.add(crash, DROP, 0.3);
sonicLogo(DROP + BEAT * 0.5);
// whooshes on every fast move
WHIPS.forEach((w, i) => {
  if (i === 0) return;
  const d = w.dur + 0.35;
  sfx.add(whoosh({ dur: d, f0: 300, f1: 6000, peak: 0.6, seed: 50 + i }), w.at - 0.12, 0.42, i % 2 ? 0.3 : -0.3);
});
// logo facts
sfx.add(whoosh({ dur: 0.35, f0: 800, f1: 5000, seed: 61 }), CUE.studioLabel - 0.1, 0.25, -0.2); tick(CUE.studioLabel + 0.05);
tick(CUE.pill1, 0.2); tick(CUE.pill2, 0.2);
{ const v = bell({ f: mtof(96), dur: 1.0, index: 0.8, decay: 4 }); sfx.add(v, CUE.tagline, 0.08); send.add(v, CUE.tagline, 0.12); }
// services
sfx.add(THUMP, CUE.servicesIn, 0.55); sfx.add(CL, CUE.servicesIn, 0.25);
[CUE.card1, CUE.card2, CUE.card3, CUE.card4].forEach((c, i) => { sfx.add(whoosh({ dur: 0.32, f0: 900, f1: 4000, peak: 0.4, seed: 70 + i }), c - 0.08, 0.32, 0.4 - 0.8 * (i % 2)); tick(c + 0.05, 0.16); });
for (let i = 0; i < 4; i++) sfx.add(blip({ f0: 1200 + 150 * i, f1: 1600 + 150 * i }), CUE.grid + 0.1 + i * 0.07, 0.13, -0.3 + 0.2 * i);
// chat
sfx.add(THUMP, CUE.chatIn, 0.45);
sfx.add(whoosh({ dur: 0.5, f0: 250, f1: 2800, peak: 0.7, seed: 83 }), CUE.phoneIn - 0.25, 0.3, 0.2);
[CUE.msg1, CUE.msg2, CUE.msg3, CUE.msg4, CUE.msg5].forEach((c, i) => {
  const me = i % 2 === 0;
  sfx.add(blip(me ? { f0: 880, f1: 1480 } : { f0: 1320, f1: 990 }), c, 0.32, me ? 0.25 : -0.25);
  if (!me) sfx.add(blip({ f0: 1760, f1: 1700, dur: 0.06 }), c + 0.07, 0.15, -0.25);
});
tick(CUE.msg5 + 0.2, 0.14);
// price boards: ticks while the number rolls, a bright ding on the landing
const ding = (t) => { const v = bell({ f: mtof(100), dur: 0.7, ratio: 1.41, index: 2, decay: 5 }); sfx.add(v, t, 0.17, 0.15); send.add(v, t, 0.15); sfx.add(blip({ f0: 3200, f1: 3000, dur: 0.05 }), t, 0.1); };
sfx.add(MID, CUE.tarifsIn, 0.6);
sfx.add(MID, CUE.packsIn, 0.45);
for (const c of [CUE.price1, CUE.price2, CUE.price3, CUE.pack1, CUE.pack2, CUE.pack3]) {
  sfx.add(whoosh({ dur: 0.3, f0: 600, f1: 3000, peak: 0.5, seed: Math.round(c * 10) }), c - 0.06, 0.22);
  for (let i = 0; i < 6; i++) tick(c + 0.06 + i * 0.065, 0.06 + 0.02 * i);
  ding(c + 0.48);
}
sfx.add(blip({ f0: 1000, f1: 1600 }), CUE.packCta, 0.22);
// end card
sfx.add(BIG, CUE.endIn, 0.8); sfx.add(crash, CUE.endIn, 0.35); sonicLogo(CUE.endIn + 0.1, 0.9);
sfx.add(THUMP, CUE.endPhone, 0.5); ding(CUE.endPhone + 0.1);
for (const c of [CUE.endSocial, CUE.endMail, CUE.endAddr]) sfx.add(blip({ f0: 1100, f1: 1500 }), c, 0.16);
// final: the tape stops on the end card, a last bell rings out
{ const v = bell({ f: mtof(77), dur: 2.0, index: 2.4, decay: 1.8 }); sfx.add(v, END_STOP + b(1.6), 0.22); send.add(v, END_STOP + b(1.6), 0.35); }

// ---------- mix ----------
const [rvL, rvR] = reverb(send.L, send.R, { fb: 0.8, damp: 0.4 });
const out = new Bus(LEN);
out.mix(drums, 1.0); out.mix(bass, 1.0); out.mix(music, 1.0); out.mix(sfx, 1.0);
for (let i = 0; i < out.n; i++) { out.L[i] += rvL[i] * 0.55; out.R[i] += rvR[i] * 0.55; }
// glue: gentle saturation, fade the last 60 ms
for (let i = 0; i < out.n; i++) {
  const f = Math.min(1, (out.n - i) / (0.06 * SR));
  out.L[i] = Math.tanh(out.L[i] * 0.8) * f;
  out.R[i] = Math.tanh(out.R[i] * 0.8) * f;
}
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const dest = path.join(ROOT, 'out/music_raw.wav');
writeWav(dest, out.L, out.R, fs);
console.log(`wrote ${dest}  ${(out.n / SR).toFixed(2)} s`);

if (process.argv.includes('--report')) {
  const rms = (bus, a, z) => { let s = 0, n = 0; for (let i = Math.round(a * SR); i < Math.min(bus.n, Math.round(z * SR)); i++) { s += bus.L[i] ** 2 + bus.R[i] ** 2; n += 2; } return 20 * Math.log10(Math.sqrt(s / Math.max(1, n)) + 1e-9); };
  const secs = [['hook', 0, b(6.5)], ['logo', b(8), b(19.5)], ['services', b(19.5), b(35.5)], ['chat', b(35.5), b(47.5)], ['tarifs', b(47.5), b(55.5)], ['packs', b(55.5), b(63.5)], ['end', b(63.5), b(74)]];
  for (const [n, a, z] of secs) console.log(`${n.padEnd(9)} drums ${rms(drums, a, z).toFixed(1)}  bass ${rms(bass, a, z).toFixed(1)}  music ${rms(music, a, z).toFixed(1)}  sfx ${rms(sfx, a, z).toFixed(1)}  total ${rms(out, a, z).toFixed(1)} dBFS`);
}
