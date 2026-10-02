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
const WANT_DOCS = process.argv.includes('--docs');
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
if (!process.argv.includes('--docs-only')) {
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


// ---- 3. documentation screens (modals cropped to their panel) ----
if (WANT_DOCS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const out = (name) => `${RAW}/docs-${name}.png`;
  const settle = (ms = 700) => page.waitForTimeout(ms);

  /** Crops to the visible modal panel (the largest bordered box inside the full-screen overlay). */
  async function shootModal(name) {
    await settle();
    const box = await page.evaluate(() => {
      const overlays = [...document.querySelectorAll('div')].filter((d) => {
        const c = getComputedStyle(d);
        return c.position === 'fixed' && d.offsetWidth >= innerWidth - 2 && d.offsetHeight >= innerHeight - 2;
      });
      const o = overlays.at(-1);
      if (!o) return null;
      const cand = [...o.querySelectorAll('div')]
        .filter((d) => d.offsetWidth > 300 && d.offsetWidth < innerWidth - 40 && d.offsetHeight > 150 && getComputedStyle(d).borderTopWidth !== '0px')
        .sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight)[0];
      if (!cand) return null;
      const r = cand.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    await page.screenshot({ path: out(name), ...(box ? { clip: box } : {}) });
  }
  const closeModal = async () => { await page.keyboard.press('Escape'); await settle(400); };
  const header = (label) => page.locator('header button', { hasText: new RegExp(`^${label}`, 'i') }).first();

  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.locator('#lang-btn-en').click();
  await settle(500);

  await page.locator('button[title="Advanced settings"], button[aria-label="Advanced settings"]').first().click();
  await shootModal('modular'); await closeModal();

  await header('Cases').click(); await shootModal('cases-empty'); await closeModal();

  await header('Batch').click(); await settle();
  await page.getByText(/PASTE LIST/i).first().click().catch(() => {});
  await settle(400);
  await shootModal('batch'); await closeModal();

  await page.locator('body').click({ position: { x: 5, y: 400 } });
  await page.keyboard.press('?');
  await shootModal('shortcuts'); await closeModal();

  await header('AI').click(); await settle();
  await page.screenshot({ path: out('ai') });
  await page.locator('button', { hasText: /Configure Gemini/ }).first().click();
  await shootModal('gemini'); await closeModal();

  // Two Standard scans of the same public handle -> a real snapshot history to diff.
  for (let run = 0; run < 2; run++) {
    await header('Report').click(); await settle(400);
    const input = page.locator('input[type=text]').first();
    await input.fill(HANDLE);
    await page.locator('button', { hasText: /^Standard/ }).first().click();
    await page.locator('button[type=submit]').first().click();
    await waitDone(page);
    await page.waitForTimeout(1500);
    if (run === 0) {
      await tab(page, 'Evidence');
      await page.screenshot({ path: out('filters') });
    }
  }

  await tab(page, 'Console'); await page.screenshot({ path: out('console') });
  await tab(page, 'Correlation');
  await page.getByRole('button', { name: /Similar Usernames/i }).first().click(); await settle(900);
  await page.screenshot({ path: out('similar'), fullPage: true });
  await page.getByRole('button', { name: /Case & Diff/i }).first().click(); await settle(900);
  await page.screenshot({ path: out('diff'), fullPage: true });

  // The Dashboard has no tab: it opens with the "1" key while no input is focused.
  await page.locator('body').click({ position: { x: 5, y: 400 } });
  await page.keyboard.press('1'); await settle(1500);
  await page.screenshot({ path: out('dashboard') });
  await tab(page, 'Intelligence');

  await header('Export').click(); await shootModal('export'); await closeModal();
  await header('Cases').click(); await shootModal('cases'); await closeModal();

  await tab(page, 'Intelligence');
  await page.evaluate(() => window.scrollTo(0, 0));
  for (const id of ['requirement', 'coverage', 'high', 'hypotheses', 'gaps', 'method', 'integrity']) {
    const el = page.locator(`#intel-${id}`);
    if (!(await el.count())) continue;
    const box = await el.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; });
    await page.screenshot({ path: out(`report-${id}`), fullPage: true, clip: { x: Math.max(0, box.x - 32), y: box.y - 28, width: Math.min(1440 - Math.max(0, box.x - 32), box.w + 64), height: Math.min(box.h, 1100) + 56 } });
  }
  await ctx.close();

  // e-mail mode (DNS MX + Gravatar + provider heuristics; no profile probes of a person)
  const mctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const mpage = await mctx.newPage();
  await mpage.goto(URL_, { waitUntil: 'networkidle' });
  await mpage.locator('#lang-btn-en').click();
  await mpage.locator('header ~ * button, button', { hasText: /^Email$/ }).first().click();
  await mpage.locator('input[type=text]').first().fill('contato@example.org');
  await mpage.locator('button', { hasText: /^Standard/ }).first().click(); // Quick has e-mail recon switched off
  await mpage.locator('button[type=submit]').first().click();
  await mpage.waitForTimeout(9000);
  await mpage.locator('button', { hasText: /^Evidence/i }).first().click();
  await mpage.waitForTimeout(1200);
  await mpage.screenshot({ path: out('email') });
  await mctx.close();
}

await browser.close();
console.log('raw screenshots in', path.relative('.', RAW));
