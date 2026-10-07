// Hook: ROULE EN [GT3 / RS6 / M5 / SL 63 / RS7 / RS4] — a car per beat; then black, LOUE LA VOITURE DE TES RÊVES.,
// the rev counter climbs to the red line, the limiter stutters, and the drop.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, fit, noise1 } from '../engine.js';
import { chrome } from './ui.js';

const GC = { x: 540, y: 1230, r: 290 };       // rev counter
const A0 = 225, SWEEP = 270;                   // dial from 225° (0 rpm) clockwise 270° (8000 rpm)

export function build(root, ctx) {
  const cuts = COPY.hookCars.map((c) => ctx.shot(root, c.shot));
  const shade = h('div', 'abs', root);
  Object.assign(shade.style, { width: '1080px', height: '1920px', background: 'linear-gradient(180deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.25) 34%, rgba(0,0,0,0) 55%, rgba(0,0,0,.35) 100%)' });
  const black = h('div', 'abs', root);
  Object.assign(black.style, { width: '1080px', height: '1920px', background: '#050506' });

  const lead = h('div', 'kinetic abs', root, COPY.hookLead);
  lead.style.fontSize = '120px';
  const leadW = lead.scrollWidth;
  const names = COPY.hookCars.map((c) => chrome(root, c.name, 190, 940));

  // LOUE LA VOITURE / DE TES RÊVES.
  const l1 = h('div', 'kinetic abs', root, COPY.hookEnd[0]);
  const s1 = fit(l1, 900, 124);
  const l2 = h('div', 'kinetic abs goldtext', root, COPY.hookEnd[1]);
  const s2 = fit(l2, 940, 168);
  const w1 = l1.scrollWidth, w2 = l2.scrollWidth;

  // rev counter
  const ticks = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((A0 - (SWEEP * i) / 8) * Math.PI) / 180;
    const x1 = GC.x + Math.cos(a) * (GC.r - 10), y1 = GC.y - Math.sin(a) * (GC.r - 10);
    const x2 = GC.x + Math.cos(a) * (GC.r - 46), y2 = GC.y - Math.sin(a) * (GC.r - 46);
    const xt = GC.x + Math.cos(a) * (GC.r - 92), yt = GC.y - Math.sin(a) * (GC.r - 92);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i >= 7 ? '#ff3b30' : '#e9ecf0'}" stroke-width="7" stroke-linecap="round"/>
      <text x="${xt}" y="${yt + 16}" text-anchor="middle" font-family="Michroma" font-size="40" fill="${i >= 7 ? '#ff3b30' : '#e9ecf0'}">${i}</text>`);
  }
  const arc = (from, to, r) => {
    const p = (deg) => { const a = (deg * Math.PI) / 180; return [GC.x + Math.cos(a) * r, GC.y - Math.sin(a) * r]; };
    const [x1, y1] = p(from), [x2, y2] = p(to);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${from - to > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const gauge = h('div', 'abs', root, `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="overflow:visible">
    <defs><filter id="ng" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx="${GC.x}" cy="${GC.y}" r="${GC.r + 18}" fill="rgba(10,10,12,.85)" stroke="#2a2a30" stroke-width="3"/>
    <path d="${arc(A0, A0 - SWEEP, GC.r)}" fill="none" stroke="#3a3a42" stroke-width="5"/>
    <path d="${arc(A0 - (SWEEP * 7) / 8, A0 - SWEEP, GC.r - 4)}" fill="none" stroke="#ff3b30" stroke-width="12"/>
    <path class="fill" d="${arc(A0, A0 - SWEEP, GC.r - 4)}" fill="none" stroke="#d9b25f" stroke-width="12" stroke-linecap="round" filter="url(#ng)"/>
    ${ticks.join('')}
    <text x="${GC.x}" y="${GC.y + 92}" text-anchor="middle" font-family="Michroma" font-size="26" fill="#8d939c" letter-spacing="5">x1000 RPM</text>
    <g class="needle"><line x1="${GC.x}" y1="${GC.y}" x2="${GC.x + GC.r - 40}" y2="${GC.y}" stroke="#ff3b30" stroke-width="9" stroke-linecap="round" filter="url(#ng)"/>
    <circle cx="${GC.x}" cy="${GC.y}" r="30" fill="#111" stroke="#d9b25f" stroke-width="5"/></g>
  </svg>`);
  const needle = gauge.querySelector('.needle');
  const fill = gauge.querySelector('.fill');
  const arcLen = (2 * Math.PI * (GC.r - 4) * SWEEP) / 360;
  fill.style.strokeDasharray = `${arcLen}`;

  return (t) => {
    // which cut is up
    const flips = CUE.flips;
    let cur = -1;
    for (let i = 0; i < flips.length; i++) if (t >= flips[i] - 0.03) cur = i;
    const end = t >= CUE.dream;
    cuts.forEach((c, i) => {
      const on = i === cur && !end;
      if (!on) { set(c.box, { o: 0 }); return; }
      const k = t - flips[i];
      const punch = 1.04 + 0.1 * Math.exp(-6 * Math.max(0, k));
      set(c.box, { s: punch, r: (i % 2 ? 1 : -1) * 1.2 * Math.exp(-6 * Math.max(0, k)), o: 1 });
      c.box.style.transformOrigin = '540px 1100px';
    });
    set(shade, { o: end || cur < 0 ? 0 : 1 });
    set(black, { o: end ? 1 : 0 });

    // ROULE EN + the model of the beat
    const kl = t + 0.06;
    set(lead, { x: 540 - leadW / 2, y: 230, o: !end && kl > 0 ? 1 : 0, s: 1.25 - 0.25 * spring(kl, 3, 0.5) });
    names.forEach((n, i) => {
      if (i !== cur || end) { set(n.el, { o: 0 }); return; }
      const k = t - flips[i] + (i === 0 ? 0.09 : 0.03);   // the first name is already landing on frame one
      const sp = spring(k, 3.6, 0.55);
      set(n.el, { x: 540 - n.w / 2, y: 370 + 40 * (1 - sp), s: 1.3 - 0.3 * sp, o: clamp(k / 0.04), blur: 10 * (1 - clamp(k / 0.1)) });
      n.shine(clamp(k / BEAT));
    });

    // LOUE LA VOITURE / DE TES RÊVES.
    const kd = t - CUE.dream;
    const sp1 = spring(kd, 3, 0.55), sp2 = spring(kd - 0.12, 3, 0.55);
    set(l1, { x: 540 - w1 / 2, y: 480 + 30 * (1 - sp1), s: 1.3 - 0.3 * sp1, o: kd > 0 ? clamp(kd / 0.05) : 0 });
    set(l2, { x: 540 - w2 / 2, y: 480 + s1 + 10 + 30 * (1 - sp2), s: 1.3 - 0.3 * sp2, o: kd > 0.12 ? clamp((kd - 0.12) / 0.05) : 0 });

    // rev counter: idles in, the needle climbs to the red line, the limiter stutters it
    const kg = t - CUE.dream;
    const gIn = ease.outCubic(clamp(kg / 0.3));
    set(gauge, { o: kg > 0 ? gIn : 0, s: 0.9 + 0.1 * gIn });
    gauge.style.transformOrigin = `${GC.x}px ${GC.y}px`;
    let rpm = 0.9;
    if (kg > 0) rpm = 0.9 + 6.9 * ease.inQuad(clamp(kg / (CUE.limiter - CUE.dream)));
    if (t > CUE.limiter) rpm = 7.55 + 0.35 * Math.abs(Math.sin((t - CUE.limiter) * 38)) + noise1(t * 30, 3) * 0.05;
    const ang = A0 - (SWEEP * Math.min(rpm, 8)) / 8;
    needle.setAttribute('transform', `rotate(${(-ang).toFixed(2)} ${GC.x} ${GC.y})`);
    fill.style.strokeDashoffset = `${(arcLen * (1 - Math.min(rpm, 8) / 8)).toFixed(1)}`;
    fill.setAttribute('stroke', rpm > 7 ? '#ff3b30' : '#d9b25f');
  };
}
