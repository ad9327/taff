// Profile screens for the phone in the street shot: the studio's TikTok, Instagram and Snapchat pages,
// staged with the studio's own logo, bio and shots. No follower counts (none were given), no platform logos —
// each page is recognisable by its layout and colours, and the title above the phone names it.
import { COPY } from '../copy.mjs';
import { clamp, ease, set, h } from '../engine.js';
import { icon } from '../icons.js';

export const SW = 648, SH = 1118;
const THUMBS = ['singer', 'console', 'mic', 'pads', 'monitors', 'cite'];
const FALLBACK = ['#1b3a8f', '#0f2a6e', '#2a4fbf', '#13306f', '#1d47a8', '#0b2160'];

function statusBar(layer, color) {
  h('div', 'abs', layer, `<div style="display:flex;justify-content:space-between;align-items:center;width:${SW - 92}px;font-weight:600;font-size:24px;color:${color}">
    <span>21:40</span><span style="letter-spacing:3px;font-size:20px">▂▄▆ ▮</span></div>`).style.cssText += 'left:46px;top:20px;';
}

function avatar(ctx, parent, size, left, top, extra = '') {
  const a = h('div', 'abs', parent);
  Object.assign(a.style, { left: `${left}px`, top: `${top}px`, width: `${size}px`, height: `${size}px`, borderRadius: '50%', overflow: 'hidden', background: '#02040f' });
  if (extra) a.style.cssText += extra;
  const m = ctx.media(a, 'logoSmall');
  Object.assign(m.box.style, { left: '-28%', top: '-26%', width: '156%', height: '156%' });
  m.img.style.objectFit = 'contain';
  m.fallback.style.display = 'none';
  if (!m.has) a.innerHTML = `<div style="display:grid;place-items:center;width:100%;height:100%;font-family:Anton;font-size:${size * 0.32}px;background:radial-gradient(circle,#2f7bff,#0b2170)">RZ</div>`;
  return m;
}

function tile(ctx, parent, i, left, top, w, hh, radius = 0) {
  const t = h('div', 'abs', parent);
  Object.assign(t.style, { left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${hh}px`, overflow: 'hidden', borderRadius: `${radius}px`, background: FALLBACK[i % FALLBACK.length] });
  const src = ctx.poster(THUMBS[i % THUMBS.length]);
  if (src) {
    const im = h('img', '', t);
    im.src = src;
    im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
  }
  return t;
}

function button(parent, label, css) {
  const b = h('div', 'abs', parent, `<span>${label}</span>`);
  b.style.cssText += `display:grid;place-items:center;font-weight:700;${css}`;
  return b;
}

// The tap on the follow button: a ripple, a press, the label flips.
function tapper(parent, btn, follow, followed, pressedCss) {
  const ripple = h('div', 'abs', parent);
  Object.assign(ripple.style, { width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,.55)', pointerEvents: 'none' });
  const base = btn.style.background;
  const label = btn.firstChild;
  return (t, tapAt) => {
    const k = t - tapAt;
    const bx = parseFloat(btn.style.left) + btn.offsetWidth / 2, by = parseFloat(btn.style.top) + btn.offsetHeight / 2;
    const r = clamp(k / 0.4);
    set(ripple, { x: bx - 60, y: by - 60, s: 0.3 + 1.4 * ease.outCubic(r), o: k >= 0 && r < 1 ? 0.7 * (1 - r) : 0 });
    const press = k >= 0 && k < 0.16 ? Math.sin((k / 0.16) * Math.PI) : 0;
    btn.style.transform = `scale(${(1 - 0.07 * press).toFixed(4)})`;
    const done = k >= 0.08;
    label.textContent = done ? followed : follow;
    btn.style.background = done ? pressedCss : base;
  };
}

function tiktok(ctx, layer, s) {
  layer.style.background = '#0f0f12';
  statusBar(layer, '#fff');
  h('div', 'abs', layer, COPY.profileName).style.cssText += `top:70px;width:${SW}px;text-align:center;font-weight:700;font-size:30px;`;
  h('div', 'abs', layer, icon('back', { sw: 2.4 })).style.cssText += 'left:26px;top:72px;width:34px;height:34px;';
  const av = avatar(ctx, layer, 180, (SW - 180) / 2, 132, 'box-shadow:0 0 0 3px #2b2b30;');
  h('div', 'abs', layer, `@${COPY.profileHandle}`).style.cssText += `top:330px;width:${SW}px;text-align:center;font-weight:600;font-size:30px;`;
  const follow = button(layer, s.follow, 'left:48px;top:388px;width:250px;height:78px;border-radius:10px;background:#fe2c55;font-size:30px;');
  button(layer, 'Message', 'left:310px;top:388px;width:200px;height:78px;border-radius:10px;background:#2c2c30;font-size:28px;');
  button(layer, '▾', 'left:522px;top:388px;width:78px;height:78px;border-radius:10px;background:#2c2c30;font-size:28px;');
  h('div', 'abs', layer, COPY.profileBio.join('<br>')).style.cssText += `top:496px;width:${SW}px;text-align:center;font-size:26px;line-height:38px;color:#e8e8e8;`;
  const tabs = h('div', 'abs', layer);
  tabs.style.cssText += `top:640px;width:${SW}px;height:58px;border-bottom:1px solid #2b2b30;`;
  h('div', 'abs', tabs, icon('pads', { sw: 2 })).style.cssText += `left:${SW / 6 - 18}px;top:8px;width:36px;height:36px;`;
  h('div', 'abs', tabs).style.cssText += `left:${SW / 6 - 50}px;top:55px;width:100px;height:3px;background:#fff;`;
  for (let i = 0; i < 6; i++) {
    const t = tile(ctx, layer, i, (i % 3) * 217, 702 + Math.floor(i / 3) * 303, 214, 300);
    h('div', 'abs', t, '▷').style.cssText += 'left:12px;bottom:10px;top:auto;font-size:24px;font-weight:700;text-shadow:0 1px 4px #000;';
  }
  return { av, tap: tapper(layer, follow, s.follow, s.followed, '#2c2c30') };
}

function insta(ctx, layer, s) {
  layer.style.background = '#000';
  statusBar(layer, '#fff');
  h('div', 'abs', layer, `${COPY.profileHandle} <span style="font-size:24px">⌄</span>`).style.cssText += 'left:28px;top:70px;font-weight:700;font-size:34px;';
  h('div', 'abs', layer, icon('plus', { sw: 2.2 })).style.cssText += `left:${SW - 120}px;top:74px;width:36px;height:36px;border:2.5px solid #fff;border-radius:9px;`;
  h('div', 'abs', layer, '≡').style.cssText += `left:${SW - 64}px;top:62px;font-size:44px;`;
  const ring = h('div', 'abs', layer);
  Object.assign(ring.style, { left: '28px', top: '140px', width: '178px', height: '178px', borderRadius: '50%', background: 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' });
  const gapRing = h('div', 'abs', ring);
  Object.assign(gapRing.style, { left: '6px', top: '6px', width: '166px', height: '166px', borderRadius: '50%', background: '#000' });
  const av = avatar(ctx, gapRing, 154, 6, 6);
  h('div', 'abs', layer, COPY.profileName).style.cssText += 'left:234px;top:176px;font-weight:700;font-size:32px;';
  h('div', 'abs', layer, 'Studio d’enregistrement').style.cssText += 'left:234px;top:222px;font-size:25px;color:#a8a8a8;';
  h('div', 'abs', layer, COPY.profileBio.join('<br>')).style.cssText += 'left:28px;top:342px;font-size:26px;line-height:38px;';
  const follow = button(layer, s.follow, 'left:28px;top:472px;width:292px;height:70px;border-radius:14px;background:#0095f6;font-size:28px;');
  button(layer, 'Message', 'left:328px;top:472px;width:292px;height:70px;border-radius:14px;background:#363636;font-size:28px;');
  COPY.profileHighlights.forEach((lab, i) => {
    const c = h('div', 'abs', layer);
    Object.assign(c.style, { left: `${28 + i * 152}px`, top: '576px', width: '112px', height: '112px', borderRadius: '50%', border: '2px solid #555', padding: '5px' });
    tile(ctx, c, i + 2, 5, 5, 98, 98, 49);
    h('div', 'abs', layer, lab).style.cssText += `left:${28 + i * 152}px;top:698px;width:116px;text-align:center;font-size:22px;`;
  });
  const tabs = h('div', 'abs', layer);
  tabs.style.cssText += `top:744px;width:${SW}px;height:56px;border-bottom:1px solid #262626;`;
  h('div', 'abs', tabs, icon('pads', { sw: 2 })).style.cssText += `left:${SW / 6 - 17}px;top:8px;width:34px;height:34px;`;
  h('div', 'abs', tabs).style.cssText += `left:0;top:53px;width:${SW / 3}px;height:2px;background:#fff;`;
  for (let i = 0; i < 6; i++) tile(ctx, layer, i + 1, (i % 3) * 217, 803 + Math.floor(i / 3) * 217, 214, 214);
  return { av, tap: tapper(layer, follow, s.follow, s.followed, '#363636') };
}

function snap(ctx, layer, s) {
  layer.style.background = '#fff';
  layer.style.color = '#111';
  const head = h('div', 'abs', layer);
  Object.assign(head.style, { width: `${SW}px`, height: '300px', background: '#fffc00' });
  statusBar(layer, '#111');
  const av = avatar(ctx, layer, 196, (SW - 196) / 2, 190, 'box-shadow:0 0 0 7px #fff, 0 8px 30px rgba(0,0,0,.25);');
  h('div', 'abs', layer, COPY.profileName).style.cssText += `top:404px;width:${SW}px;text-align:center;font-weight:800;font-size:38px;color:#111;`;
  h('div', 'abs', layer, `${COPY.profileHandle} · Studio d’enregistrement`).style.cssText += `top:456px;width:${SW}px;text-align:center;font-size:24px;color:#666;`;
  const follow = button(layer, s.follow, 'left:51px;top:512px;width:300px;height:78px;border-radius:39px;background:#fffc00;color:#111;font-size:30px;font-weight:800;');
  button(layer, 'Message', 'left:367px;top:512px;width:230px;height:78px;border-radius:39px;background:#f1f1f1;color:#111;font-size:28px;');
  h('div', 'abs', layer, 'Stories').style.cssText += 'left:30px;top:630px;font-weight:800;font-size:30px;color:#111;';
  for (let i = 0; i < 3; i++) tile(ctx, layer, i + 3, 30 + i * 200, 680, 190, 290, 18);
  h('div', 'abs', layer, 'Spotlight').style.cssText += 'left:30px;top:1000px;font-weight:800;font-size:30px;color:#111;';
  for (let i = 0; i < 3; i++) tile(ctx, layer, i, 30 + i * 200, 1050, 190, 290, 18);
  return { av, tap: tapper(layer, follow, s.follow, s.followed, '#e9e9e9') };
}

export function profileScreen(ctx, parent, s) {
  const layer = h('div', 'abs', parent);
  Object.assign(layer.style, { width: `${SW}px`, height: `${SH}px`, overflow: 'hidden', fontFamily: 'Mont, sans-serif', color: '#fff' });
  const parts = { tiktok, insta, snap }[s.key](ctx, layer, s);
  return { layer, ...parts };
}
