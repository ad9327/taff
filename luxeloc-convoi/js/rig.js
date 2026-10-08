// The camera on the convoy: which picture is up at time t (a convoy frame, a car's freeze frame, an arrival photo),
// at which convoy time, and the punch-in transform onto the car being presented.
import { b, BEAT, W, H, CONVOY_LEN, RUN_BEATS, segments } from './timeline.mjs';
import { CARS, convoyTime } from './copy.mjs';
import { clamp, ease, lerp } from './engine.js';

export const SEG = segments(CARS.map(convoyTime));
export const PUNCH = 0.2;        // the punch-in, s
export const RETURN = 0.34;      // the pull-back to the convoy after a run, s
export const DIVE = 0.1;         // the end of a hologram dives into the run, s
export const ANCHOR_Y = 1090;    // where the car's centre lands on screen

export function segAt(t) {
  let s = SEG[0];
  for (const g of SEG) if (t >= g.a - 1e-6) s = g;
  return s;
}

// a car's box in layer space (1080×1920)
export function carBox(i) {
  const c = CARS[i];
  if (c.convoy) return c.convoy.box.map((v) => v * 1.5);
  return c.arrival.box.slice();
}

function target(i) {
  const [x0, y0, x1, y1] = carBox(i);
  const lo = CARS[i].arrival ? 1.1 : 1.22;
  return { s: clamp(880 / (x1 - x0), lo, 2.4), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// k: 0 = no zoom, 1 = punched in; extra multiplies the scale around the car
export function zoomXf(i, k, extra = 1) {
  const T = target(i);
  const s = Math.exp(Math.log(T.s) * k) * extra;
  const sx = lerp(T.cx, 540, k), sy = lerp(T.cy, ANCHOR_Y, k);
  const tx = clamp(sx - s * T.cx, W - s * W, 0);
  const ty = clamp(sy - s * T.cy, H - s * H, 0);
  return { s, tx, ty };
}
export const ID = { s: 1, tx: 0, ty: 0 };
export const xfBox = (xf, [x0, y0, x1, y1]) => [xf.s * x0 + xf.tx, xf.s * y0 + xf.ty, xf.s * x1 + xf.tx, xf.s * y1 + xf.ty];

// convoy speed ramp: comes out of the freeze quick, eases into the next car (a touch of slow motion before the hit)
const ramp = (u) => u + 0.38 * u * (1 - u);

// What the picture layer shows at t.
export function view(t) {
  const g = segAt(t);
  const k = t - g.a;
  if (g.kind === 'play') {
    const u = clamp(k / (g.z - g.a));
    const ct = Math.min(CONVOY_LEN - 1 / 60, g.c0 + (g.c1 - g.c0) * ramp(u));
    let xf = ID;
    if (g.from >= 0 && CARS[g.from].convoy) xf = zoomXf(g.from, 1 - ease.inOutCubic(clamp(k / RETURN)), 1.02);
    return { g, src: 'convoy', ct, xf };
  }
  if (g.kind === 'arrive') {
    const u = clamp(k / (g.z - g.a));
    return { g, src: 'photo', photo: CARS[g.car].arrival.photo, xf: zoomXf(g.car, 0, 1.0 + 0.05 * ease.outCubic(u)) };
  }
  if (g.kind === 'holo') {
    const c = CARS[g.car];
    const kz = ease.outExpo(clamp(k / PUNCH));
    const drift = 1 + 0.035 * clamp((k - PUNCH) / (g.z - g.a - PUNCH));
    const dive = 1 + 0.4 * ease.inQuad(clamp((t - (g.z - DIVE)) / DIVE));
    const pre = c.arrival ? 1.05 : 1;
    return { g, src: c.convoy ? 'freeze' : 'photo', photo: c.arrival && c.arrival.photo, car: g.car, xf: zoomXf(g.car, kz, drift * dive * pre), kz };
  }
  return { g, src: 'none' };
}

// the run: shot boundaries in beats from its start
export function runShots(n) {
  const d = n === 5 ? [2, 1, 1, 1, 1] : n === 4 ? [2, 1, 1, 2] : Array(n).fill(RUN_BEATS / n);
  const out = [];
  let a = 0;
  for (const x of d) { out.push([a, a + x]); a += x; }
  return out;
}

// moments that flash / shake the frame
export const FLASHES = [];
export const HITS_T = [];
for (const g of SEG) {
  if (g.kind === 'holo') { FLASHES.push([g.a, 0.55, 12]); HITS_T.push(g.a); FLASHES.push([g.z - 0.02, 0.85, 14]); }
  if (g.kind === 'run') {
    runShots(CARS[g.car].shots.length).slice(1).forEach(([a]) => FLASHES.push([g.a + b(a), 0.22, 16]));
  }
  if (g.kind === 'play' && g.from >= 0) FLASHES.push([g.a, 0.6, 11]);
  if (g.kind === 'arrive') FLASHES.push([g.a, 0.7, 10]);
  if (g.kind === 'end') { FLASHES.push([g.a, 0.9, 7]); HITS_T.push(g.a); }
}
export const beat = BEAT;
