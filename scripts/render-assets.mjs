// Renders the README visuals from assets/src/*.html (and the raw app screenshots) into assets/.
//   node scripts/capture-app-assets.mjs ...   # once, needs a running instance
//   node scripts/render-assets.mjs [name ...] # banner, social, diagrams, screenshots
// Fonts come from the @fontsource devDependencies; nothing is fetched from the network.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const SRC = path.resolve('assets/src');
const RAW = path.join(SRC, 'raw');
const only = process.argv.slice(2);

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return path.join(base, dir, 'chrome-linux', 'chrome');
  }
  return undefined;
}

// html -> png jobs: size is the CSS pixel viewport, scale the device pixel ratio.
const pages = [
  { name: 'banner', html: 'banner.html', out: 'assets/banner.png', width: 1600, height: 480, scale: 1.5, flat: true },
  { name: 'social', html: 'social.html', out: 'assets/social-preview.png', width: 1280, height: 640, scale: 1, flat: true },
  { name: 'pipeline', html: 'diagram-pipeline.html', out: 'assets/diagrams/pipeline.png', width: 1200, scale: 2, fit: true, flat: true },
  { name: 'baseline', html: 'diagram-baseline.html', out: 'assets/diagrams/baseline.png', width: 1200, scale: 2, fit: true, flat: true },
  { name: 'architecture', html: 'diagram-architecture.html', out: 'assets/diagrams/architecture.png', width: 1200, scale: 2, fit: true, flat: true },
];

// App screenshots wrapped in a quiet window frame (transparent outside, so it sits well on light and dark pages).
const frames = [
  { name: 'platforms', out: 'assets/screenshots/platforms.png', files: ['platforms.png'], chrome: 'localhost:3000 · Platforms' },
  { name: 'evidence', out: 'assets/screenshots/evidence.png', files: ['evidence.png'], chrome: 'localhost:3000 · Evidence' },
  { name: 'graph', out: 'assets/screenshots/graph.png', files: ['graph.png'] },
  { name: 'report', out: 'assets/screenshots/report.png', files: ['report-assessment.png', 'report-judgments.png'] },
  { name: 'matrix', out: 'assets/screenshots/evidence-matrix.png', files: ['report-evidence.png'] },
];

const frameHtml = (f) => {
  const imgs = f.files
    .map((file, i) => `<img src="${pathToFileURL(path.join(RAW, file))}" style="display:block;width:100%;${f.crop && i === 0 ? `height:${f.crop * 100}%;object-fit:cover;object-position:top;` : ''}">`)
    .join(f.files.length > 1 ? '<div style="height:1px;background:#1a1a1a"></div>' : '');
  const bar = f.chrome
    ? `<div style="display:flex;align-items:center;gap:8px;height:38px;padding:0 16px;background:#0a0a0a;border-bottom:1px solid #2a2a2a">
         <i style="width:11px;height:11px;border-radius:50%;background:#2a2a2a"></i><i style="width:11px;height:11px;border-radius:50%;background:#2a2a2a"></i><i style="width:11px;height:11px;border-radius:50%;background:#2a2a2a"></i>
         <span style="margin-left:14px;font:400 12px 'JetBrains Mono',monospace;color:#737373">${f.chrome}</span></div>`
    : '';
  const cropWrap = f.crop ? 'overflow:hidden;' : '';
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${pathToFileURL(path.join(SRC, 'common.css'))}">
    <style>body{padding:28px;width:1336px;background:transparent}
    .card{border:1px solid #2a2a2a;border-radius:14px;overflow:hidden;background:#000;box-shadow:0 18px 50px rgba(0,0,0,.45),0 2px 6px rgba(0,0,0,.4)}</style></head>
    <body><div class="card" style="${cropWrap}">${bar}${imgs}</div></body></html>`;
};

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
const want = (name) => !only.length || only.includes(name);
const quantize = (file) => {
  try { execFileSync('convert', [file, '-colors', '192', '-dither', 'None', '-define', 'png:compression-level=9', `PNG8:${file}`]); } catch { /* ImageMagick optional */ }
};

for (const job of pages.filter((j) => want(j.name))) {
  const ctx = await browser.newContext({ viewport: { width: job.width, height: job.height || 800 }, deviceScaleFactor: job.scale });
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(path.join(SRC, job.html)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  if (job.fit) await page.locator('.board').screenshot({ path: job.out, omitBackground: true });
  else await page.screenshot({ path: job.out });
  await ctx.close();
  if (!job.flat) quantize(job.out);
  console.log('rendered', job.out, (fs.statSync(job.out).size / 1024).toFixed(0) + ' KB');
}

for (const f of frames.filter((j) => want(j.name))) {
  if (!f.files.every((file) => fs.existsSync(path.join(RAW, file)))) { console.warn('skip', f.name, '(missing raw capture)'); continue; }
  const ctx = await browser.newContext({ viewport: { width: 1336, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  const tmp = path.join(SRC, `.frame-${f.name}.html`);
  fs.writeFileSync(tmp, frameHtml(f));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  fs.mkdirSync(path.dirname(f.out), { recursive: true });
  await page.locator('body').screenshot({ path: f.out, omitBackground: true });
  fs.rmSync(tmp);
  await ctx.close();
  quantize(f.out);
  console.log('rendered', f.out, (fs.statSync(f.out).size / 1024).toFixed(0) + ' KB');
}

await browser.close();
