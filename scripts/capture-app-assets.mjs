// Captures real screenshots (and optionally the demo GIF) from a running Mineiro instance.
//   npm run build && NODE_ENV=production PORT=3400 node dist/server.cjs &
//   node scripts/capture-app-assets.mjs --url http://localhost:3400 [--gif]
// Needs ffmpeg for --gif and a Chromium (CHROME_PATH or Playwright's own).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true;
};
const URL_ = arg('url', 'http://localhost:3400');
const HANDLE = arg('handle', 'forgejo'); // a public open-source organisation handle: never use a private person
const WANT_GIF = process.argv.includes('--gif');
const RAW = path.resolve('assets/src/raw');
fs.mkdirSync(RAW, { recursive: true });

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return path.join(base, dir, 'chrome-linux', 'chrome');
  }
  return undefined; // Playwright default
}

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });

async function runScan(page, homeShot) {
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.locator('#lang-btn-en').click();
  await page.waitForTimeout(500);
  if (homeShot) await page.screenshot({ path: homeShot }); // clean start screen, before any input
  await page.locator('input[type=text]').first().fill(HANDLE);
  await page.locator('button', { hasText: /^Standard/ }).first().click();
}

async function waitDone(page, maxMs = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    await page.waitForTimeout(500);
    if (/100%/.test(await page.evaluate(() => document.body.innerText))) break;
  }
  await page.waitForTimeout(900);
}

const tab = async (page, name) => {
  await page.locator('button', { hasText: new RegExp(`^${name}`, 'i') }).first().click();
  await page.waitForTimeout(1000);
};

// ---- 1. still screenshots at 2x ----
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await runScan(page, `${RAW}/home.png`);
  await page.locator('button[type=submit]').first().click();
  await waitDone(page);

  await tab(page, 'Platforms');
  await page.screenshot({ path: `${RAW}/platforms.png` });

  await tab(page, 'Evidence');
  await page.screenshot({ path: `${RAW}/evidence.png` });

  await tab(page, 'Correlation');
  await page.waitForTimeout(1500); // let the force layout settle
  {
    const top = await page.getByText(/ACCOUNT RELATIONSHIP GRAPH/i).first().boundingBox();
    const bottom = await page.getByText('Click a node to inspect').first().boundingBox();
    if (top && bottom) {
      const y = top.y - 34;
      await page.screenshot({
        path: `${RAW}/graph.png`, fullPage: true,
        clip: { x: 100, y, width: 1240, height: bottom.y + bottom.height + 60 - y },
      });
    }
  }

  await tab(page, 'Intelligence');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${RAW}/report-top.png` });
  // Sections are captured as page clips (not element screenshots) so sticky headers never leak into tall sections.
  const maxHeight = { evidence: 1180 }; // the evidence matrix has 49 rows: show the first ones
  for (const id of ['requirement', 'assessment', 'judgments', 'coverage', 'high', 'evidence', 'hypotheses', 'gaps']) {
    const el = page.locator(`#intel-${id}`);
    if (!(await el.count())) continue;
    const box = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
    });
    await page.screenshot({
      path: `${RAW}/report-${id}.png`, fullPage: true,
      clip: { x: Math.max(0, box.x - 32), y: box.y - 28, width: Math.min(1440 - Math.max(0, box.x - 32), box.w + 64), height: Math.min(box.h, maxHeight[id] ?? box.h) + 56 },
    });
  }
  await ctx.close();
}

// ---- 2. demo GIF (1280x720 frames, ~3 fps) ----
if (WANT_GIF) {
  const frames = path.resolve('assets/src/gif-frames');
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  let n = 0;
  const snap = async (times = 1) => {
    for (let i = 0; i < times; i++) await page.screenshot({ path: `${frames}/f${String(n++).padStart(4, '0')}.png` });
  };
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.locator('#lang-btn-en').click();
  await page.waitForTimeout(400);
  await snap(4);
  const input = page.locator('input[type=text]').first();
  await input.click();
  for (const [i, ch] of [...HANDLE].entries()) { await input.type(ch, { delay: 60 }); if (i % 2) await snap(1); }
  await page.locator('button', { hasText: /^Standard/ }).first().click();
  await page.waitForTimeout(300);
  await snap(2);
  await page.locator('button[type=submit]').first().click();
  await tab(page, 'Platforms');
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    await snap(1);
    await page.waitForTimeout(450);
    if (/100%/.test(await page.evaluate(() => document.body.innerText))) break;
  }
  await snap(4);
  for (const name of ['Evidence', 'Correlation']) { await tab(page, name); await snap(4); }
  await ctx.close();

  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-framerate', '3', '-i', `${frames}/f%04d.png`,
    '-vf', 'scale=960:-1:flags=lanczos,tpad=stop_mode=clone:stop_duration=2,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
    '-loop', '0', 'assets/demo.gif',
  ]);
  console.log('wrote assets/demo.gif');
}

await browser.close();
console.log('raw screenshots in', path.relative('.', RAW));
