// The run: the car's photos and clips cut on the beat, each with a slow push or pull, the name top-left
// (make in gold, model in chrome, its number in the fleet), a progress tick per shot, and the price bottom-left.
import { CARS, COPY } from '../copy.mjs';
import { b } from '../timeline.mjs';
import { segAt, runShots } from '../rig.js';
import { clamp, ease, spring, set, h, wipe } from '../engine.js';
import { chrome } from './ui.js';

const pad = (n) => String(n).padStart(4, '0');

export function build(root, ctx) {
  const cars = CARS.map((c, i) => {
    const g = h('div', 'abs', root);
    const shots = c.shots.map((s) => {
      const box = h('div', 'shot', g);
      Object.assign(box.style, { width: '1080px', height: '1920px' });
      const img = h('img', '', box);
      img.decoding = 'sync';
      const clip = typeof s === 'object' ? s : null;
      if (!clip) img.src = `assets/media/cars/${s}.jpg`;
      return { box, img, clip, last: '' };
    });
    const span = runShots(shots.length);

    const topShade = h('div', 'abs shade-top', g);
    const botShade = h('div', 'abs shade-bot', g);
    const make = h('div', 'abs run-make', g, `<span class="idx">${String(i + 1).padStart(2, '0')}/${String(CARS.length).padStart(2, '0')}</span>${c.make}`);
    const model = chrome(g, c.model, 92, 900);
    const ticks = shots.map(() => h('div', 'abs run-tick', g));
    const pre = h('div', 'abs run-pre', g, COPY.pricePrefix);
    const price = h('div', 'abs run-price goldtext', g, `${c.price}&#8239;€`);
    const unit = h('div', 'abs run-unit', g, COPY.priceUnit);
    const pw = price.scrollWidth;
    g.style.display = 'none';           // measured above while visible
    return { g, shots, span, make, model, ticks, pre, price, pw, unit };
  });

  return (t) => {
    const g = segAt(t);
    cars.forEach((c) => (c.g.style.display = 'none'));
    if (g.kind !== 'run') { root.style.display = 'none'; return; }
    root.style.display = 'block';
    const C = cars[g.car];
    C.g.style.display = 'block';
    const k = t - g.a;

    // which shot
    let j = 0;
    C.span.forEach(([a], n) => { if (t >= g.a + b(a) - 1e-6) j = n; });
    C.shots.forEach((s, n) => {
      if (n !== j) { s.box.style.display = 'none'; return; }
      s.box.style.display = 'block';
      const [a, z] = C.span[n];
      const ks = t - (g.a + b(a));
      const u = clamp(ks / b(z - a));
      // push / pull, a little drift; a punch on the cut; the first shot dives in out of the hologram
      const push = n % 2 === 0 ? 1.14 - 0.08 * ease.outCubic(u) : 1.05 + 0.08 * ease.inOutCubic(u);
      const punch = n === 0 ? 1 + 0.45 * Math.exp(-14 * ks) : 1 + 0.1 * Math.exp(-16 * ks);
      const dx = (n % 2 ? 1 : -1) * 18 * (u - 0.5);
      set(s.box, { s: push * punch, x: dx, blur: n === 0 ? 10 * Math.exp(-30 * ks) : 3 * Math.exp(-40 * ks) });
      s.box.style.transformOrigin = '540px 980px';
      if (s.clip) {
        const f = clamp(Math.floor(ks * 60), 0, s.clip.frames - 1);
        const src = `assets/media/clips/${s.clip.clip}/${pad(f + 1)}.jpg`;
        if (src !== s.last) { s.img.src = src; s.last = src; ctx.wait(s.img.decode().catch(() => {})); }
      }
    });

    // name: number + make wipes in, the model springs, the shine runs
    const km = k - 0.04;
    set(C.make, { x: 64, y: 236, o: clamp(km / 0.05) });
    wipe(C.make, ease.outExpo(clamp(km / 0.3)), 'l');
    const sm = spring(k - 0.1, 3.2, 0.55);
    set(C.model.el, { x: 58 + 40 * (1 - sm), y: 276, o: clamp((k - 0.1) / 0.06) });
    C.model.shine(clamp((k - 0.3) / 1.2));
    const ty = 276 + C.model.h + 14;
    C.ticks.forEach((e, n) => {
      const on = clamp((k - 0.2 - n * 0.04) / 0.1);
      e.style.background = n < j ? '#d9b25f' : n === j ? '#ffffff' : 'rgba(255,255,255,.28)';
      set(e, { x: 64 + n * 54, y: ty, o: on, sx: n === j ? 1 : 0.8 });
    });

    // price
    const kp = k - b(1);
    set(C.pre, { x: 66, y: 1262, o: clamp(kp / 0.08) });
    wipe(C.pre, ease.outExpo(clamp(kp / 0.3)), 'l');
    const sp = spring(kp - 0.06, 3, 0.55);
    set(C.price, { x: 60, y: 1296 + 30 * (1 - sp), s: 1.25 - 0.25 * sp, o: clamp((kp - 0.06) / 0.05) });
    C.price.style.transformOrigin = '0 100%';
    set(C.unit, { x: 60 + C.pw + 18, y: 1372, o: clamp((kp - 0.2) / 0.08) });
    wipe(C.unit, ease.outExpo(clamp((kp - 0.2) / 0.25)), 'l');
  };
}
