import { FPS, DURATION } from './timeline.mjs';
import { FLASHES, HITS_T } from './rig.js';
import { hash, shake, h } from './engine.js';
import * as pic from './scenes/pic.js';
import * as holo from './scenes/holo.js';
import * as run from './scenes/run.js';
import * as intro from './scenes/intro.js';
import * as end from './scenes/end.js';
import * as phone from './scenes/phone.js';

// bottom to top
const LAYERS = [['pic', pic], ['holo', holo], ['run', run], ['intro', intro], ['phone', phone], ['end', end]];

function grainTile() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  const im = x.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(hash(i, 77) * 255);
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  return c.toDataURL('image/png');
}

const host = document.getElementById('scenes');
const cam = document.getElementById('cam');
const flash = document.getElementById('flash');
const grain = document.getElementById('grain');
let SC = [];
let pending = [];

async function init() {
  grain.style.backgroundImage = `url(${grainTile()})`;
  await Promise.all(['100px Anton', '100px Michroma', '400 40px Mont', '600 40px Mont', '700 40px Mont', '800 40px Mont', '400 33px Inter', '600 33px Inter'].map((f) => document.fonts.load(f, 'AÉÊ€0')));
  const ctx = { wait: (p) => { if (p) pending.push(p); } };
  SC = LAYERS.map(([name, mod]) => {
    const root = h('div', 'layer', host);
    root.style.display = 'block';
    const update = mod.build(root, ctx);
    return { name, root, update };
  });
  await document.fonts.ready;
  await Promise.all([...document.images].filter((i) => i.src).map((i) => i.decode().catch(() => {})));
  window.__ready = true;
}

window.__render = async (t) => {
  pending = [];
  const sh = shake(t, HITS_T, 16, 9);
  cam.style.transform = `translate(${sh.x.toFixed(2)}px, ${sh.y.toFixed(2)}px) rotate(${sh.r.toFixed(3)}deg)`;
  for (const sc of SC) sc.update(t);

  let fl = 0;
  for (const [at, amt, dec] of FLASHES) if (t >= at && t < at + 0.6) fl = Math.max(fl, amt * Math.exp(-dec * (t - at)));
  flash.style.opacity = fl.toFixed(3);

  const fr = Math.round(t * FPS * 2);
  grain.style.transform = `translate(${Math.floor(hash(fr, 3) * 64) - 32}px, ${Math.floor(hash(fr, 4) * 64) - 32}px)`;

  if (pending.length) await Promise.all(pending);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};

window.__duration = DURATION;
init();
