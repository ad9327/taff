// End card over the convoy, blurred: LUXELOC / RESA93, the fleet line, RÉSERVE TA VOITURE, the entry price, then the
// blue panel — the documents to bring, CONTACTEZ-NOUS DÈS MAINTENANT and the client's networks as blue pills.
import { COPY, CARS, minPrice, euros } from '../copy.mjs';
import { SEG } from '../rig.js';
import { BEAT } from '../timeline.mjs';
import { clamp, ease, spring, set, h, wipe, beatPulse } from '../engine.js';
import { icon } from '../icons.js';
import { wordmark, lightBar } from './ui.js';

const PANEL = { x: 40, y: 930, w: 1000 };

export function build(root) {
  const E = SEG.find((g) => g.kind === 'end');
  const bgBox = h('div', 'shot', root);
  Object.assign(bgBox.style, { width: '1080px', height: '1920px' });
  const bg = h('img', '', bgBox);
  bg.src = 'assets/media/convoy/0200.jpg';
  bg.style.filter = 'contrast(1.1) saturate(.7) brightness(.34) blur(10px)';
  const shade = h('div', 'abs', root);
  Object.assign(shade.style, { width: '1080px', height: '1920px', background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,.15), rgba(0,0,0,.8) 100%)' });

  const wm = wordmark(root, 0.74);
  const bar = lightBar(root, 560, 22);
  const fleet = h('div', 'abs end-fleet', root, `${CARS.length} véhicules de prestige · ${COPY.zone}`);
  const fw = fleet.scrollWidth;

  const t1 = h('div', 'label gold', root, `<span class="in">${COPY.endTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.endTitle[1]}</span>`);
  t1.style.fontSize = '100px';
  t2.style.fontSize = '100px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;
  const from = h('div', 'abs end-from', root, `Dès <b class="goldtext">${euros(minPrice)}</b> ${COPY.priceUnit.toLowerCase()}`);
  const frw = from.scrollWidth;

  // the blue panel
  const panel = h('div', 'rate-card end-panel', root);
  panel.style.width = `${PANEL.w}px`;
  const docT = h('div', 'end-docs-t', panel, COPY.docsTitle);
  const docs = COPY.docs.map((d) => h('div', 'end-doc', panel, `— ${d}`));
  h('div', 'end-sep', panel);
  const ct = COPY.contact.map((l) => h('div', 'end-contact', panel, l));
  const pillRow = h('div', 'end-pills', panel);
  const pills = COPY.socials.map((s) => h('div', 'blue-pill end-pill', pillRow, `<span style="display:block;width:40px;height:40px">${icon(s.net, 40)}</span><span>${s.handle}</span>`));

  return (t) => {
    const on = t >= E.a - 1e-6;
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const k = t - E.a;
    const pulse = beatPulse(t, BEAT, E.a, 6);
    set(bgBox, { s: 1.12 + 0.05 * clamp(k / 5) });
    bgBox.style.transformOrigin = '540px 1000px';

    const sw = spring(k + 0.04, 2.6, 0.5);
    set(wm.top.el, { x: 540 - wm.top.w / 2, y: 200, s: 1.3 - 0.3 * sw, o: clamp((k + 0.04) / 0.06) });
    set(wm.bot.el, { x: 540 - wm.bot.w / 2, y: 200 + wm.top.h + 2, o: clamp((k - 0.12) / 0.1) });
    wm.top.shine(clamp((k - 0.3) / 1.1));
    wm.bot.shine(clamp((k - 0.5) / 1.1));
    const by = 200 + wm.top.h + wm.bot.h + 26;
    set(bar.bar, { x: 260, y: by, s: 1 + 0.01 * pulse });
    bar.update(ease.outCubic(clamp((k - 0.08) / 0.5)), k > 0.6 ? k - 0.6 : -1);
    set(fleet, { x: 540 - fw / 2, y: by + 30, o: clamp((k - 0.3) / 0.1) });
    wipe(fleet, ease.outExpo(clamp((k - 0.3) / 0.4)), 'l');

    const k1 = k - 0.4, k2 = k - 0.5;
    set(t1, { x: 540 - w1 / 2 - 22, y: 560, s: 1.35 - 0.35 * spring(k1, 3, 0.5), o: clamp(k1 / 0.05), r: -2 });
    set(t2, { x: 540 - w2 / 2 + 22, y: 676, s: 1.35 - 0.35 * spring(k2, 3, 0.5), o: clamp(k2 / 0.05), r: -2 });
    wipe(t1, ease.outExpo(clamp(k1 / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp(k2 / 0.3)), 'r');
    const kf = k - 0.75;
    set(from, { x: 540 - frw / 2, y: 828, o: clamp(kf / 0.1) });
    wipe(from, ease.outExpo(clamp(kf / 0.4)), 'l');

    // panel: slides up, the lines and pills land in order
    const kp = k - 1.0;
    const sp = spring(kp, 2.6, 0.62);
    set(panel, { x: PANEL.x, y: PANEL.y + 120 * (1 - sp), o: clamp(kp / 0.08) });
    wipe(panel, ease.outExpo(clamp(kp / 0.35)), 'u');
    [docT, ...docs].forEach((e, n) => { const kk = kp - 0.12 - n * 0.08; set(e, { x: 30 * (1 - ease.outCubic(clamp(kk / 0.3))), o: clamp(kk / 0.08) }); });
    ct.forEach((e, n) => { const kk = kp - 0.5 - n * 0.1; set(e, { s: 1.2 - 0.2 * spring(kk, 3, 0.55), o: clamp(kk / 0.06) }); });
    pills.forEach((e, n) => { const kk = kp - 0.75 - n * 0.1; set(e, { s: 0.6 + 0.4 * spring(kk, 3.4, 0.5), o: clamp(kk / 0.06) }); });
  };
}
