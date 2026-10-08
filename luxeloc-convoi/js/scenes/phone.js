// The phone: it rises off the table under RÉSERVE EN UN MESSAGE, its screen lights up on the client's Snapchat profile
// (baked into the frames by tools/bake-phone.py), a yellow Snapchat pill gives the username; the screen swipes to the
// WhatsApp chat and a green pill gives the account. A slow push while it holds.
import { COPY } from '../copy.mjs';
import { b, BEAT, PHONE_RISE, PHONE_SWIPE } from '../timeline.mjs';
import { segAt } from '../rig.js';
import { clamp, ease, spring, set, h, wipe } from '../engine.js';
import { icon } from '../icons.js';

const LAST = 213;            // last frame of assets/media/phone (60 fps)
const ON = 178;              // from here the frames have the lit screen (assets/media/phone_on)
const SWIPE_N = 15;
const pad = (n) => String(n).padStart(4, '0');

export function build(root, ctx) {
  const box = h('div', 'pic', root);
  box.style.transformOrigin = '540px 930px';
  const img = h('img', '', box);
  img.decoding = 'sync';
  let last = '';

  const t1 = h('div', 'label gold', root, `<span class="in">${COPY.phoneTitle[0]}</span>`);
  const t2 = h('div', 'label white', root, `<span class="in">${COPY.phoneTitle[1]}</span>`);
  t1.style.fontSize = '112px';
  t2.style.fontSize = '112px';
  const w1 = t1.offsetWidth, w2 = t2.offsetWidth;

  const callout = (cls, net, caption, handle) => {
    const cap = h('div', 'abs phone-cap', root, caption);
    const pill = h('div', `abs phone-pill ${cls}`, root, `<span class="ic">${icon(net, 52)}</span><span>${handle}</span>`);
    return { cap, cw: cap.scrollWidth, pill, pw: pill.offsetWidth };
  };
  const snap = callout('snap', 'snapDark', COPY.phoneSnap[0], COPY.phoneSnap[1]);
  const wa = callout('wa', 'whatsapp', COPY.phoneWa[0], COPY.phoneWa[1]);

  const show = (c, k, out) => {
    const sc = spring(k, 3, 0.55);
    set(c.cap, { x: 540 - c.cw / 2, y: 1418 + 20 * (1 - sc), o: clamp(k / 0.08) * out });
    wipe(c.cap, ease.outExpo(clamp(k / 0.35)), 'l');
    const kp = k - 0.08;
    set(c.pill, { x: 540 - c.pw / 2, y: 1470, s: 0.6 + 0.4 * spring(kp, 3.4, 0.5), o: clamp(kp / 0.06) * out });
  };

  return (t) => {
    const g = segAt(t);
    const on = g.kind === 'phone';
    root.style.display = on ? 'block' : 'none';
    if (!on) return;
    const k = t - g.a;
    const RISE = b(PHONE_RISE), SW = b(PHONE_SWIPE);

    // which picture
    let src;
    if (k < RISE) {
      const n = clamp(Math.round(LAST * (k / RISE)), 0, LAST);
      src = n >= ON ? `assets/media/phone_on/${pad(n + 1)}.jpg` : `assets/media/phone/${pad(n + 1)}.jpg`;
    } else if (k < SW) src = 'assets/media/phone_hold/snap.jpg';
    else {
      const i = Math.floor((k - SW) * 60);
      src = i < SWIPE_N ? `assets/media/phone_hold/swipe_${String(i).padStart(2, '0')}.jpg` : 'assets/media/phone_hold/wa.jpg';
    }
    if (src !== last) { img.src = src; last = src; ctx.wait(img.decode().catch(() => {})); }
    const push = 1 + 0.05 * ease.inOutCubic(clamp((k - RISE) / (g.z - g.a - RISE)));
    set(box, { s: push });

    // RÉSERVE EN / UN MESSAGE while it rises, gone as the screen lights up
    const out = 1 - clamp((k - (b(5) - 0.15)) / 0.15);
    const k1 = k - 0.1, k2 = k - 0.22;
    set(t1, { x: 540 - w1 / 2 - 22, y: 700, s: 1.35 - 0.35 * spring(k1, 3, 0.5), o: clamp(k1 / 0.05) * out, r: -2 });
    set(t2, { x: 540 - w2 / 2 + 22, y: 838, s: 1.35 - 0.35 * spring(k2, 3, 0.5), o: clamp(k2 / 0.05) * out, r: -2 });
    wipe(t1, ease.outExpo(clamp(k1 / 0.3)), 'l');
    wipe(t2, ease.outExpo(clamp(k2 / 0.3)), 'r');

    // the callouts
    const ks = k - (RISE + 0.05);
    show(snap, ks, ks > 0 ? 1 - clamp((k - (SW - 0.1)) / 0.12) : 0);
    const kw = k - (SW + 0.3);
    show(wa, kw, kw > 0 ? 1 : 0);
  };
}
