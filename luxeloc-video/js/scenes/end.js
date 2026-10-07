// End card: the GT3's rear in the dark, the wordmark over the light bar, RÉSERVE TA VOITURE — EN DM, the zone.
// Social handles join as pills once the client confirms them (COPY.socials).
import { CUE, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, beatPulse } from '../engine.js';
import { icon } from '../icons.js';
import { wordmark, lightBar, chrome } from './ui.js';

export function build(root, ctx) {
  const bg = ctx.shot(root, COPY.endBg);
  bg.img.style.filter = 'contrast(1.1) saturate(.6) brightness(.32) blur(4px)';
  const shade = h('div', 'abs', root);
  Object.assign(shade.style, { width: '1080px', height: '1920px', background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,0,0,.2), rgba(0,0,0,.85) 100%)' });

  const wm = wordmark(root, 0.72);
  const bar = lightBar(root, 640, 24);

  const t1 = h('div', 'label gold', root, `<span class="in">${COPY.endTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.endTitle[1]}</span>`);
  t1.style.fontSize = '128px';
  t2.style.fontSize = '128px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;
  const cta = chrome(root, COPY.endCta, 120, 900);

  const pills = [
    ...COPY.socials.map((s) => `<span style="color:#d9b25f">${s.net}</span><span>${s.handle}</span>`),
    `<span style="width:36px;height:36px;display:block">${icon('pin', { stroke: '#d9b25f', sw: 2.2 })}</span><span>${COPY.zone}</span>`,
  ].map((html) => { const p = h('div', 'pill', root, html); return { el: p, w: p.offsetWidth }; });

  return (t) => {
    const k = t - CUE.endIn;
    const pulse = beatPulse(t, BEAT, CUE.endIn, 6);
    set(bg.box, { s: 1.08 + 0.05 * clamp(k / 6) });
    bg.box.style.transformOrigin = '540px 1000px';

    const sw = spring(k + 0.05, 2.6, 0.5);
    set(wm.top.el, { x: 540 - wm.top.w / 2, y: 330, s: 1.3 - 0.3 * sw, o: clamp((k + 0.05) / 0.06) });
    set(wm.bot.el, { x: 540 - wm.bot.w / 2, y: 330 + wm.top.h + 4, o: clamp((k - 0.15) / 0.1) });
    wm.top.shine(clamp((k - 0.4) / 1.1));
    wm.bot.shine(clamp((k - 0.6) / 1.1));
    set(bar.bar, { x: 220, y: 330 + wm.top.h + wm.bot.h + 40, s: 1 + 0.01 * pulse });
    bar.update(ease.outCubic(clamp((k - 0.1) / 0.6)), k > 0.8 ? k - 0.8 : -1);

    const kc = t - CUE.endCta;
    const k1 = kc + 0.1, k2 = kc - 0.02;
    set(t1, { x: 540 - w1 / 2 - 24, y: 820, s: 1.35 - 0.35 * spring(k1, 3, 0.5), o: clamp(k1 / 0.05), r: -2 });
    set(t2, { x: 540 - w2 / 2 + 24, y: 966, s: 1.35 - 0.35 * spring(k2, 3, 0.5), o: clamp(k2 / 0.05), r: -2 });
    wipe(t1, ease.outExpo(clamp(k1 / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp(k2 / 0.3)), 'r');
    const k3 = kc - 0.3;
    const s3 = spring(k3, 3, 0.55);
    set(cta.el, { x: 540 - cta.w / 2, y: 1150 + 30 * (1 - s3), s: 1.2 - 0.2 * s3, o: clamp(k3 / 0.06) });
    cta.shine(clamp((k3 - 0.2) / 1.0));

    pills.forEach((p, i) => {
      const kp = t - CUE.endZone - i * 0.12;
      const sp = spring(kp, 3, 0.55);
      set(p.el, { x: 540 - p.w / 2 + 60 * (1 - sp), y: 1330 + i * 96, o: clamp(kp / 0.08) });
    });
  };
}
