// The hologram: target brackets lock onto the car as it arrives, the camera punches in, a scan line sweeps the car
// and leaves a light grid on it, an emitter on the roof throws a beam up, and the car's name flickers into being in
// the beam — cyan, scan-lined, with a chromatic ghost and glitch slices on its way in.
import { CARS } from '../copy.mjs';
import { SEG, segAt, view, carBox, xfBox, zoomXf, PUNCH, DIVE } from '../rig.js';
import { clamp, ease, set, h, fit, hash, noise1, spring } from '../engine.js';

const CY = '120,240,255';
const LOCK = 0.38;      // the brackets home in during the last LOCK s before the hit

export function build(root) {
  const dim = h('div', 'abs', root);
  Object.assign(dim.style, { width: '1080px', height: '1920px' });
  const grid = h('div', 'abs holo-grid', root);
  const scan = h('div', 'abs holo-scan', root);
  const beam = h('div', 'abs holo-beam', root);
  const emitter = h('div', 'abs holo-emitter', root);
  const br = ['tl', 'tr', 'bl', 'br'].map((c) => h('div', `bracket ${c}`, root));
  const tag = h('div', 'abs holo-tag', root, '');

  const texts = CARS.map((c, i) => {
    const g = h('div', 'abs', root);
    const make = h('div', 'abs holo-make', g, c.make);
    const mk = { el: make, w: make.scrollWidth, h: make.offsetHeight };
    const model = h('div', 'abs holo-text', g, c.model);
    const ms = fit(model, 940, c.model.length > 9 ? 112 : 136);
    const mw = model.scrollWidth, mh = model.offsetHeight;
    const ghosts = ['r', 'b'].map((k) => { const e = h('div', `abs holo-text ghost-${k}`, g, c.model); e.style.fontSize = `${ms}px`; return e; });
    const slices = [0, 1, 2].map(() => { const e = h('div', 'abs holo-text', g, c.model); e.style.fontSize = `${ms}px`; return e; });
    const id = h('div', 'abs holo-id', g, `VÉHICULE ${String(i + 1).padStart(2, '0')} / ${String(CARS.length).padStart(2, '0')}`);
    return { g, mk, model, mw, mh, ghosts, slices, id: { el: id, w: id.scrollWidth } };
  });

  // the holo segment about to start (for the lock-on), if t is in the last LOCK s before it
  const holoSegs = SEG.filter((g) => g.kind === 'holo');
  const nextHolo = (t) => holoSegs.find((g) => t < g.a && t >= g.a - LOCK);

  function brackets(box, o, k) {
    const [x0, y0, x1, y1] = box;
    const L = Math.max(36, Math.min(90, (x1 - x0) * 0.12));
    const pos = [[x0, y0], [x1 - L, y0], [x0, y1 - L], [x1 - L, y1 - L]];
    br.forEach((e, j) => {
      Object.assign(e.style, { width: `${L}px`, height: `${L}px` });
      set(e, { x: pos[j][0], y: pos[j][1], o });
    });
  }

  return (t) => {
    const fr = Math.floor(t * 120);
    const g = segAt(t);
    const nh = nextHolo(t);
    const on = g.kind === 'holo' || nh;
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    texts.forEach((x) => (x.g.style.display = 'none'));

    if (nh) {
      // lock-on: brackets close in from a wide frame onto the car's position at the hit
      const v = view(t);
      const hit = xfBox(v.xf, carBox(nh.car));
      const k = ease.outCubic(clamp((t - (nh.a - LOCK)) / LOCK));
      const cx = (hit[0] + hit[2]) / 2, cy = (hit[1] + hit[3]) / 2;
      const sw = (hit[2] - hit[0]) / 2, shh = (hit[3] - hit[1]) / 2;
      const grow = 1 + 1.4 * (1 - k);
      const box = [Math.max(30, cx - sw * grow), Math.max(230, cy - shh * grow * 1.6), Math.min(1050, cx + sw * grow), Math.min(1600, cy + shh * grow * 1.6)];
      const flick = k < 0.5 ? (hash(fr, 5) > 0.4 ? 1 : 0.2) : 1;
      brackets(box, 0.9 * flick, k);
      tag.innerHTML = 'SCAN';
      set(tag, { x: box[0], y: box[1] - 42, o: 0.85 * flick });
      [dim, grid, scan, beam, emitter].forEach((e) => set(e, { o: 0 }));
      return;
    }

    const i = g.car;
    const k = t - g.a;
    const D = g.z - g.a;
    const v = view(t);
    const box = xfBox(v.xf, carBox(i));
    const [x0, y0, x1, y1] = box;
    const bw = x1 - x0, bh = y1 - y0, cx = (x0 + x1) / 2;
    const out = 1 - clamp((t - (g.z - DIVE)) / DIVE);          // everything goes with the dive

    // dim the street around the car, cyan wash
    dim.style.background = `radial-gradient(ellipse ${(bw * 0.75).toFixed(0)}px ${(bh * 1.4).toFixed(0)}px at ${cx.toFixed(0)}px ${((y0 + y1) / 2).toFixed(0)}px, rgba(0,12,20,0) 0%, rgba(0,12,20,.62) 100%)`;
    set(dim, { o: ease.outCubic(clamp(k / 0.25)) * out });

    brackets([x0 - 18, y0 - 18, x1 + 18, y1 + 18], out, 1);
    tag.innerHTML = `CIBLE ${String(i + 1).padStart(2, '0')}`;
    set(tag, { x: x0 - 18, y: y0 - 60, o: out * (k < 0.25 ? (hash(fr, 9) > 0.3 ? 1 : 0.3) : 1) });

    // scan line + the grid it leaves behind
    const ks = clamp((k - 0.12) / 0.32);
    const sy = y0 - 10 + (bh + 20) * ease.inOutCubic(ks);
    Object.assign(scan.style, { width: `${(bw * 1.12).toFixed(0)}px` });
    set(scan, { x: cx - bw * 0.56, y: sy, o: ks > 0 && ks < 1 ? 1 : 0 });
    Object.assign(grid.style, { width: `${bw.toFixed(0)}px`, height: `${bh.toFixed(0)}px`, clipPath: `inset(0 0 ${((1 - ease.inOutCubic(ks)) * 100).toFixed(1)}% 0)` });
    const gO = ks <= 0 ? 0 : 0.75 - 0.5 * clamp((k - 0.45) / 0.3) + 0.06 * noise1(t * 24, 3);
    set(grid, { x: x0, y: y0, o: gO * out });

    // the name in the beam
    const T = texts[i];
    T.g.style.display = 'block';
    const roof = y0 + bh * 0.1;
    const modelY = Math.max(290, Math.min(roof - 160 - T.mh, 820));
    const makeY = modelY - T.mk.h - 8;
    const kb = clamp((k - 0.2) / 0.18);
    const beamTop = modelY + T.mh * 0.55;
    const topW = Math.max(T.mw * 1.05, 300), botW = Math.max(bw * 0.16, 90);
    Object.assign(beam.style, { width: `${topW.toFixed(0)}px`, height: `${Math.max(10, roof - beamTop).toFixed(0)}px`,
      clipPath: `polygon(0 0, 100% 0, ${(50 + (botW / topW) * 50).toFixed(1)}% 100%, ${(50 - (botW / topW) * 50).toFixed(1)}% 100%)` });
    const flick = 0.85 + 0.15 * noise1(t * 30, 7);
    set(beam, { x: cx - topW / 2, y: beamTop, o: ease.outCubic(kb) * flick * out, sy: 1 });
    beam.style.transformOrigin = '50% 100%';
    beam.style.transform += ` scaleY(${ease.outCubic(kb).toFixed(3)})`;
    set(emitter, { x: cx - 90, y: roof - 16, o: clamp((k - 0.16) / 0.06) * out, sx: 0.3 + 0.7 * ease.outBack(clamp((k - 0.16) / 0.2)) });
    emitter.style.transformOrigin = '90px 16px';

    // text: make, then the model glitching in, then the fleet line
    const km = k - 0.26;
    set(T.mk.el, { x: cx - T.mk.w / 2, y: makeY, o: (km > 0 ? (km < 0.15 ? (hash(fr, 11) > 0.45 ? 1 : 0.15) : 1) : 0) * out });
    const kt = k - 0.3;
    const settle = clamp(kt / 0.3);
    const flickT = kt <= 0 ? 0 : kt < 0.2 ? (hash(fr, 13) > 0.35 ? 1 : 0.25) : 0.92 + 0.08 * noise1(t * 40, 5);
    const sp = spring(kt, 3.2, 0.6);
    const mx = cx - T.mw / 2;
    set(T.model, { x: mx, y: modelY + 16 * (1 - sp), sy: 0.85 + 0.15 * sp, o: flickT * out });
    T.model.style.transformOrigin = '50% 100%';
    T.ghosts.forEach((e, j) => {
      const off = (j ? 1 : -1) * (3 + 14 * (1 - settle) + 2 * noise1(t * 20, 20 + j));
      set(e, { x: mx + off, y: modelY + 16 * (1 - sp), sy: 0.85 + 0.15 * sp, o: 0.55 * flickT * out });
      e.style.transformOrigin = '50% 100%';
    });
    T.slices.forEach((e, j) => {
      const a = hash(Math.floor(t * 30), 40 + j), bnd = hash(Math.floor(t * 30), 50 + j);
      const top = Math.floor(bnd * 80), hgt = 8 + Math.floor(a * 18);
      e.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - hgt)}% 0)`;
      const amt = (1 - settle) * (a - 0.5) * 120;
      set(e, { x: mx + amt, y: modelY, o: kt > 0 && settle < 1 ? flickT * out : 0 });
    });
    const ki = k - 0.5;
    set(T.id.el, { x: cx - T.id.w / 2, y: modelY + T.mh + 6, o: (ki > 0 ? clamp(ki / 0.08) * 0.9 : 0) * out });
  };
}
