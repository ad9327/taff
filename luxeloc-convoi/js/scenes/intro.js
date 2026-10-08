// Over the convoy: the brand on the very first frame (it is the thumbnail), then a small wordmark whenever the
// convoy is rolling between two cars.
import { COPY, CARS } from '../copy.mjs';
import { SEG, segAt } from '../rig.js';
import { clamp, ease, set, h, fit } from '../engine.js';
import { chrome, wordmark } from './ui.js';

export function build(root) {
  const shade = h('div', 'abs shade-top', root);
  const wm = wordmark(root, 0.82);
  const tH = wm.top.h + wm.bot.h + 4;
  const line = h('div', 'abs intro-line', root, COPY.tagline);
  const lw = line.scrollWidth;
  const zone = h('div', 'abs intro-zone', root, `${CARS.length} véhicules · ${COPY.zone}`);
  const zw = zone.scrollWidth;
  const small = chrome(root, COPY.brand, 40, 600);
  const first = SEG[0];

  return (t) => {
    const g = segAt(t);
    const on = g.kind === 'play';
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const intro = g === first;
    const out = 1 - clamp((t - (g.z - 0.12)) / 0.12);
    set(shade, { o: (intro ? 1 : 0.55) * out, sy: intro ? 1.15 : 0.7 });
    shade.style.transformOrigin = '50% 0';
    // the intro title is fully there on frame 0, it only shines
    set(wm.top.el, { x: 540 - wm.top.w / 2, y: 226, o: intro ? out : 0 });
    set(wm.bot.el, { x: 540 - wm.bot.w / 2, y: 226 + wm.top.h + 2, o: intro ? out : 0 });
    wm.top.shine(clamp(0.35 + t / 1.2));
    wm.bot.shine(clamp(0.35 + t / 1.2));
    set(line, { x: 540 - lw / 2, y: 226 + tH + 18, o: intro ? out : 0 });
    set(zone, { x: 540 - zw / 2, y: 226 + tH + 66, o: intro ? out : 0 });
    // later plays: the small wordmark drops in
    const k = t - g.a;
    set(small.el, { x: 540 - small.w / 2, y: 236 - 20 * (1 - ease.outCubic(clamp(k / 0.25))), o: intro ? 0 : clamp(k / 0.15) * out });
    small.shine(clamp(k / 1));
  };
}
