// Pieces shared by the scenes: chrome text with a travelling highlight, the LED light bar, the wordmark.
import { clamp, ease, set, h, fit } from '../engine.js';
import { COPY } from '../copy.mjs';

// Chrome text whose highlight band travels across the letters: shine(k) with k in [0, 1].
export function chrome(parent, text, size, maxW = 960, gold = false) {
  const el = h('div', 'abs', parent, text);
  Object.assign(el.style, { fontFamily: 'Michroma, sans-serif', whiteSpace: 'nowrap', lineHeight: '1.1', padding: '.12em .04em .04em',
    backgroundImage: gold
      ? 'linear-gradient(100deg, #9c7a32 0%, #d9b25f 38%, #fff3cf 48%, #d9b25f 58%, #9c7a32 100%)'
      : 'linear-gradient(100deg, #8d939c 0%, #e9ecf0 38%, #ffffff 48%, #e9ecf0 58%, #8d939c 100%)',
    backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
    filter: gold ? 'drop-shadow(0 0 18px rgba(217,178,95,.35))' : 'drop-shadow(0 4px 18px rgba(0,0,0,.6))' });
  const s = fit(el, maxW, size);
  return {
    el, size: s, w: el.scrollWidth, h: el.offsetHeight,
    shine(k) { el.style.backgroundPosition = `${(100 - 100 * clamp(k)).toFixed(2)}% 0`; },
  };
}

// LED light bar: segments light up from the centre outwards, then a chase runs along them.
export function lightBar(parent, width = 900, segs = 30) {
  const bar = h('div', 'abs', parent);
  Object.assign(bar.style, { width: `${width}px`, height: '10px' });
  const segW = width / segs;
  const cells = Array.from({ length: segs }, (_, i) => {
    const c = h('div', 'abs', bar);
    Object.assign(c.style, { left: `${i * segW + 2}px`, width: `${segW - 4}px`, height: '10px', borderRadius: '2px', background: '#fff4dc' });
    return c;
  });
  const glow = h('div', 'abs', bar);
  Object.assign(glow.style, { left: '-40px', top: '-30px', width: `${width + 80}px`, height: '70px', borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(255,230,180,.55), rgba(255,200,120,0) 70%)' });
  return {
    bar,
    // k: how far the bar has opened (0..1); chase: seconds since the chase started (or <0)
    update(k, chase = -1) {
      const half = segs / 2;
      cells.forEach((c, i) => {
        const d = Math.abs(i + 0.5 - half) / half;      // 0 centre → 1 ends
        const on = clamp((k - d * 0.85) / 0.15);
        let lv = on;
        if (chase >= 0) {
          const pos = (chase * 1.6) % 1.4;
          const x = i / segs;
          lv *= 0.55 + 0.45 * Math.exp(-Math.pow((x - pos + 0.2) / 0.08, 2));
        }
        c.style.opacity = lv.toFixed(3);
        c.style.boxShadow = lv > 0.05 ? `0 0 ${(14 * lv).toFixed(1)}px rgba(255,225,170,${(0.9 * lv).toFixed(2)})` : 'none';
      });
      glow.style.opacity = (0.9 * ease.outCubic(k)).toFixed(3);
    },
  };
}

// The two-line wordmark: LUXELOC (chrome) over RESA93 (gold, spaced).
export function wordmark(parent, scale = 1) {
  const g = h('div', 'abs', parent);
  const top = chrome(g, COPY.brandTop, 150 * scale, 960 * scale);
  const bot = chrome(g, COPY.brandBottom, 76 * scale, 900 * scale, true);
  bot.el.style.letterSpacing = `${28 * scale}px`;
  bot.w = bot.el.scrollWidth;
  return { g, top, bot };
}
