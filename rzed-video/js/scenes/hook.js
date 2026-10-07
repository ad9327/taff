// Hook: "TON SON / MÉRITE UN / VRAI STUDIO." slams on the first three downbeats over the mic shot,
// a ring closes around the words, the tape stops, and the ring becomes the iris into the drop.
import { CUE, b, BEAT } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, ease, spring, set, h, fit, tw, noise1 } from '../engine.js';
import { icon } from '../icons.js';

const CX = 540, CY = 720, R = 460;

export function build(root, ctx) {
  // full-bleed shot
  const media = ctx.media(root, 'mic', 'full');
  Object.assign(media.box.style, { left: '0px', top: '0px', width: '1080px', height: '1920px' });
  media.fallback.innerHTML = `<div style="position:absolute;left:290px;top:420px;width:500px;height:900px;opacity:.22;filter:drop-shadow(0 0 30px #2f7bff)">${icon('mic', { stroke: '#8cc4ff', sw: 0.6 })}</div>`;
  media.fallback.style.background = 'radial-gradient(ellipse 70% 50% at 50% 42%, rgba(30,90,255,.35), rgba(2,6,26,0) 70%)';
  const grade = h('div', 'abs', root);
  Object.assign(grade.style, { width: '1080px', height: '1920px',
    background: 'linear-gradient(180deg, rgba(2,6,26,.88) 0%, rgba(2,6,26,.25) 28%, rgba(2,6,26,.35) 55%, rgba(2,6,26,.92) 100%)' });
  const tint = h('div', 'abs', root);
  Object.assign(tint.style, { width: '1080px', height: '1920px', background: 'rgba(20,70,255,.28)', mixBlendMode: 'color' });

  // the ring that closes around the words (becomes the iris)
  const ringSvg = h('div', 'abs', root, `<svg width="1080" height="1920" viewBox="0 0 1080 1920" style="overflow:visible">
    <defs><filter id="rglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#9fd2ff" stroke-width="7" filter="url(#rglow)" transform="rotate(-90 ${CX} ${CY})" />
  </svg>`);
  const circle = ringSvg.querySelector('circle');
  const C = 2 * Math.PI * R;
  circle.style.strokeDasharray = `${C}`;

  // the three lines
  const block = h('div', 'abs', root);
  const lines = COPY.hook.map((txt, i) => {
    const el = h('div', 'title abs', block);
    if (Array.isArray(txt)) el.innerHTML = `${txt[0]}<span class="accent">${txt[1]}</span>`;
    else el.textContent = txt;
    el.style.textShadow = '0 6px 40px rgba(0,8,40,.85)';
    const size = fit(el, 900, [230, 205, 200][i]);
    return { el, size, w: el.scrollWidth, at: [CUE.hook1 - 0.07, CUE.hook2, CUE.hook3][i] };
  });
  const gap = 6;
  const total = lines.reduce((s, l) => s + l.size * 0.98 + gap, -gap);
  let y = CY - total / 2;
  for (const l of lines) { l.y = y; l.h = l.size * 0.98; y += l.h + gap; }
  // block offset that keeps the lines shown so far centred on the ring
  const centreOf = (n) => (lines[0].y + lines[n - 1].y + lines[n - 1].h) / 2;
  const offsets = [1, 2, 3].map((n) => CY - centreOf(n));

  return (t) => {
    // media: play from the start, slow push in
    ctx.wait(media.frame(t));
    const push = 1.08 + 0.1 * ease.inOutCubic(clamp(t / b(8)));
    set(media.box, { s: push, o: 1 });
    media.box.style.transformOrigin = '540px 760px';

    // tape stop: everything sags and slows between tapeStop and the iris
    const tape = ease.inQuad(clamp((t - CUE.tapeStop) / b(0.75)));
    const sag = 28 * tape;

    // stack push: each new line nudges the block so the visible lines stay centred
    let off = offsets[0];
    for (let n = 1; n < 3; n++) {
      const k = t - lines[n].at;
      if (k > 0) off += (offsets[n] - offsets[n - 1]) * spring(k, 2.6, 0.62);
    }
    for (const [i, l] of lines.entries()) {
      const k = t - l.at;
      if (k < 0) { set(l.el, { o: 0 }); continue; }
      const sp = spring(k, 3.4, 0.5);
      const s = 1.55 - 0.55 * sp - 0.05 * tape;
      const o = clamp(k / 0.05);
      const blur = 18 * (1 - clamp(k / 0.11));
      const rise = -10 * k;
      const jitter = noise1(t * 3 + i * 10, 4) * 2;
      set(l.el, { x: CX - l.w / 2 + jitter, y: l.y + off + 50 * (1 - ease.outCubic(clamp(k / 0.25))) + rise + sag, s, o, blur });
      l.el.style.transformOrigin = '50% 50%';
    }

    // ring draws closed, pulses on the beat, hands over to the iris
    const draw = ease.outCubic(clamp((t - CUE.ringForm) / b(1)));
    circle.style.strokeDashoffset = `${C * (1 - draw)}`;
    const pulse = t > CUE.ringForm + b(1) ? Math.exp(-8 * ((t - CUE.ringForm - b(1)) % BEAT)) : 0;
    circle.setAttribute('stroke-width', (7 + 5 * pulse).toFixed(2));
    ringSvg.style.opacity = t >= b(7.25) ? 0 : clamp(draw * 3).toFixed(3);
    ringSvg.style.visibility = draw > 0 && t < b(7.25) ? 'visible' : 'hidden';
  };
}
