// Two-pass loudness normalisation: out/music_raw.wav → out/music.wav at -14 LUFS, true peak ≤ -1 dBTP.
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const inp = path.join(ROOT, 'out/music_raw.wav');
const out = path.join(ROOT, 'out/music.wav');
const target = 'I=-14:TP=-2.5:LRA=11';
const p1 = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', inp, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const js = JSON.parse(p1.stderr.slice(p1.stderr.lastIndexOf('{')));
const af = `loudnorm=${target}:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true,aresample=48000`;
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-af', af, '-ar', '48000', '-c:a', 'pcm_s24le', out]);
const chk = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const I = chk.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
const TP = chk.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
console.log(`master → ${out}  ${I}  true ${TP}`);
