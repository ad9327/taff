// End card over the convoy, blurred: LUXELOC / RESA93, the fleet line, RÉSERVE TA VOITURE — EN DM,
// the client's networks, and the entry price.
import { COPY, CARS, minPrice } from '../copy.mjs';
import { SEG } from '../rig.js';
import { BEAT } from '../timeline.mjs';
import { clamp, ease, spring, set, h, wipe, beatPulse } from '../engine.js';
import { icon } from '../icons.js';
import { wordmark, lightBar, chrome } from './ui.js';

export function build(root) {
  const E = SEG.find((g) => g.kind === 'end');
  const bgBox = h('div', 'shot', root);
  Object.assign(bgBox.style, { width: '1080px', height: '1920px' });
  const bg = h('img', '', bgBox);
  bg.src = 'assets/media/convoy/0200.jpg';
  bg.style.filter = 'contrast(1.1) saturate(.7) brightness(.34) blur(10px)';
  const shade = h('div', 'abs', root);
  Object.assign(shade.style, { width: '1080px', height: '1920px', background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,.15), rgba(0,0,0,.8) 100%)' });

  const wm = wordmark(root, 0.78);
  const bar = lightBar(root, 600, 24);
  const fleet = h('div', 'abs end-fleet', root, `${CARS.length} véhicules de prestige · ${COPY.zone}`);
  const fw = fleet.scrollWidth;

  const t1 = h('div', 'label gold', root, `<span class="in">${COPY.endTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.endTitle[1]}</span>`);
  t1.style.fontSize = '116px';
  t2.style.fontSize = '116px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;
  const cta = chrome(root, COPY.endCta, 110, 900);

  const pills = COPY.socials.map((s) => {
    const p = h('div', 'pill', root, `<span style="display:block;width:44px;height:44px">${icon(s.net, 44)}</span><span>${s.handle}</span>`);
    return { el: p, w: p.offsetWidth };
  });
  const from = h('div', 'abs end-from', root, `Dès <b class="goldtext">${minPrice}&#8239;€</b> ${COPY.priceUnit.toLowerCase()}`);
  const frw = from.scrollWidth;

  return (t) => {
    const on = t >= E.a - 1e-6;
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const k = t - E.a;
    const pulse = beatPulse(t, BEAT, E.a, 6);
    set(bgBox, { s: 1.12 + 0.05 * clamp(k / 4) });
    bgBox.style.transformOrigin = '540px 1000px';

    const sw = spring(k + 0.04, 2.6, 0.5);
    set(wm.top.el, { x: 540 - wm.top.w / 2, y: 250, s: 1.3 - 0.3 * sw, o: clamp((k + 0.04) / 0.06) });
    set(wm.bot.el, { x: 540 - wm.bot.w / 2, y: 250 + wm.top.h + 2, o: clamp((k - 0.12) / 0.1) });
    wm.top.shine(clamp((k - 0.3) / 1.1));
    wm.bot.shine(clamp((k - 0.5) / 1.1));
    set(bar.bar, { x: 240, y: 250 + wm.top.h + wm.bot.h + 30, s: 1 + 0.01 * pulse });
    bar.update(ease.outCubic(clamp((k - 0.08) / 0.5)), k > 0.6 ? k - 0.6 : -1);
    set(fleet, { x: 540 - fw / 2, y: 250 + wm.top.h + wm.bot.h + 64, o: clamp((k - 0.3) / 0.1) });
    wipe(fleet, ease.outExpo(clamp((k - 0.3) / 0.4)), 'l');

    const k1 = k - 0.45, k2 = k - 0.55;
    set(t1, { x: 540 - w1 / 2 - 22, y: 720, s: 1.35 - 0.35 * spring(k1, 3, 0.5), o: clamp(k1 / 0.05), r: -2 });
    set(t2, { x: 540 - w2 / 2 + 22, y: 852, s: 1.35 - 0.35 * spring(k2, 3, 0.5), o: clamp(k2 / 0.05), r: -2 });
    wipe(t1, ease.outExpo(clamp(k1 / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp(k2 / 0.3)), 'r');
    const k3 = k - 0.8;
    const s3 = spring(k3, 3, 0.55);
    set(cta.el, { x: 540 - cta.w / 2, y: 1012 + 30 * (1 - s3), s: 1.2 - 0.2 * s3, o: clamp(k3 / 0.06) });
    cta.shine(clamp((k3 - 0.2) / 1.0));

    pills.forEach((p, i) => {
      const kp = k - 1.1 - i * 0.1;
      const sp = spring(kp, 3, 0.55);
      set(p.el, { x: 540 - p.w / 2 + 60 * (1 - sp), y: 1188 + i * 92, o: clamp(kp / 0.08) });
    });
    const kf = k - 1.5;
    set(from, { x: 540 - frw / 2, y: 1470, o: clamp(kf / 0.1) });
    wipe(from, ease.outExpo(clamp(kf / 0.4)), 'l');
  };
}
