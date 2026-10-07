// "TOUT POUR TON SON": four service cards deal in on the beat, then fold into a 2×2 grid of chips.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, noise1, fit } from '../engine.js';
import { icon } from '../icons.js';
import { gear } from './gear.js';

const ICONS = { rec: 'mic', mix: 'sliders', master: 'speaker', beat: 'pads' };
const FALLBACK_BG = {
  rec: 'radial-gradient(ellipse at 50% 35%, #2a5cff 0%, #0b2170 45%, #030a2a 100%)',
  mix: 'radial-gradient(ellipse at 30% 60%, #1fa0ff 0%, #0b2170 50%, #030a2a 100%)',
  master: 'radial-gradient(ellipse at 70% 40%, #3b6dff 0%, #0b1d66 50%, #030a2a 100%)',
  beat: 'radial-gradient(ellipse at 50% 70%, #18b4ff 0%, #0b2170 50%, #030a2a 100%)',
};

const CARD = { x: 130, y: 500, w: 820, h: 960 };

export function build(root, ctx) {
  // title
  const t1 = h('div', 'label blue', root, `<span class="in">${COPY.servicesTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.servicesTitle[1]}</span>`);
  t1.style.fontSize = '118px';
  t2.style.fontSize = '118px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;

  const deck = h('div', 'abs', root);
  Object.assign(deck.style, { width: '1080px', height: '1920px', perspective: '1800px', perspectiveOrigin: '540px 980px' });

  const ats = [CUE.card1, CUE.card2, CUE.card3, CUE.card4];
  const cards = COPY.services.map((sv, i) => {
    const card = h('div', 'glass abs', deck);
    Object.assign(card.style, { width: `${CARD.w}px`, height: `${CARD.h}px`, overflow: 'hidden', transformOrigin: '50% 50%' });
    const m = ctx.media(card, sv.img);
    Object.assign(m.box.style, { left: '0px', top: '0px', width: `${CARD.w}px`, height: `${CARD.h}px` });
    m.fallback.style.background = FALLBACK_BG[sv.key];
    const shade = h('div', 'abs', card);
    Object.assign(shade.style, { width: `${CARD.w}px`, height: `${CARD.h}px`, background: 'linear-gradient(180deg, rgba(2,8,34,0) 45%, rgba(2,8,34,.92) 100%)' });
    const tintC = h('div', 'abs', card);
    Object.assign(tintC.style, { width: `${CARD.w}px`, height: `${CARD.h}px`, background: 'rgba(20,70,255,.18)', mixBlendMode: 'color' });
    if (m.has) { const dim = h('div', 'abs', card); Object.assign(dim.style, { width: `${CARD.w}px`, height: `${CARD.h}px`, background: 'rgba(2,8,34,.45)' }); }
    const anim = gear(card, sv.key);
    const name = h('div', 'abs', card, `<span class="dot" style="width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#3b7bff,#1847d6);box-shadow:0 0 30px rgba(60,130,255,.8)"><span style="width:52px;height:52px;display:block">${icon(ICONS[sv.key], { sw: 2.2 })}</span></span><span class="title" style="font-size:104px;text-shadow:0 4px 30px rgba(0,8,40,.9)">${sv.label}</span>`);
    Object.assign(name.style, { display: 'flex', alignItems: 'center', gap: '28px', left: '50px', top: `${CARD.h - 170}px` });
    fit(name.lastChild, CARD.w - 100 - 124, 104);
    const edge = h('div', 'abs', card);
    Object.assign(edge.style, { width: `${CARD.w}px`, height: `${CARD.h}px`, borderRadius: '30px', boxShadow: 'inset 0 0 0 2px rgba(140,195,255,.6), inset 0 0 60px rgba(60,140,255,.35)' });
    return { card, m, name, anim, at: ats[i], end: i < 3 ? ats[i + 1] : Infinity, key: sv.key };
  });

  // 2×2 chips
  const chips = COPY.services.map((sv) => {
    const c = h('div', 'pill', root, `<span class="dot">${icon(ICONS[sv.key], { sw: 2.4 })}</span><span>${sv.label}</span>`);
    Object.assign(c.style, { width: '400px', fontSize: '36px', justifyContent: 'flex-start' });
    return c;
  });

  return (t) => {
    // title slams on the scene's first downbeat (the push brings it in)
    const kt = t - CUE.servicesIn;
    const s1 = spring(kt + 0.05, 3, 0.5), s2 = spring(kt - 0.08, 3, 0.5);
    set(t1, { x: 540 - w1 / 2 - 30, y: 170, s: 1.4 - 0.4 * s1, o: clamp((kt + 0.05) / 0.05), r: -2 });
    set(t2, { x: 540 - w2 / 2 + 30, y: 300, s: 1.4 - 0.4 * s2, o: clamp((kt - 0.08) / 0.05), r: -2 });
    wipe(t1, ease.outExpo(clamp((kt + 0.05) / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp((kt - 0.08) / 0.3)), 'r');

    // grid fold
    const kg = t - CUE.grid;
    const fold = ease.inOutCubic(clamp(kg / b(1)));

    for (const [i, c] of cards.entries()) {
      const k = t - c.at;
      const ke = t - c.end;
      if (k < -0.02 || ke > 0.4) { set(c.card, { o: 0 }); continue; }
      const sp = spring(k, 2.4, 0.62);
      let x = CARD.x + 760 * (1 - sp);
      let ry = -38 * (1 - sp);
      let rz = 6 * (1 - sp);
      let s = 0.92 + 0.08 * sp;
      let o = clamp(k / 0.06);
      let blur = 14 * (1 - clamp(k / 0.18));
      let y = CARD.y;
      if (ke > 0) { // dealt away to the left
        const e = ease.inCubic(clamp(ke / 0.3));
        x -= 900 * e; ry += 40 * e; rz -= 8 * e; blur += 20 * e; o *= 1 - e;
      }
      // the last card folds up for the grid
      if (i === 3 && kg > 0) { s *= 1 - 0.36 * fold; y -= 140 * fold; }
      const drift = noise1(t * 0.7, i + 3) * 6;
      set(c.card, { x, y: y + drift, ry, r: rz, s, o, blur });
      // media plays from its own entrance, Ken Burns inside the card
      ctx.wait(c.m.frame(Math.max(0, k)));
      const kb = clamp((t - c.at) / 2.4);
      set(c.m.box, { s: 1.16 - 0.1 * ease.outCubic(kb), x: (i % 2 ? -1 : 1) * 20 * kb });
      c.anim(t, k);
      // name slides up inside the card
      set(c.name, { y: 40 * (1 - ease.outCubic(clamp((k - 0.08) / 0.35))), o: clamp((k - 0.08) / 0.12) });
    }

    for (const [i, c] of chips.entries()) {
      const kc = kg - 0.1 - i * 0.07;
      const sp = spring(kc, 3, 0.55);
      const col = i % 2, row = Math.floor(i / 2);
      set(c, { x: 120 + col * 440, y: 1200 + row * 120 + 40 * (1 - sp), s: 0.8 + 0.2 * sp, o: clamp(kc / 0.08) });
    }
  };
}
