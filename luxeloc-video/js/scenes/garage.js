// The garage: one car every six beats. Each arrives behind the sweeping light beam, its make and model slam in
// at the top, and on the fourth beat the second shot whips in from the right. A price tag joins when known.
import { b, BEAT, carStart, CAR_BEATS } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h } from '../engine.js';
import { chrome } from './ui.js';

const SWAP = b(3);                 // second shot, four beats in
const REVEAL = b(0.25);            // the beam reveals the car a quarter beat early

export function build(root, ctx) {
  const cars = COPY.cars.map((car, i) => {
    const wrap = h('div', 'abs', root);
    Object.assign(wrap.style, { width: '1080px', height: '1920px', overflow: 'hidden', background: '#050506' });
    const a = ctx.shot(wrap, car.shots[0]);
    const bshot = ctx.shot(wrap, car.shots[1]);
    const shade = h('div', 'abs', wrap);
    Object.assign(shade.style, { width: '1080px', height: '1920px', background: 'linear-gradient(180deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 22%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 78%, rgba(0,0,0,.45) 100%)' });

    const make = h('div', 'make abs', wrap, car.make);
    make.style.fontSize = '40px';
    const makeW = make.scrollWidth;
    const model = chrome(wrap, car.model, 132, 960);
    const line = h('div', 'abs', wrap);
    Object.assign(line.style, { height: '4px', width: '260px', background: 'linear-gradient(90deg, rgba(217,178,95,0), #d9b25f 30%, #f6dc94 50%, #d9b25f 70%, rgba(217,178,95,0))' });
    let tag = null, tagW = 0;
    if (car.price != null) {
      tag = h('div', 'pill goldfill', wrap, `<span>${COPY.pricePrefix} ${car.price}${COPY.priceSuffix}</span>`);
      tagW = tag.offsetWidth;
    }
    return { wrap, a, b: bshot, make, makeW, model, line, tag, tagW, start: carStart(i), i };
  });

  return (t) => {
    for (const c of cars) {
      const k = t - c.start;
      const next = cars[c.i + 1];
      const visible = k > -REVEAL - 0.02 && (!next || t < next.start + REVEAL + 0.02);
      c.wrap.style.display = visible ? 'block' : 'none';
      if (!visible) continue;
      // revealed from the top down as the beam passes (the first car comes in with the scene's own beam)
      const p = c.i === 0 ? 1 : ease.inOutCubic(clamp((k + REVEAL) / (2 * REVEAL)));
      c.wrap.style.clipPath = p < 1 ? `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)` : 'none';
      c.wrap.style.zIndex = String(c.i + 1);

      // shot A: slow push; shot B whips in from the right on the swap, A slides away under it
      const ks = k - SWAP;
      const whip = ease.inOutCubic(clamp((ks + 0.12) / 0.3));
      const vel = Math.sin(Math.PI * whip);
      const life = CAR_BEATS * BEAT;
      set(c.a.box, { x: -380 * whip, s: 1.04 + 0.08 * clamp(k / life), blur: 10 * vel, o: 1 - 0.5 * whip });
      c.a.box.style.transformOrigin = '540px 1200px';
      set(c.b.box, { x: 1080 * (1 - whip), s: 1.1 - 0.06 * clamp(ks / 2), blur: 14 * vel, o: whip > 0 ? 1 : 0 });

      // make and model at the top
      const km = k + 0.05;
      const sm = spring(km, 3, 0.55);
      set(c.make, { x: 540 - c.makeW / 2 + 60 * (1 - sm), y: 196, o: km > 0 ? clamp(km / 0.06) : 0 });
      c.make.style.letterSpacing = `${(16 + 20 * (1 - ease.outCubic(clamp(km / 0.5)))).toFixed(1)}px`;
      const kd = k - 0.07;
      const sd = spring(kd, 3.2, 0.5);
      set(c.model.el, { x: 540 - c.model.w / 2, y: 252 + 30 * (1 - sd), s: 1.3 - 0.3 * sd, o: kd > 0 ? clamp(kd / 0.05) : 0, blur: 12 * (1 - clamp(kd / 0.12)) });
      c.model.shine(clamp((k - 0.3) / 1.0) + clamp((ks - 0.1) / 1.0) * 0);
      const lineY = 252 + c.model.h + 18;
      set(c.line, { x: 410, y: lineY, sx: ease.outCubic(clamp((k - 0.15) / 0.4)), o: k > 0.15 ? 1 : 0 });
      if (c.tag) {
        const kt = k - b(1.5);
        const st = spring(kt, 3, 0.55);
        set(c.tag, { x: 540 - c.tagW / 2, y: lineY + 34 + 20 * (1 - st), s: 0.85 + 0.15 * st, o: clamp(kt / 0.08) });
      }
    }
  };
}
