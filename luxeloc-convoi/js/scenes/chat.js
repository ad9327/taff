// The live WhatsApp chat drawn over the held WhatsApp frame of the phone, in the frame's own pixels (the screen
// faces the camera: x 168–912). The wallpaper, the date chip, the encryption notice and the input bar are pieces of
// that same frame (tools/bake-phone.py), so the hand-off from the baked frame is invisible. The customer's messages
// are typed into the field, which grows, then go out as green bubbles with ticks (blue once the other side answers);
// the replies come after "typing" dots. The list scrolls to keep the last message above the bar.
import { b, CHAT, CHAT_CPS } from '../timeline.mjs';
import { clamp, ease, h } from '../engine.js';

const X0 = 168, X1 = 912, TOP = 398, BAR = 1176;      // chat viewport (below the header, above the input bar)
const FIELD = { x: 215, w: 550, bottom: 1255, minH: 63 };
const GAP = 10;                                          // between rows (CSS margin-top of .chat-row)

const chars = (s) => Array.from(s);
const TICKS = (blue) => `<svg viewBox="0 0 18 12" width="25" height="17"><path fill="none" stroke="${blue ? '#53bdeb' : '#8696a0'}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M1 6.5 4.2 9.6 10.5 2.4M7.6 9.6 14 2.4"/></svg>`;
const STICKER = '<svg viewBox="0 0 24 24" width="40" height="40"><path fill="none" stroke="#e9edef" stroke-width="1.7" stroke-linejoin="round" d="M7.5 3.5h9a4 4 0 0 1 4 4v6.5l-6.5 6.5H7.5a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4zM14 20.5v-3a3.5 3.5 0 0 1 3.5-3.5h3"/></svg>';
const SEND = '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#0b141a" d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15.6 12 3.4 13.8z"/></svg>';

export function buildChat(host) {
  const msgs = CHAT.msgs;
  const parent = h('div', 'abs', host);     // its own layer: no rule meant for the frame's <img> reaches these
  const root = h('div', 'abs chat', parent);
  Object.assign(root.style, { left: `${X0}px`, top: `${TOP}px`, width: `${X1 - X0}px`, height: `${BAR - TOP}px` });
  h('div', 'abs chat-wall', root);
  const col = h('div', 'abs chat-col', root);
  const chip = h('img', 'chat-chip', col); chip.src = 'assets/media/wa/chip.jpg';
  const notice = h('img', 'chat-notice', col); notice.src = 'assets/media/wa/notice.jpg';

  const rows = msgs.map((m) => {
    const row = h('div', `chat-row ${m.who}`, col);
    const bub = h('div', `chat-bub ${m.who}`, row);
    h('span', 'chat-txt', bub, m.text);
    const meta = h('span', 'chat-meta', bub, `${m.time}${m.who === 'me' ? `<span class="ticks">${TICKS(false)}</span>` : ''}`);
    // ticks turn blue when the other side starts answering
    const next = m.who === 'me' ? msgs.find((n) => n.who === 'them' && n.type >= m.land) : null;
    return { m, row, bub, ticks: meta.querySelector('.ticks'), readAt: next ? next.type : Infinity };
  });
  const dotsRow = h('div', 'chat-row them', col);
  const dots = h('div', 'chat-bub them chat-dots', dotsRow, '<i></i><i></i><i></i>');
  const dotEls = [...dots.querySelectorAll('i')];

  // heights, measured once while everything is laid out
  const headH = notice.offsetTop + notice.offsetHeight;  // the chip and the notice sit where the frame had them
  rows.forEach((r) => { r.h = r.row.offsetHeight + GAP; r.row.style.display = 'none'; });
  const dotsH = dotsRow.offsetHeight + GAP;
  dotsRow.style.display = 'none';

  // input bar: the frame's own strip, a field drawn over its field, the send button while typing
  const bar = h('div', 'abs chat-bar', parent);
  Object.assign(bar.style, { left: `${X0}px`, width: `${X1 - X0}px` });
  const strip = h('img', 'abs', parent); strip.src = 'assets/media/wa/bar.jpg';
  Object.assign(strip.style, { left: `${X0}px`, top: `${BAR}px` });
  const field = h('div', 'abs chat-field', parent);
  Object.assign(field.style, { left: `${FIELD.x}px`, width: `${FIELD.w}px` });
  const ftxt = h('span', 'chat-ftxt', field);
  const caret = h('span', 'chat-caret', field);
  h('span', 'chat-sticker', field, STICKER);
  const send = h('div', 'abs chat-send', parent, SEND);
  const all = [parent];

  const contentAt = (kb) => headH + rows.reduce((s, r) => s + (kb >= r.m.land ? r.h : 0), 0)
    + (msgs.some((m) => m.who === 'them' && kb >= m.type && kb < m.land) ? dotsH : 0);
  const events = [...new Set(msgs.flatMap((m) => (m.who === 'them' ? [m.type, m.land] : [m.land])))].sort((x, y) => x - y);

  return (k, on) => {
    all.forEach((e) => (e.style.display = on ? 'block' : 'none'));
    if (!on) return;
    const kb = k / b(1);

    let typing = '', dotsOn = false;
    rows.forEach((r) => {
      const { m } = r;
      const shown = kb >= m.land;
      r.row.style.display = shown ? 'flex' : 'none';
      if (shown) {
        const u = clamp((k - b(m.land)) / 0.2);
        r.bub.style.transform = `scale(${(0.82 + 0.18 * ease.outBack(u)).toFixed(4)})`;
        r.bub.style.opacity = clamp(u * 2.5).toFixed(3);
      }
      if (m.who === 'me' && kb >= m.type && kb < m.land) typing = chars(m.text).slice(0, Math.floor((k - b(m.type)) * CHAT_CPS)).join('');
      if (m.who === 'them' && kb >= m.type && kb < m.land) dotsOn = true;
      if (r.ticks) {
        const read = String(kb >= r.readAt);
        if (r.ticks.dataset.read !== read) { r.ticks.dataset.read = read; r.ticks.innerHTML = TICKS(read === 'true'); }
      }
    });
    dotsRow.style.display = dotsOn ? 'flex' : 'none';
    dotEls.forEach((d, i) => {
      const ph = (((k * 2.4 - i * 0.2) % 1) + 1) % 1;
      const up = Math.sin(Math.PI * clamp(ph / 0.45));
      d.style.transform = `translateY(${(-6 * up).toFixed(2)}px)`;
      d.style.opacity = (0.45 + 0.55 * up).toFixed(3);
    });

    // the field grows with the text; the bar grows behind it
    ftxt.textContent = typing;
    // the caret: steady while typing, blinking while the field waits (as on the frame it takes over from)
    caret.style.visibility = typing || Math.floor(k * 1.8) % 2 === 0 ? 'visible' : 'hidden';
    field.style.height = 'auto';
    const fh = Math.max(FIELD.minH, field.offsetHeight);
    const ftop = FIELD.bottom - fh;
    Object.assign(field.style, { top: `${ftop}px`, height: `${fh}px` });
    const barTop = Math.min(BAR, ftop - 12);
    Object.assign(bar.style, { top: `${barTop}px`, height: `${BAR - barTop + 2}px` });
    send.style.visibility = typing ? 'visible' : 'hidden';
    send.style.top = `${FIELD.bottom - 62}px`;
    root.style.height = `${barTop - TOP}px`;

    // scroll: glide from the list's height before the last event to its height now
    const viewH = barTop - TOP - 16;
    const target = Math.max(0, contentAt(kb) - viewH);
    const last = events.filter((e) => e <= kb).pop();
    let scroll = target;
    if (last != null && k - b(last) < 0.3) {
      const before = Math.max(0, contentAt(last - 1e-6) - viewH);
      scroll = before + (target - before) * ease.outCubic(clamp((k - b(last)) / 0.3));
    }
    col.style.transform = `translateY(${(-scroll).toFixed(2)}px)`;
  };
}
