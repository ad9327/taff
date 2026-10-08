// node tools/capture.mjs still <t> [t…] [--only scene]
// node tools/capture.mjs sheet <t0> <t1> <n> [--only scene] [--cols 6] [--out out/sheet.png]
// node tools/capture.mjs frames [--fps 120] [--from a] [--to b] [--jobs 4] [--out out/frames] [--scale 1]
// node tools/capture.mjs verify     (same frames forward / backward / shuffled must match)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, serve, launch, openPage, renderAt } from './lib.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const pos = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(i > 0 && arr[i - 1].startsWith('--')));
const only = opt('only', '');
const query = only ? `only=${only}` : '';
const out = (p) => { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };

const { srv, url } = await serve();
const browser = await launch();

try {
  if (cmd === 'still') {
    const page = await openPage(browser, url, query);
    for (const s of pos) {
      const t = parseFloat(s);
      await renderAt(page, t);
      const f = out(`out/stills/${only ? only + '_' : ''}${t.toFixed(3)}.png`);
      await page.screenshot({ path: f, type: 'png' });
      console.log(f);
    }
    const errs = page.__logs.filter((l) => /error|warn/i.test(l));
    if (errs.length) console.log(errs.join('\n'));
  } else if (cmd === 'sheet') {
    const [t0, t1, n] = [parseFloat(pos[0]), parseFloat(pos[1]), parseInt(pos[2] || '24', 10)];
    const cols = parseInt(opt('cols', '6'), 10);
    const page = await openPage(browser, url, query);
    const dir = out('out/sheet_tmp/x');
    fs.rmSync(path.dirname(dir), { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? t0 : t0 + ((t1 - t0) * i) / (n - 1);
      await renderAt(page, t);
      await page.screenshot({ path: path.join(path.dirname(dir), `${String(i).padStart(3, '0')}.jpg`), type: 'jpeg', quality: 85 });
    }
    const rows = Math.ceil(n / cols);
    const sheet = out(opt('out', 'out/sheet.png'));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(path.dirname(dir), '%03d.jpg'),
      '-vf', `scale=270:480,drawtext=fontfile=${path.join(ROOT, 'assets/fonts/Montserrat.ttf')}:text='%{n}':x=6:y=6:fontsize=18:fontcolor=red,tile=${cols}x${rows}:padding=4:color=0x222222`,
      '-frames:v', '1', sheet]);
    console.log(sheet, `(${n} frames ${t0}–${t1}s)`);
    const errs = page.__logs.filter((l) => /error|warn/i.test(l));
    if (errs.length) console.log(errs.join('\n'));
  } else if (cmd === 'frames') {
    const fps = parseFloat(opt('fps', '120'));
    const dur = await (async () => { const p = await openPage(browser, url); const d = await p.evaluate(() => window.__duration); await p.close(); return d; })();
    const from = parseFloat(opt('from', '0'));
    const to = parseFloat(opt('to', String(dur)));
    const jobs = parseInt(opt('jobs', '4'), 10);
    const dir = out(`${opt('out', 'out/frames')}/x`);
    const first = Math.round(from * fps);
    const last = Math.ceil(to * fps) - 1;
    const total = last - first + 1;
    const quality = parseInt(opt('quality', '92'), 10);
    let done = 0;
    const t0 = Date.now();
    const pages = await Promise.all(Array.from({ length: jobs }, () => openPage(browser, url, query)));
    // contiguous chunks per worker keep image sequences cached
    const per = Math.ceil(total / jobs);
    await Promise.all(pages.map(async (page, w) => {
      const a = first + w * per;
      const z = Math.min(last, a + per - 1);
      for (let f = a; f <= z; f++) {
        await renderAt(page, f / fps);
        await page.screenshot({ path: path.join(path.dirname(dir), `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality });
        done++;
        if (done % 100 === 0) {
          const el = (Date.now() - t0) / 1000;
          process.stdout.write(`  ${done}/${total} frames  ${(el / done * 1000).toFixed(0)} ms/frame  eta ${((total - done) * el / done).toFixed(0)} s\n`);
        }
      }
    }));
    console.log(`frames ${first}–${last} at ${fps} fps in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } else if (cmd === 'verify') {
    const ts = [0.3, 0.8, 1.2, 2.8, 3.9, 8.4, 9.2, 13.5, 14.8, 31.2, 36.6, 41.0];
    const shots = async (order) => {
      const page = await openPage(browser, url);
      const res = {};
      for (const t of order) { await renderAt(page, t); res[t] = await page.screenshot({ type: 'png' }); }
      await page.close();
      return res;
    };
    const a = await shots(ts);
    const bwd = await shots([...ts].reverse());
    const shuf = await shots([...ts].sort((x, y) => Math.sin(x * 99) - Math.sin(y * 99)));
    let bad = 0;
    for (const t of ts) {
      if (!a[t].equals(bwd[t]) || !a[t].equals(shuf[t])) { bad++; console.log(`DIFF at ${t}s`); }
    }
    console.log(bad ? `verify FAIL (${bad} frames differ)` : 'verify OK — every frame is a function of t');
    if (bad) process.exitCode = 1;
  } else {
    console.log('usage: still | sheet | frames | verify');
  }
} finally {
  await browser.close();
  srv.close();
}
