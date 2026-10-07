// End card: the emblem returns, RÉSERVE TA SESSION, the number big, then handle, mail and address. Held to the last frame.
import { CUE, b, BEAT, DURATION } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, beatPulse, fit } from '../engine.js';
import { icon } from '../icons.js';
import { emblem } from './logo.js';

export function build(root, ctx) {
  const glow = h('div', 'abs', root);
  Object.assign(glow.style, { width: '1200px', height: '1200px', left: '-60px', top: '-170px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(60,130,255,.45), rgba(30,80,255,.12) 40%, rgba(0,0,0,0) 70%)' });
  const holder = h('div', 'abs', root);
  const em = emblem(holder, ctx, 170);

  const t1 = h('div', 'label blue', root, `<span class="in">${COPY.endTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.endTitle[1]}</span>`);
  t1.style.fontSize = '128px';
  t2.style.fontSize = '128px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;

  // the number
  const phone = h('div', 'abs', root, `
    <div style="display:flex;align-items:center;gap:26px;padding:0 44px;height:100%">
      <span style="width:104px;height:104px;border-radius:50%;flex:none;display:grid;place-items:center;background:#fff;box-shadow:0 0 24px rgba(255,255,255,.6)"><span style="width:54px;height:54px;display:block">${icon('phone', { stroke: '#1a4fe0', sw: 2.4 })}</span></span>
      <span class="title num" style="font-size:118px;letter-spacing:2px;text-shadow:0 0 24px rgba(160,210,255,.8)">${COPY.phone}</span>
    </div>`);
  Object.assign(phone.style, { width: '880px', height: '170px', borderRadius: '85px', overflow: 'hidden',
    background: 'linear-gradient(180deg,#3479ff 0%,#1a4fe0 100%)', border: '3px solid rgba(190,225,255,.85)',
    boxShadow: '0 0 0 8px rgba(40,110,255,.25), 0 0 70px rgba(40,110,255,.75)' });
  fit(phone.querySelector('.num'), 880 - 88 - 104 - 26 - 10, 118);
  const shine = h('div', 'abs', phone);
  Object.assign(shine.style, { width: '220px', height: '170px', background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 100%)' });
  const sub = h('div', 'abs', root, COPY.phoneSub);
  Object.assign(sub.style, { fontWeight: '600', fontSize: '31px', color: '#d6e9ff', whiteSpace: 'nowrap' });
  const sw = sub.offsetWidth;

  const pill = (ic, main, small) => {
    const p = h('div', 'pill', root, `<span class="dot">${icon(ic, { sw: 2.4 })}</span><span>${main}${small ? `<span style="font-weight:500;opacity:.75;font-size:28px;margin-left:14px">${small}</span>` : ''}</span>`);
    p.style.fontSize = '36px';
    return { el: p, w: p.offsetWidth };
  };
  const pHandle = pill('at', COPY.handle, COPY.handleSub);
  const pMail = pill('mail', COPY.mail);
  const pAddr = pill('pin', COPY.address);

  return (t) => {
    const k = t - CUE.endIn;
    const pulse = beatPulse(t, BEAT, CUE.endIn, 6);
    set(glow, { o: 0.6 + 0.4 * Math.exp(-2 * Math.max(0, k)) + 0.2 * pulse, s: 1 + 0.05 * pulse });

    const se = spring(k + 0.05, 2.6, 0.5);
    set(holder, { x: 540, y: 420 + Math.sin(t * 1.7) * 7, s: (0.3 + 0.7 * se) * (1 + 0.03 * pulse), o: clamp((k + 0.05) / 0.06) });
    if (em.word) set(em.word, { s: 1, o: 1 });
    if (em.ribbon) { set(em.ribbon, { o: 1 }); em.ribbon.style.transform += ' skewX(-10deg)'; }
    if (em.mic) set(em.mic, { o: 1 });
    em.ring.style.borderWidth = `${(6 + 5 * pulse).toFixed(1)}px`;

    const k1 = k - 0.12, k2 = k - 0.24;
    set(t1, { x: 540 - w1 / 2 - 24, y: 640, s: 1.35 - 0.35 * spring(k1, 3, 0.5), o: clamp(k1 / 0.05), r: -2 });
    set(t2, { x: 540 - w2 / 2 + 24, y: 790, s: 1.35 - 0.35 * spring(k2, 3, 0.5), o: clamp(k2 / 0.05), r: -2 });
    wipe(t1, ease.outExpo(clamp(k1 / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp(k2 / 0.3)), 'r');

    const kp = t - CUE.endPhone;
    const sp = spring(kp, 2.8, 0.5);
    set(phone, { x: 100, y: 990 + 40 * (1 - sp), s: (0.7 + 0.3 * sp) * (1 + 0.02 * beatPulse(t, BEAT * 2, CUE.endPhone, 5)), o: clamp(kp / 0.06) });
    // a shine sweeps across the number every two bars
    const cyc = ((t - CUE.endPhone - 0.4) % (BEAT * 8) + BEAT * 8) % (BEAT * 8);
    set(shine, { x: -260 + 1500 * ease.inOutCubic(clamp(cyc / 0.9)), o: kp > 0.4 ? 1 : 0 });
    set(sub, { x: 540 - sw / 2, y: 1180 + 14 * (1 - ease.outCubic(clamp((kp - 0.2) / 0.3))), o: clamp((kp - 0.2) / 0.2) });

    for (const [p, at, y] of [[pHandle, CUE.endSocial, 1250], [pMail, CUE.endMail, 1345], [pAddr, CUE.endAddr, 1440]]) {
      const kk = t - at;
      const s2 = spring(kk, 3, 0.55);
      set(p.el, { x: 540 - p.w / 2 + 80 * (1 - s2), y, o: clamp(kk / 0.08), blur: 8 * (1 - clamp(kk / 0.15)) });
    }
  };
}
