// node tools/add-media.mjs <name> <file>
// Registers an image or a clip under <name> in assets/media.json (names the scenes look for:
// logo, mic, singer, console, monitors, pads). A clip is interpolated to 60 fps and split into frames.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const [name, file] = process.argv.slice(2);
if (!name || !file) { console.log('usage: node tools/add-media.mjs <name> <image|video>'); process.exit(1); }
const manifestPath = path.join(ROOT, 'assets/media.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(file);

if (isVideo) {
  const dir = path.join(ROOT, 'assets/clips', name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', 'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1,scale=1080:-2:flags=lanczos', '-q:v', '3', path.join(dir, '%04d.jpg')], { stdio: 'inherit' });
  const frames = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length;
  manifest[name] = { type: 'clip', dir: `assets/clips/${name}`, fps: 60, frames };
} else {
  const keepAlpha = name === 'logo' || /\.png$/i.test(file) && name === 'logo';
  const ext = keepAlpha ? 'png' : 'jpg';
  const out = path.join(ROOT, `assets/img/${name}.${ext}`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, ...(keepAlpha ? [] : ['-q:v', '2']), out], { stdio: 'inherit' });
  manifest[name] = { type: 'img', src: `assets/img/${name}.${ext}` };
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`${name} →`, manifest[name]);
