// The phone: someone in the cité opens the studio's TikTok, Instagram and Snapchat, follows each one, then writes
// to book. Over the street shot the phone rises, swipes through the profiles and lands on the booking chat.
import { CUE, b } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, noise1 } from '../engine.js';
import { icon } from '../icons.js';
import { profileScreen, SW, SH } from './profiles.js';

const PH = { x: 200, y: 420, w: 680, h: 1150 };
const HEADER = 150, INPUT = 110, GAP = 18;
const TAP = b(1.5);                     // a beat and a half after a profile shows, the follow button is tapped

export function build(root, ctx) {
  // street shot: someone in the cité on their phone; the phone then rises over it
  const street = ctx.media(root, 'cite', 'full');
  Object.assign(street.box.style, { left: '0px', top: '0px', width: '1080px', height: '1920px' });
  street.fallback.style.display = 'none';
  const dim = h('div', 'abs', root);
  Object.assign(dim.style, { width: '1080px', height: '1920px', background: 'linear-gradient(180deg, rgba(2,6,26,.8) 0%, rgba(2,6,26,.55) 40%, rgba(2,6,26,.85) 100%)' });
  if (!street.has) { street.box.style.display = 'none'; dim.style.display = 'none'; }

  // one title per screen: two-tone labels for the profiles, a single label for the chat
  const starts = [CUE.chatIn, CUE.instaIn, CUE.snapIn, CUE.chatScreen];
  const titleTexts = [...COPY.socials.map((s) => s.title), [COPY.chatTitle]];
  const titles = titleTexts.map((lines, i) => {
    const els = lines.map((txt, j) => {
      const el = h('div', `label ${j ? 'white' : 'blue'}`, root, `<span class="in">${txt}</span>`);
      el.style.fontSize = lines.length > 1 ? '112px' : '128px';
      return { el, w: el.offsetWidth };
    });
    return { els, at: starts[i], end: starts[i + 1] ?? Infinity };
  });

  // the phone
  const stage3d = h('div', 'abs', root);
  Object.assign(stage3d.style, { width: '1080px', height: '1920px', perspective: '2200px', perspectiveOrigin: '540px 980px' });
  const phone = h('div', 'abs', stage3d);
  Object.assign(phone.style, { width: `${PH.w}px`, height: `${PH.h}px`, borderRadius: '84px', padding: '16px', transformOrigin: '50% 50%',
    background: 'linear-gradient(145deg, #4a5674 0%, #10162a 22%, #0a0e1c 70%, #3c4866 100%)',
    boxShadow: '0 0 0 2px rgba(150,190,255,.35), 0 40px 120px rgba(0,4,30,.8), 0 0 90px rgba(40,110,255,.45)' });
  const screen = h('div', '', phone);
  Object.assign(screen.style, { position: 'relative', width: '100%', height: '100%', borderRadius: '68px', overflow: 'hidden', background: '#0a1024' });

  // screens: three profiles, then the chat
  const profiles = COPY.socials.map((s) => profileScreen(ctx, screen, s));
  const chat = h('div', 'abs', screen);
  Object.assign(chat.style, { width: `${SW}px`, height: `${SH}px`, overflow: 'hidden', background: 'linear-gradient(180deg, #0c1328 0%, #0a1024 100%)' });
  const layers = [...profiles.map((p) => p.layer), chat];
  const island = h('div', 'abs', screen);
  Object.assign(island.style, { width: '150px', height: '40px', left: `${(SW - 150) / 2}px`, top: '18px', borderRadius: '20px', background: '#000' });

  // --- chat screen ---
  const wall = h('div', 'abs', chat);
  Object.assign(wall.style, { width: '100%', height: '100%', opacity: '.5',
    background: 'radial-gradient(circle at 20% 30%, rgba(40,90,255,.18), transparent 40%), radial-gradient(circle at 80% 75%, rgba(0,160,255,.12), transparent 45%)' });
  const head = h('div', 'abs', chat, `
    <div style="display:flex;align-items:center;gap:18px;padding:70px 28px 0 22px;">
      <span style="width:34px;height:34px;opacity:.85">${icon('back', { sw: 2.4, stroke: '#9fc6ff' })}</span>
      <span class="avatar" style="position:relative;overflow:hidden;width:72px;height:72px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#3b7bff,#0b2170);box-shadow:0 0 0 2px #4cb8ff, 0 0 18px rgba(60,130,255,.8);font-family:Anton;font-size:30px;letter-spacing:1px">RZ</span>
      <span style="display:flex;flex-direction:column;gap:4px"><span style="font-weight:700;font-size:30px">${COPY.chatName}</span><span style="font-size:22px;color:#6fd2ff;font-weight:500">● ${COPY.chatStatus}</span></span>
      <span style="flex:1"></span>
      <span style="width:34px;height:34px;opacity:.85">${icon('video', { sw: 2, stroke: '#9fc6ff' })}</span>
      <span style="width:30px;height:30px;opacity:.85;margin-left:14px">${icon('phone', { sw: 2, stroke: '#9fc6ff' })}</span>
    </div>`);
  Object.assign(head.style, { width: '100%', height: `${HEADER}px`, background: 'rgba(14,22,52,.92)', borderBottom: '1px solid rgba(120,170,255,.2)', zIndex: 2 });
  // the studio's logo as the contact picture
  const av = head.querySelector('.avatar');
  const avLogo = ctx.media(document.createElement('div'), 'logoSmall');
  if (avLogo.has) {
    av.textContent = '';
    av.style.background = '#02040f';
    av.appendChild(avLogo.box);
    Object.assign(avLogo.box.style, { left: '-28%', top: '-26%', width: '156%', height: '156%' });
    avLogo.img.style.objectFit = 'contain';
    avLogo.fallback.style.display = 'none';
  }
  const inputBar = h('div', 'abs', chat, `
    <div style="display:flex;align-items:center;gap:14px;padding:0 20px;height:100%">
      <span style="width:34px;height:34px;opacity:.8">${icon('plus', { sw: 2.4, stroke: '#9fc6ff' })}</span>
      <span style="flex:1;height:58px;border-radius:29px;background:rgba(255,255,255,.07);border:1px solid rgba(140,190,255,.2)"></span>
      <span style="width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#3b7bff,#1847d6)"><span style="width:30px;height:30px;display:block">${icon('send', { sw: 2.2 })}</span></span>
    </div>`);
  Object.assign(inputBar.style, { width: '100%', height: `${INPUT}px`, top: `${SH - INPUT}px`, background: 'rgba(14,22,52,.95)', zIndex: 2 });
  const ats = [CUE.msg1, CUE.msg2, CUE.msg3, CUE.msg4, CUE.msg5];
  const msgs = COPY.chat.map((m, i) => {
    const el = h('div', 'abs', chat, `<div class="txt">${m.text}</div><div class="meta">${m.me ? '21:4' + i + ' ✓✓' : '21:4' + i}</div>`);
    Object.assign(el.style, { maxWidth: '480px', padding: '18px 26px 12px', borderRadius: m.me ? '30px 30px 8px 30px' : '30px 30px 30px 8px',
      fontSize: '34px', fontWeight: '500', lineHeight: '1.25', transformOrigin: m.me ? '100% 100%' : '0% 100%',
      background: m.me ? 'linear-gradient(180deg,#3577ff,#1d52e6)' : 'rgba(34,46,92,.95)',
      border: m.me ? 'none' : '1px solid rgba(140,190,255,.25)', boxShadow: m.me ? '0 8px 30px rgba(30,90,255,.45)' : '0 8px 30px rgba(0,0,20,.4)' });
    const meta = el.querySelector('.meta');
    Object.assign(meta.style, { fontSize: '18px', opacity: '.7', textAlign: 'right', marginTop: '4px', color: m.me ? '#d7e8ff' : '#9fb8e8' });
    return { el, me: m.me, at: ats[i], w: el.offsetWidth, h: el.offsetHeight };
  });

  // one chip under the phone per screen: where to find the studio
  const chips = [...COPY.socials.map((s) => s.chip), COPY.chatChannels].map((txt, i) => {
    const c = h('div', 'pill', root, `<span>${txt}</span>`);
    c.style.fontSize = '36px';
    c.style.padding = '16px 30px';
    return { el: c, w: c.offsetWidth, at: i < 3 ? starts[i + 0] + (i === 0 ? b(1.25) : 0.3) : CUE.msg5 + 0.2, end: starts[i + 1] ?? Infinity };
  });

  return (t) => {
    ctx.wait(avLogo.frame(0));
    for (const p of profiles) ctx.wait(p.av.frame(0));

    // titles: slam in on their beat, wipe out just before the next one
    for (const ti of titles) {
      const k = t - ti.at;
      const out = clamp((t - (ti.end - 0.14)) / 0.16);
      ti.els.forEach((e, j) => {
        const kj = k - j * 0.1;
        const sp = spring(kj + 0.04, 3, 0.5);
        const y = ti.els.length > 1 ? 150 + j * 132 : 190;
        set(e.el, { x: 540 - e.w / 2 + (j ? 24 : -24), y, s: 1.35 - 0.35 * sp, o: kj > -0.04 && out < 1 ? clamp((kj + 0.04) / 0.05) : 0, r: -2 });
        wipe(e.el, ease.outExpo(clamp((kj + 0.04) / 0.3)) * (1 - ease.inCubic(out)), j ? 'r' : 'l');
      });
    }

    // the street shot plays slowed to cover the scene, then dims and softens as the phone comes up
    const rise = street.has ? clamp((t - CUE.phoneIn + 0.1) / 0.5) : 1;
    if (street.has) {
      ctx.wait(street.frame((t - b(35.5)) * 0.6));
      set(street.box, { s: 1.02 + 0.04 * rise, blur: 9 * ease.inOutCubic(rise) });
      dim.style.opacity = (0.25 + 0.75 * ease.inOutCubic(rise)).toFixed(3);
    }

    // phone rises, then sways
    const kp = t - (street.has ? CUE.phoneIn : CUE.chatIn - b(0.25));
    const sp = spring(kp, 1.8, 0.7);
    const sway = Math.sin(t * 0.9) * 5;
    set(phone, { x: PH.x, y: PH.y + (street.has ? 1500 : 260) * (1 - sp) + noise1(t * 0.6, 8) * 6, ry: -14 + sway + 20 * (1 - sp), rx: 6, r: -2 + 2 * (1 - sp), s: 1, o: kp > -0.02 ? 1 : 0 });

    // screens swipe in from the right; the one leaving slides a third of the way out under it
    const layerStarts = [CUE.phoneIn, CUE.instaIn, CUE.snapIn, CUE.chatScreen];
    const enterOf = (i) => (i === 0 ? 1 : ease.inOutCubic(clamp((t - layerStarts[i] + 0.16) / 0.32)));
    layers.forEach((layer, i) => {
      const enter = enterOf(i);
      const exit = i < layers.length - 1 ? enterOf(i + 1) : 0;
      const vis = enter > 0 && exit < 1;
      set(layer, { x: SW * (1 - enter) - SW * 0.3 * exit, o: vis ? 1 - 0.4 * exit : 0, blur: 6 * Math.sin(Math.PI * enter) * (i ? 1 : 0) });
    });
    profiles.forEach((p, i) => p.tap(t, layerStarts[i] + TAP));

    // thread: newest at the bottom, older ones pushed up by springs
    const base = SH - INPUT - 22;
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      const k = t - m.at;
      if (k < 0) { set(m.el, { o: 0 }); continue; }
      let y = base - m.h;
      for (let j = i + 1; j < msgs.length; j++) {
        const kj = t - msgs[j].at;
        if (kj > 0) y -= (msgs[j].h + GAP) * spring(kj, 3.2, 0.7);
      }
      const pop = spring(k, 3.6, 0.5);
      set(m.el, { x: m.me ? SW - 22 - m.w : 22, y, s: 0.55 + 0.45 * pop, o: clamp(k / 0.06) });
    }

    // chips
    for (const c of chips) {
      const k = t - c.at;
      const s2 = spring(k, 3, 0.55);
      const out = clamp((t - (c.end - 0.14)) / 0.14);
      set(c.el, { x: 540 - c.w / 2, y: 1600 + 30 * (1 - s2) + Math.sin(t * 2 + c.at) * 5, s: (0.85 + 0.15 * s2) * (1 - 0.15 * out), o: k > 0 ? clamp(k / 0.08) * (1 - out) : 0 });
    }
  };
}
