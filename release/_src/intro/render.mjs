// Renders intro.html to release/video/scrolltax-intro-1080p.mp4.
//
//   node release/_src/intro/render.mjs                    full video (needs music.wav, see make_music.py)
//   node release/_src/intro/render.mjs --stills=1.5,7,12  PNG stills of those seconds into ./stills
//
// Steps headless Chrome through the timeline over the DevTools protocol (no npm packages) and
// pipes each frame into ffmpeg. Set CHROME and FFMPEG if they are not in the default places.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', '..', 'video', 'scrolltax-intro-1080p.mp4');
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FPS = 30, W = 1920, H = 1080, PORT = 9377;
const stills = process.argv.find(a => a.startsWith('--stills='))?.slice(9).split(',').map(Number);

const profile = mkdtempSync(join(tmpdir(), 'scrolltax-intro-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`,
  '--hide-scrollbars', '--force-device-scale-factor=1', '--no-first-run', '--allow-file-access-from-files', 'about:blank',
], { stdio: 'ignore' });

async function pageSocket() {
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = targets.find(t => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* Chrome is still starting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Chrome did not start');
}

const ws = new WebSocket(await pageSocket());
await once(ws, 'open');
let nextId = 0;
const pending = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (!pending.has(m.id)) return;
  const { resolve, reject } = pending.get(m.id);
  pending.delete(m.id);
  m.error ? reject(new Error(m.error.message)) : resolve(m.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++nextId, { resolve, reject });
  ws.send(JSON.stringify({ id: nextId, method, params }));
});
const evaluate = async expression => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};
/** Draws second [t] and returns the frame as a PNG buffer. */
const frame = async t => {
  await evaluate(`renderAt(${t}); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  const shot = await send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(shot.data, 'base64');
};

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(join(HERE, 'intro.html')).href + '?capture' });
  for (let i = 0; !(await evaluate('typeof renderAt === "function"').catch(() => false)); i++) {
    if (i > 100) throw new Error('intro.html did not load');
    await new Promise(r => setTimeout(r, 100));
  }
  await evaluate('window.ready');
  const duration = await evaluate('window.DURATION');

  if (stills) {
    mkdirSync(join(HERE, 'stills'), { recursive: true });
    for (const t of stills) writeFileSync(join(HERE, 'stills', `t${t.toFixed(2).padStart(5, '0')}.png`), await frame(t));
    console.log(`wrote ${stills.length} stills`);
  } else {
    const ffmpeg = spawn(FFMPEG, [
      '-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-i', join(HERE, 'music.wav'),
      '-map', '0:v', '-map', '1:a', '-t', String(duration),
      '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const total = Math.round(duration * FPS);
    for (let i = 0; i < total; i++) {
      if (!ffmpeg.stdin.write(await frame(i / FPS))) await once(ffmpeg.stdin, 'drain');
      if (i % 150 === 0) console.log(`frame ${i}/${total}`);
    }
    ffmpeg.stdin.end();
    const [code] = await once(ffmpeg, 'close');
    if (code !== 0) throw new Error(`ffmpeg exited with ${code}`);
    console.log('wrote', OUT);
  }
} finally {
  ws.close();
  chrome.kill();
  await new Promise(r => setTimeout(r, 500));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
}
