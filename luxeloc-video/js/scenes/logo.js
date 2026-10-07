// The drop: the light bar opens from the centre, LUXELOC / RESA93 slams in over it with its reflection,
// then the tagline and the zone.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, beatPulse } from '../engine.js';
import { icon } from '../icons.js';
import { wordmark, lightBar } from './ui.js';

const BAR_Y = 1010;

export function build(root, ctx) {
  const floor = h('div', 'abs', root);
  Object.assign(floor.style, { width: '1080px', height: '900px', top: `${BAR_Y}px`, background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(217,178,95,.18), rgba(0,0,0,0) 70%)' });

  const wm = wordmark(root, 1);
  const refl = wordmark(root, 1);            // mirrored under the bar, faded
  Object.assign(refl.g.style, { opacity: '.16', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 100%)', maskImage: 'linear-gradient(180deg, transparent 0%, #000 100%)' });
  const bar = lightBar(root, 900, 30);

  const tag = h('div', 'abs', root, COPY.tagline);
  Object.assign(tag.style, { fontWeight: '600', fontSize: '42px', letterSpacing: '2px', color: '#e9ecf0', whiteSpace: 'nowrap' });
  const tagW = tag.offsetWidth;
  const zone = h('div', 'pill', root, `<span style="width:36px;height:36px;display:block">${icon('pin', { stroke: '#d9b25f', sw: 2.2 })}</span><span>${COPY.zone}</span>`);
  const zoneW = zone.offsetWidth;

  return (t) => {
    const k = t - CUE.drop;
    const pulse = beatPulse(t, BEAT, CUE.drop, 6);

    // wordmark: LUXELOC slams, RESA93 follows half a beat later
    const sp = spring(k, 2.8, 0.5), sp2 = spring(k - b(0.5), 3, 0.55);
    const topY = 690, botY = 690 + wm.top.h + 6;
    set(wm.top.el, { x: 540 - wm.top.w / 2, y: topY, s: 1.5 - 0.5 * sp, o: k > 0 ? clamp(k / 0.05) : 0, blur: 14 * (1 - clamp(k / 0.15)) });
    wm.top.el.style.letterSpacing = `${(18 * (1 - ease.outCubic(clamp(k / 0.8)))).toFixed(2)}px`;
    set(wm.bot.el, { x: 540 - wm.bot.w / 2, y: botY + 20 * (1 - sp2), o: k > b(0.5) ? clamp((k - b(0.5)) / 0.08) : 0 });
    wm.top.shine(clamp((k - 0.5) / 1.1));
    wm.bot.shine(clamp((k - 0.8) / 1.1));

    // reflection follows the wordmark, flipped below the bar
    const mirror = (src, dst, y) => {
      dst.el.style.letterSpacing = src.el.style.letterSpacing;
      set(dst.el, { x: 540 - dst.w / 2, y: 2 * BAR_Y - y - dst.h, sy: -1, o: parseFloat(src.el.style.opacity) || 0 });
    };
    mirror(wm.top, refl.top, topY);
    mirror(wm.bot, refl.bot, botY);

    // the light bar opens on the drop, then a chase runs along it on every bar
    set(bar.bar, { x: 90, y: BAR_Y, s: 1 + 0.01 * pulse });
    bar.update(ease.outCubic(clamp(k / 0.6)), k > 0.8 ? (k - 0.8) : -1);
    set(floor, { o: k > 0 ? 0.6 + 0.4 * Math.exp(-2 * k) : 0 });

    const kt = t - CUE.tagline;
    set(tag, { x: 540 - tagW / 2, y: 1090 + 20 * (1 - ease.outCubic(clamp(kt / 0.4))), o: clamp(kt / 0.3) });
    tag.style.letterSpacing = `${(2 + 10 * (1 - ease.outCubic(clamp(kt / 0.7)))).toFixed(2)}px`;
    const kz = t - CUE.zone;
    const sz = spring(kz, 3, 0.55);
    set(zone, { x: 540 - zoneW / 2, y: 1190 + 30 * (1 - sz), s: 0.85 + 0.15 * sz, o: clamp(kz / 0.08) });
  };
}
