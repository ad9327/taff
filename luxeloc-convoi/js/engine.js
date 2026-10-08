// Frame-pure helpers: every value is a function of time, nothing reads a clock.
export const clamp = (x, a = 0, z = 1) => Math.min(z, Math.max(a, x));
export const lerp = (a, z, k) => a + (z - a) * k;
export const inv = (a, z, x) => clamp((x - a) / (z - a));
export const mix = (a, z, k) => a + (z - a) * clamp(k);

export const ease = {
  linear: (k) => k,
  inQuad: (k) => k * k,
  outQuad: (k) => 1 - (1 - k) * (1 - k),
  inCubic: (k) => k * k * k,
  outCubic: (k) => 1 - Math.pow(1 - k, 3),
  inOutCubic: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  inQuart: (k) => k * k * k * k,
  outQuart: (k) => 1 - Math.pow(1 - k, 4),
  outQuint: (k) => 1 - Math.pow(1 - k, 5),
  inExpo: (k) => (k <= 0 ? 0 : Math.pow(2, 10 * k - 10)),
  outExpo: (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  inOutExpo: (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2),
  outBack: (k, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
};

// Eased progress of a tween that starts at `a` and lasts `d` seconds.
export const tw = (t, a, d, fn = ease.outCubic) => fn(clamp((t - a) / d));

// Damped spring step response (0 → 1 with overshoot). t in seconds since the kick.
export function spring(t, freq = 3.2, damp = 0.5) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const z = Math.min(damp, 0.999);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}

// Deterministic hash → [0, 1).
export function hash(i, seed = 0) {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(seed | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Smooth 1D value noise in [-1, 1].
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i, seed) * 2 - 1, hash(i + 1, seed) * 2 - 1, u);
}

// Decaying shake from a list of hit times.
export function shake(t, hits, amp = 14, decay = 9, seed = 1) {
  let x = 0, y = 0, r = 0;
  for (const h of hits) {
    const d = t - h;
    if (d < 0 || d > 0.8) continue;
    const k = Math.exp(-decay * d);
    x += noise1(d * 38, seed + h * 7) * amp * k;
    y += noise1(d * 41, seed + 11 + h * 7) * amp * k;
    r += noise1(d * 30, seed + 23 + h * 7) * amp * 0.04 * k;
  }
  return { x, y, r };
}

// Write the whole transform every frame.
export function set(el, p = {}) {
  const x = p.x || 0, y = p.y || 0, s = p.s ?? 1, sx = (p.sx ?? 1) * s, sy = (p.sy ?? 1) * s;
  const r = p.r || 0, rx = p.rx || 0, ry = p.ry || 0, z = p.z || 0;
  // 2D unless the element really turns in 3D: 3D transforms promote layers whose raster Chrome caches across scales
  let tr = rx || ry || z ? `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(1)}px)` : `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  if (rx) tr += ` rotateX(${rx.toFixed(3)}deg)`;
  if (ry) tr += ` rotateY(${ry.toFixed(3)}deg)`;
  if (r) tr += ` rotate(${r.toFixed(3)}deg)`;
  tr += ` scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  el.style.transform = tr;
  const o = clamp(p.o ?? 1);
  el.style.opacity = o.toFixed(3);
  el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
  const blur = p.blur || 0;
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
}

export function h(tag, cls, parent, html) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html != null) el.innerHTML = html;
  if (parent) parent.appendChild(el);
  return el;
}

// Wipe-in for a label box: 0 → hidden, 1 → full. Direction 'l' | 'r' | 'u' | 'd'.
export function wipe(el, k, dir = 'l') {
  const p = ((1 - clamp(k)) * 100).toFixed(2);
  const ins = { l: `0 ${p}% 0 0`, r: `0 0 0 ${p}%`, u: `${p}% 0 0 0`, d: `0 0 ${p}% 0` }[dir];
  el.style.clipPath = `inset(${ins})`;
}

// Euro price formatting.
export const euro = (n) => `${Math.round(n)}€`;

// Shrink an element's font until it fits `maxW` px.
export function fit(el, maxW, size) {
  let s = size;
  el.style.fontSize = `${s}px`;
  while (el.scrollWidth > maxW && s > 10) { s -= 2; el.style.fontSize = `${s}px`; }
  return s;
}

// Time snapped to the output frame (60 fps) so text never shows two values in one blurred frame.
export const snap = (t, fps = 60) => Math.floor(t * fps + 1e-6) / fps;

// Pulse on every beat after `from`: 1 at the beat, decaying.
export function beatPulse(t, beat, from = 0, decay = 7) {
  if (t < from) return 0;
  const k = ((t - from) % beat + beat) % beat;
  return Math.exp(-decay * k);
}
