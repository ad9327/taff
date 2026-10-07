// NOS TARIFS: 1h / 2h / 3h, one row per beat pair.
import { CUE } from '../timeline.mjs';
import { COPY } from '../copy.mjs';
import { priceBoard } from './rows.js';

export function build(root) {
  return priceBoard(root, {
    title: COPY.tarifsTitle, rows: COPY.tarifs,
    ats: [CUE.price1, CUE.price2, CUE.price3], titleAt: CUE.tarifsIn,
  });
}
