// The run: the car's photos and clips cut on the beat, each with a slow push or pull, the name top-left
// (make in gold, model in chrome, its specs, its number in the fleet), a progress tick per shot, and two beats in
// the rate card slides up: one column per rate (title, sub-title, the price in a blue pill), the deposit under it.
import { CARS, euros, shotSpans } from '../copy.mjs';
import { b } from '../timeline.mjs';
import { segAt } from '../rig.js';
import { clamp, ease, spring, set, h, wipe, fit } from '../engine.js';
import { chrome } from './ui.js';

const pad = (n) => String(n).padStart(4, '0');
const CARD_AT = 2;          // beats into the run
const CARD = { x: 40, y: 1150, w: 1000 };

export function build(root, ctx) {
  const cars = CARS.map((c, i) => {
    const g = h('div', 'abs', root);
    const shots = c.shots.map(([s]) => {
      const box = h('div', 'shot', g);
      Object.assign(box.style, { width: '1080px', height: '1920px' });
      const img = h('img', '', box);
      img.decoding = 'sync';
      const clip = typeof s === 'object' ? s : null;
      if (!clip) img.src = `assets/media/cars/${s}.jpg`;
      return { box, img, clip, last: '' };
    });
    const span = shotSpans(c);

    const topShade = h('div', 'abs shade-top', g);
    const botShade = h('div', 'abs shade-bot', g);
    const make = h('div', 'abs run-make', g, `<span class="idx">${String(i + 1).padStart(2, '0')}/${String(CARS.length).padStart(2, '0')}</span>${c.make}`);
    const model = chrome(g, c.model, 92, 900);
    const spec = c.specs ? h('div', 'abs run-spec', g, c.specs) : null;
    if (spec) fit(spec, 950, 26);
    const ticks = shots.map(() => h('div', 'abs run-tick', g));

    const card = h('div', 'rate-card', g);
    card.style.width = `${CARD.w}px`;
    const row = h('div', 'rate-cols', card);
    const colW = (CARD.w - 60 - 20 * (c.rates.length - 1)) / c.rates.length;
    const cols = c.rates.map(([t, sub, p]) => {
      const col = h('div', 'rate-col', row);
      const tt = h('div', 'rate-t', col, t);
      fit(tt, colW, 84);
      h('div', 'rate-s', col, sub);
      const pill = h('div', 'rate-p', col, euros(p));
      return { col, pill };
    });
    const caution = h('div', 'rate-caution', card, `CAUTION : <b>${euros(c.caution)}</b>`);
    g.style.display = 'none';           // measured above while visible
    return { g, shots, span, make, model, spec, ticks, card, cols, caution };
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
      const fz = (s.clip && s.clip.zoom) || 1;
      set(s.box, { s: push * punch * fz, x: dx, blur: n === 0 ? 10 * Math.exp(-30 * ks) : 3 * Math.exp(-40 * ks) });
      s.box.style.transformOrigin = s.clip && s.clip.focus ? `${s.clip.focus[0]}px ${s.clip.focus[1]}px` : '540px 980px';
      if (s.clip) {
        const f = clamp((s.clip.from || 0) + Math.floor(ks * 60), 0, s.clip.frames - 1);
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
    let ty = 276 + C.model.h + 12;
    if (C.spec) {
      set(C.spec, { x: 64, y: ty, o: clamp((k - 0.25) / 0.06) });
      wipe(C.spec, ease.outExpo(clamp((k - 0.25) / 0.4)), 'l');
      ty += 46;
    }
    C.ticks.forEach((e, n) => {
      const on = clamp((k - 0.2 - n * 0.04) / 0.1);
      e.style.background = n < j ? '#d9b25f' : n === j ? '#ffffff' : 'rgba(255,255,255,.28)';
      set(e, { x: 64 + n * 54, y: ty, o: on, sx: n === j ? 1 : 0.8 });
    });

    // the rate card: slides up, the columns land one by one, the pills pop
    const kc = k - b(CARD_AT);
    const sc = spring(kc, 2.6, 0.62);
    set(C.card, { x: CARD.x, y: CARD.y + 120 * (1 - sc), o: clamp(kc / 0.08) });
    wipe(C.card, ease.outExpo(clamp(kc / 0.35)), 'u');
    C.cols.forEach(({ col, pill }, n) => {
      const kk = kc - 0.1 - n * 0.09;
      const sp = spring(kk, 3.2, 0.55);
      set(col, { y: 26 * (1 - sp), o: clamp(kk / 0.06) });
      const kp = kk - 0.12;
      set(pill, { s: 0.6 + 0.4 * spring(kp, 3.6, 0.5), o: clamp(kp / 0.05) });
    });
    const kk = kc - 0.2 - C.cols.length * 0.09;
    set(C.caution, { o: clamp(kk / 0.1) });
    wipe(C.caution, ease.outExpo(clamp(kk / 0.4)), 'l');
  };
}
