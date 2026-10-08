// node tools/render.mjs [--draft] [--jobs 4]
// full: 120 fps capture → 2-frame shutter blend → 60 fps H.264 + AAC, a light web copy and a cover.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const argv = process.argv.slice(2);
const draft = argv.includes('--draft');
const jobs = argv.includes('--jobs') ? argv[argv.indexOf('--jobs') + 1] : '4';
const slug = 'luxelocresa93-convoi';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT });

const frames = path.join(ROOT, draft ? 'out/frames_draft' : 'out/frames');
fs.rmSync(frames, { recursive: true, force: true });

run('node', ['audio/score.mjs']);
run('node', ['tools/master.mjs']);
run('node', ['tools/capture.mjs', 'frames', '--fps', draft ? '30' : '120', '--jobs', jobs, '--out', path.relative(ROOT, frames), '--quality', draft ? '80' : '94']);

const music = path.join(ROOT, 'out/music.wav');
if (draft) {
  const out = path.join(ROOT, `out/${slug}-draft.mp4`);
  run('ffmpeg', ['-v', 'error', '-y', '-framerate', '30', '-i', path.join(frames, '%05d.jpg'), '-i', music,
    '-vf', 'scale=540:960', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', out]);
  console.log(out);
} else {
  const out = path.join(ROOT, `out/${slug}.mp4`);
  run('ffmpeg', ['-v', 'error', '-y', '-framerate', '120', '-i', path.join(frames, '%05d.jpg'), '-i', music,
    '-vf', 'tmix=frames=2,framestep=2,format=yuv420p', '-r', '60',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  const web = path.join(ROOT, `out/${slug}-web.mp4`);
  run('ffmpeg', ['-v', 'error', '-y', '-i', out, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '6M', '-bufsize', '12M',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', web]);
  fs.mkdirSync(path.join(ROOT, 'out/covers'), { recursive: true });
  for (const [name, t] of [['cover-intro', 0.05], ['cover-holo', 1.5], ['cover-end', 38.5]]) {
    run('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', out, '-frames:v', '1', path.join(ROOT, `out/covers/${name}.png`)]);
  }
  console.log(out, web);
}
