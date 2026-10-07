// Price board shared by NOS TARIFS and NOS PACKS: a two-tone title, glass rows whose prices roll up and slam on the beat.
import { clamp, ease, spring, set, h, snap, euro, fit } from '../engine.js';

export function priceBoard(root, { title, rows, ats, titleAt, y0 = 590, step = 262 }) {
  const head = h('div', 'title abs', root, `${title[0]}<span class="accent">${title[1]}</span>`);
  fit(head, 900, 168);
  const hw = head.scrollWidth;

  const R = rows.map((r, i) => {
    const card = h('div', 'glass abs', root);
    Object.assign(card.style, { width: '860px', height: '220px' });
    const lab = h('div', 'abs', card, r.label);
    Object.assign(lab.style, { left: '48px', top: '82px', fontWeight: '800', fontSize: '44px', letterSpacing: '2px', color: '#e8f2ff' });
    const price = h('div', 'title abs', card, euro(r.price));
    Object.assign(price.style, { fontSize: '156px', top: '20px', color: '#fff', textShadow: '0 0 30px rgba(76,184,255,.75), 0 0 2px #fff', transformOrigin: '100% 50%' });
    const pw = price.scrollWidth;
    price.style.left = `${860 - 48 - pw}px`;
    const ring = h('div', 'ring', card);
    return { card, lab, price, ring, pw, at: ats[i], value: r.price, y: y0 + i * step, dir: i % 2 ? 1 : -1 };
  });

  return (t) => {
    const kt = t - titleAt;
    const sp = spring(kt + 0.04, 3, 0.5);
    set(head, { x: 540 - hw / 2, y: 280 + 30 * (1 - sp), s: 1.35 - 0.35 * sp, o: clamp((kt + 0.04) / 0.05) });
    head.style.letterSpacing = `${(12 * (1 - ease.outCubic(clamp(kt / 0.5)))).toFixed(2)}px`;

    for (const r of R) {
      const k = t - r.at;
      const s2 = spring(k, 2.8, 0.58);
      set(r.card, { x: 110 + r.dir * 700 * (1 - s2), y: r.y, r: r.dir * 4 * (1 - s2), o: clamp(k / 0.06), blur: 12 * (1 - clamp(k / 0.15)) });
      // the price rolls up on frame time, then slams
      const kq = snap(t) - r.at - 0.06;
      const roll = ease.outCubic(clamp(kq / 0.42));
      r.price.textContent = euro(r.value * roll);
      r.price.style.left = `${860 - 48 - r.price.scrollWidth}px`;
      const land = kq - 0.42;
      const slam = land > 0 ? 1 + 0.22 * Math.exp(-9 * land) * Math.cos(land * 26) : 0.9 + 0.1 * roll;
      set(r.price, { s: slam, o: clamp(kq / 0.05) });
      // ripple ring on the landing
      const rr = clamp(land / 0.55);
      const rad = 90 + 120 * ease.outCubic(rr);
      const cx = 860 - 48 - r.pw / 2, cy = 110;
      Object.assign(r.ring.style, { left: `${cx - rad}px`, top: `${cy - rad}px`, width: `${2 * rad}px`, height: `${2 * rad}px`, borderWidth: `${(8 * (1 - rr) + 1).toFixed(1)}px` });
      r.ring.style.opacity = land > 0 ? (1 - rr).toFixed(3) : '0';
      r.ring.style.visibility = land > 0 && rr < 1 ? 'visible' : 'hidden';
      set(r.lab, { x: 30 * (1 - ease.outCubic(clamp((k - 0.05) / 0.3))), o: clamp((k - 0.05) / 0.12) });
    }
  };
}
