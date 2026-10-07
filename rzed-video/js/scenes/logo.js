// The drop: RZED RECORDS slams inside the ring, rays turn behind it, then the studio's facts land one per beat.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, wipe, beatPulse, noise1 } from '../engine.js';
import { icon } from '../icons.js';

const CX = 540, CY = 720;

// Emblem: the client's logo file when present (assets/media.json → "logo"), else a typographic stand-in.
export function emblem(parent, ctx, R = 300) {
  const g = h('div', 'abs', parent);
  Object.assign(g.style, { width: `${2 * R}px`, height: `${2 * R}px`, left: `${-R}px`, top: `${-R}px` });
  const disc = h('div', 'abs', g);
  Object.assign(disc.style, { width: `${2 * R}px`, height: `${2 * R}px`, borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 40%, rgba(40,100,255,.55), rgba(6,18,70,.85) 62%, rgba(2,8,34,.95) 100%)',
    boxShadow: '0 0 120px rgba(40,110,255,.55)' });
  const ring = h('div', 'ring', g);
  Object.assign(ring.style, { left: '0px', top: '0px', width: `${2 * R}px`, height: `${2 * R}px`, borderWidth: `${R * 0.035}px` });
  const logoMedia = ctx.media(g, 'logo');
  Object.assign(logoMedia.box.style, { left: `${-R * 0.25}px`, top: `${-R * 0.25}px`, width: `${2.5 * R}px`, height: `${2.5 * R}px` });
  logoMedia.img.style.objectFit = 'contain';
  logoMedia.fallback.style.display = 'none';
  const parts = { g, disc, ring, logoMedia, word: null, ribbon: null, mic: null };
  if (!logoMedia.has) {
    logoMedia.box.style.display = 'none';
    const mic = h('div', 'abs', g, icon('mic', { stroke: '#d6ebff', sw: 1.6 }));
    Object.assign(mic.style, { width: `${R * 0.5}px`, height: `${R * 0.5}px`, left: `${R * 0.75}px`, top: `${R * 0.12}px`, filter: 'drop-shadow(0 0 12px #4cb8ff)' });
    const wordWrap = h('div', 'abs', g);
    Object.assign(wordWrap.style, { width: `${2 * R}px`, left: '0px', top: `${R * 0.55}px`, textAlign: 'center', filter: 'drop-shadow(0 6px 0 #0a1c5e) drop-shadow(0 0 24px rgba(76,184,255,.8))' });
    const word = h('div', '', wordWrap, COPY.brand);
    Object.assign(word.style, { fontFamily: 'Anton', fontSize: `${R * 0.98}px`, lineHeight: '1', display: 'inline-block', transform: 'skewX(-10deg)',
      background: 'linear-gradient(180deg, #ffffff 0%, #e2f1ff 36%, #7cbcff 50%, #2a6bff 60%, #cfe7ff 100%)',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '2px', paddingRight: '10px' });
    const ribbon = h('div', 'abs', g, COPY.brandSub);
    Object.assign(ribbon.style, { left: `${R * 0.42}px`, top: `${R * 1.5}px`, width: `${R * 1.16}px`, textAlign: 'center', fontWeight: '800', fontSize: `${R * 0.15}px`,
      letterSpacing: `${R * 0.045}px`, padding: `${R * 0.02}px 0 ${R * 0.02}px ${R * 0.045}px`, background: 'linear-gradient(180deg,#2a6cff,#1847d6)', borderRadius: '6px',
      boxShadow: '0 0 30px rgba(40,110,255,.7)', transform: 'skewX(-10deg)' });
    Object.assign(parts, { word: wordWrap, ribbon, mic });
  }
  return parts;
}

export function build(root, ctx) {
  // rays
  const rays = h('div', 'abs', root);
  Object.assign(rays.style, { width: '2000px', height: '2000px', left: `${CX - 1000}px`, top: `${CY - 1000}px`, borderRadius: '50%',
    background: 'repeating-conic-gradient(from 0deg, rgba(80,150,255,.22) 0deg 4deg, rgba(80,150,255,0) 4deg 15deg)',
    WebkitMaskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.6) 30%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 0%, rgba(0,0,0,.6) 30%, transparent 62%)' });
  const glow = h('div', 'abs', root);
  Object.assign(glow.style, { width: '1400px', height: '1400px', left: `${CX - 700}px`, top: `${CY - 700}px`, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(60,130,255,.55), rgba(30,80,255,.15) 40%, rgba(0,0,0,0) 70%)' });

  // shockwave
  const shock = h('div', 'ring', root);

  const holder = h('div', 'abs', root);
  const em = emblem(holder, ctx, 300);

  // facts
  const label = h('div', 'label blue', root, `<span class="in">${COPY.studioLabel}</span>`);
  label.style.fontSize = '74px';
  const lw = label.offsetWidth;
  const pill = (ic, txt) => {
    const p = h('div', 'pill', root, `<span class="dot">${icon(ic, { sw: 2.4 })}</span><span>${txt}</span>`);
    p.style.fontSize = '42px';
    return { el: p, w: p.offsetWidth };
  };
  const p1 = pill('pin', COPY.city);
  const p2 = pill('clock', COPY.hours);
  const tag = h('div', 'abs', root, `✦ ${COPY.tagline} ✦`);
  Object.assign(tag.style, { fontStyle: 'italic', fontWeight: '600', fontSize: '42px', color: '#d6e9ff', whiteSpace: 'nowrap', textShadow: '0 0 20px rgba(76,184,255,.6)' });
  const tw_ = tag.offsetWidth;

  return (t) => {
    const k = t - CUE.drop;
    const pre = clamp((t - b(7.25)) / b(0.75));
    const pulse = beatPulse(t, BEAT, CUE.drop, 7);

    // rays + glow
    set(rays, { r: t * 9, o: k < 0 ? pre * 0.4 : 0.55 + 0.45 * Math.exp(-3 * k) + 0.15 * pulse, s: k < 0 ? 0.6 + 0.4 * pre : 1 + 0.05 * pulse });
    set(glow, { o: k < 0 ? pre * 0.8 : 0.7 + 0.3 * Math.exp(-2.5 * k) + 0.2 * pulse, s: 1 + 0.06 * pulse });

    // shockwave from the ring on the drop
    const sk = clamp(k / 0.7);
    const sr = 300 + 800 * ease.outCubic(sk);
    Object.assign(shock.style, { left: `${CX - sr}px`, top: `${CY - sr}px`, width: `${2 * sr}px`, height: `${2 * sr}px`, borderWidth: `${(14 * (1 - sk) + 1).toFixed(1)}px` });
    shock.style.opacity = k >= 0 ? (1 - sk).toFixed(3) : '0';
    shock.style.visibility = k >= 0 && sk < 1 ? 'visible' : 'hidden';

    // emblem slam
    const float = Math.sin(t * 1.7) * 9 + noise1(t * 0.8, 3) * 4;
    if (k < 0) set(holder, { o: 0 });
    else {
      const sp = spring(k, 2.6, 0.45);
      set(holder, { x: CX, y: CY + float, s: (0.25 + 0.75 * sp) * (1 + 0.025 * pulse), o: clamp(k / 0.05), blur: 16 * (1 - clamp(k / 0.15)) });
      if (em.word) {
        const kw = k - 0.05;
        set(em.word, { s: kw < 0 ? 2.4 : 2.4 - 1.4 * spring(kw, 3.2, 0.5), o: clamp(kw / 0.05), blur: 12 * (1 - clamp(kw / 0.12)) });
        em.word.style.transformOrigin = '50% 50%';
        const kr = k - 0.15;
        set(em.ribbon, { y: 30 * (1 - ease.outBack(clamp(kr / 0.35))), o: clamp(kr / 0.1), r: 0 });
        em.ribbon.style.transform += ' skewX(-10deg)';
        set(em.mic, { y: -40 * (1 - ease.outBack(clamp((k - 0.1) / 0.4))), o: clamp((k - 0.1) / 0.1) });
      }
      em.ring.style.borderWidth = `${(10 + 8 * pulse).toFixed(1)}px`;
    }

    // STUDIO D'ENREGISTREMENT
    const kl = t - CUE.studioLabel;
    set(label, { x: CX - lw / 2, y: 1100 + 20 * (1 - ease.outCubic(clamp(kl / 0.3))), o: kl < 0 ? 0 : 1, s: 1 + 0.08 * (1 - ease.outCubic(clamp(kl / 0.25))) });
    wipe(label, ease.outExpo(clamp(kl / 0.35)), 'l');
    const inner = label.firstChild;
    inner.style.transform = `translateY(${(60 * (1 - ease.outCubic(clamp((kl - 0.05) / 0.3)))).toFixed(1)}px)`;

    // pills
    for (const [p, at, y] of [[p1, CUE.pill1, 1255], [p2, CUE.pill2, 1370]]) {
      const kp = t - at;
      const sp = spring(kp, 3, 0.55);
      set(p.el, { x: CX - p.w / 2 + 120 * (1 - sp), y, o: clamp(kp / 0.08), blur: 8 * (1 - clamp(kp / 0.15)) });
    }

    // tagline
    const kt = t - CUE.tagline;
    set(tag, { x: CX - tw_ / 2, y: 1495 + 16 * (1 - ease.outCubic(clamp(kt / 0.4))), o: clamp(kt / 0.3) });
    tag.style.letterSpacing = `${(6 * (1 - ease.outCubic(clamp(kt / 0.6)))).toFixed(2)}px`;
  };
}
