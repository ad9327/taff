// The picture under everything: the convoy playing (60 fps frames), a car's freeze frame (2160×3840, plate covered)
// while its hologram is up, or an arrival photo — with the camera's punch-in transform.
import { CARS } from '../copy.mjs';
import { view } from '../rig.js';
import { clamp, set, h } from '../engine.js';

const NFRAMES = 453;
const pad = (n) => String(n).padStart(4, '0');

export function build(root, ctx) {
  const box = h('div', 'pic', root);
  box.style.transformOrigin = '0 0';
  const cv = h('img', '', box);
  const fz = h('img', '', box);
  cv.decoding = fz.decoding = 'sync';
  let lastCv = '', lastFz = '';
  const load = (img, src, last) => {
    if (src === last) return last;
    img.src = src;
    ctx.wait(img.decode().catch(() => {}));
    return src;
  };

  return (t) => {
    const v = view(t);
    if (v.src === 'none') { root.style.display = 'none'; return; }
    root.style.display = 'block';
    set(box, { x: v.xf.tx, y: v.xf.ty, s: v.xf.s });
    if (v.src === 'convoy') {
      const n = clamp(Math.round(v.ct * 60), 0, NFRAMES - 1);
      lastCv = load(cv, `assets/media/convoy/${pad(n + 1)}.jpg`, lastCv);
      cv.style.visibility = 'visible';
      fz.style.visibility = 'hidden';
    } else {
      const src = v.src === 'freeze' ? `assets/media/freeze/${CARS[v.car].id}.jpg` : `assets/media/cars/${v.photo}.jpg`;
      lastFz = load(fz, src, lastFz);
      fz.style.visibility = 'visible';
      cv.style.visibility = 'hidden';
    }
  };
}
