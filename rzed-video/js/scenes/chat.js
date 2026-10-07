// "ÉCRIS-NOUS.": a phone with a staged booking chat; each message pops on its beat and pushes the thread up.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, noise1 } from '../engine.js';
import { icon } from '../icons.js';

const PH = { x: 200, y: 420, w: 680, h: 1150 };
const HEADER = 150, INPUT = 110, GAP = 18;

export function build(root, ctx) {
  const title = h('div', 'label blue', root, `<span class="in">${COPY.chatTitle}</span>`);
  title.style.fontSize = '128px';
  const tw_ = title.offsetWidth;

  const stage3d = h('div', 'abs', root);
  Object.assign(stage3d.style, { width: '1080px', height: '1920px', perspective: '2200px', perspectiveOrigin: '540px 980px' });
  const phone = h('div', 'abs', stage3d);
  Object.assign(phone.style, { width: `${PH.w}px`, height: `${PH.h}px`, borderRadius: '84px', padding: '16px', transformOrigin: '50% 50%',
    background: 'linear-gradient(145deg, #4a5674 0%, #10162a 22%, #0a0e1c 70%, #3c4866 100%)',
    boxShadow: '0 0 0 2px rgba(150,190,255,.35), 0 40px 120px rgba(0,4,30,.8), 0 0 90px rgba(40,110,255,.45)' });
  const screen = h('div', '', phone);
  Object.assign(screen.style, { position: 'relative', width: '100%', height: '100%', borderRadius: '68px', overflow: 'hidden',
    background: 'linear-gradient(180deg, #0c1328 0%, #0a1024 100%)' });
  // subtle wallpaper pattern
  const wall = h('div', 'abs', screen);
  Object.assign(wall.style, { width: '100%', height: '100%', opacity: '.5',
    background: 'radial-gradient(circle at 20% 30%, rgba(40,90,255,.18), transparent 40%), radial-gradient(circle at 80% 75%, rgba(0,160,255,.12), transparent 45%)' });
  const island = h('div', 'abs', screen);
  Object.assign(island.style, { width: '150px', height: '40px', left: `${(PH.w - 32 - 150) / 2}px`, top: '18px', borderRadius: '20px', background: '#000' });

  // header
  const head = h('div', 'abs', screen, `
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
  const avLogo = ctx.media(document.createElement('div'), 'logo');
  if (avLogo.has) {
    av.textContent = '';
    av.style.background = '#02040f';
    av.appendChild(avLogo.box);
    Object.assign(avLogo.box.style, { left: '-28%', top: '-26%', width: '156%', height: '156%' });
    avLogo.img.style.objectFit = 'contain';
    avLogo.fallback.style.display = 'none';
  }

  // input bar
  const inputBar = h('div', 'abs', screen, `
    <div style="display:flex;align-items:center;gap:14px;padding:0 20px;height:100%">
      <span style="width:34px;height:34px;opacity:.8">${icon('plus', { sw: 2.4, stroke: '#9fc6ff' })}</span>
      <span style="flex:1;height:58px;border-radius:29px;background:rgba(255,255,255,.07);border:1px solid rgba(140,190,255,.2)"></span>
      <span style="width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#3b7bff,#1847d6)"><span style="width:30px;height:30px;display:block">${icon('send', { sw: 2.2 })}</span></span>
    </div>`);
  Object.assign(inputBar.style, { width: '100%', height: `${INPUT}px`, top: `${PH.h - 32 - INPUT}px`, background: 'rgba(14,22,52,.95)', zIndex: 2 });

  const ats = [CUE.msg1, CUE.msg2, CUE.msg3, CUE.msg4, CUE.msg5];
  const SW = PH.w - 32;
  const msgs = COPY.chat.map((m, i) => {
    const el = h('div', 'abs', screen, `<div class="txt">${m.text}</div><div class="meta">${m.me ? '21:4' + i + ' ✓✓' : '21:4' + i}</div>`);
    Object.assign(el.style, { maxWidth: '480px', padding: '18px 26px 12px', borderRadius: m.me ? '30px 30px 8px 30px' : '30px 30px 30px 8px',
      fontSize: '34px', fontWeight: '500', lineHeight: '1.25', transformOrigin: m.me ? '100% 100%' : '0% 100%',
      background: m.me ? 'linear-gradient(180deg,#3577ff,#1d52e6)' : 'rgba(34,46,92,.95)',
      border: m.me ? 'none' : '1px solid rgba(140,190,255,.25)', boxShadow: m.me ? '0 8px 30px rgba(30,90,255,.45)' : '0 8px 30px rgba(0,0,20,.4)' });
    const meta = el.querySelector('.meta');
    Object.assign(meta.style, { fontSize: '18px', opacity: '.7', textAlign: 'right', marginTop: '4px', color: m.me ? '#d7e8ff' : '#9fb8e8' });
    return { el, me: m.me, at: ats[i], w: el.offsetWidth, h: el.offsetHeight };
  });

  // floating chips with the key facts of the thread
  const chip = (txt) => { const c = h('div', 'pill', root, `<span>${txt}</span>`); c.style.fontSize = '36px'; c.style.padding = '16px 30px'; return { el: c, w: c.offsetWidth }; };
  const chipC = chip(COPY.chatChannels);

  return (t) => {
    ctx.wait(avLogo.frame(0));
    const kt = t - CUE.chatIn;
    set(title, { x: 540 - tw_ / 2, y: 190, s: 1.35 - 0.35 * spring(kt + 0.04, 3, 0.5), o: clamp((kt + 0.04) / 0.05), r: -2 });
    wipe(title, ease.outExpo(clamp((kt + 0.04) / 0.3)), 'l');

    // phone rises in with the push, then sways
    const kp = t - (CUE.chatIn - b(0.25));
    const sp = spring(kp, 1.8, 0.7);
    const sway = Math.sin(t * 0.9) * 5;
    set(phone, { x: PH.x, y: PH.y + 260 * (1 - sp) + noise1(t * 0.6, 8) * 6, ry: -14 + sway + 20 * (1 - sp), rx: 6, r: -2 + 2 * (1 - sp), s: 1 });

    // thread: newest at the bottom, older ones pushed up by springs
    const base = PH.h - 32 - INPUT - 22;
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
      const x = m.me ? SW - 22 - m.w : 22;
      set(m.el, { x, y, s: 0.55 + 0.45 * pop, o: clamp(k / 0.06) });
    }

    // chips
    for (const [c, at, x, y] of [[chipC, CUE.msg5 + 0.2, 540, 1600]]) {
      const k = t - at;
      const s2 = spring(k, 3, 0.55);
      const ax = x === 540 ? 540 - c.w / 2 : x > 540 ? x - c.w : x;
      set(c.el, { x: ax + (x > 540 ? 60 : x < 540 ? -60 : 0) * (1 - s2), y: y + 30 * (1 - s2) + Math.sin(t * 2 + at) * 5, s: 0.85 + 0.15 * s2, o: clamp(k / 0.08), r: x > 540 ? 3 : x < 540 ? -3 : 0 });
    }
  };
}
