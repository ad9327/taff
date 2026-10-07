// NOS PACKS: 10h / 20h / 30h, then how to book.
import { CUE } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { clamp, spring, set, h } from '../engine.js';
import { icon } from '../icons.js';
import { priceBoard } from './rows.js';

export function build(root) {
  const board = priceBoard(root, {
    title: COPY.packsTitle, rows: COPY.packs,
    ats: [CUE.pack1, CUE.pack2, CUE.pack3], titleAt: CUE.packsIn,
  });
  const cta = h('div', 'pill', root, `<span class="dot">${icon('chat', { sw: 2.4 })}</span><span>${COPY.packCta}</span>`);
  Object.assign(cta.style, { fontSize: '34px', background: 'linear-gradient(180deg,#2f72ff,#1a4fe0)', borderColor: 'rgba(170,210,255,.7)', boxShadow: '0 0 40px rgba(40,110,255,.6)' });
  const cw = cta.offsetWidth;
  return (t) => {
    board(t);
    const k = t - CUE.packCta;
    const sp = spring(k, 3, 0.55);
    set(cta, { x: 540 - cw / 2, y: 1400 + 50 * (1 - sp), s: 0.8 + 0.2 * sp, o: clamp(k / 0.08) });
  };
}
