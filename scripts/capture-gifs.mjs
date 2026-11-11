// Records the README/docs GIFs from the built app, offline:  npm run gifs
// /api/osint/verify is answered with fixed synthetic verdicts for a made-up handle and every request that
// leaves the local instance is blocked, so the recordings never depend on the network or show a real person.
// Needs ffmpeg and a Chromium (CHROME_PATH or Playwright's own).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { startServer } from './lib/local-server.mjs';

const HANDLE = 'mineiro-demo';
const FRAMES = path.resolve('assets/src/gif-frames');
const OUT = path.resolve('assets/gifs');
const SIZE = { width: 1280, height: 720 };
const FPS = 4;

/** Same idea as scripts/visual-smoke.mjs: a verdict that depends only on platform and handle. */
function cannedVerify(body) {
  const { platformId = 'unknown', url = '', username = '', detectorReliability = 70 } = body;
  let h = 2166136261;
  for (const ch of `${platformId}|${username}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h >>>= 0;
  const b = h % 10;
  const status = b < 3 ? 'found' : b === 3 ? 'uncertain' : b === 4 ? 'rate_limited' : 'not_found';
  const statusCode = { found: 200, uncertain: 403, rate_limited: 429, not_found: 404 }[status];
  return {
    platformId, url, status, statusCode, responseTimeMs: 120 + (h % 700), detectorReliability, collectedAt: new Date().toISOString(),
    confidenceScore: status === 'found' ? 70 + (h % 25) : status === 'not_found' ? 88 : 40,
    evidenceLevel: status === 'found' ? 'probable' : status === 'not_found' ? 'absent' : 'uncertain',
    evidenceSignals: [`http_status:${statusCode}`], evidenceChecksPassed: status === 'found' ? 5 + (h % 3) : undefined, evidenceChecksTotal: status === 'found' ? 8 : undefined,
    uncertainReason: status === 'uncertain' || status === 'rate_limited' ? `HTTP ${statusCode} protection challenge` : undefined,
  };
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    const exe = dir && ['chrome-linux64', 'chrome-linux'].map((d) => path.join(base, dir, d, 'chrome')).find((f) => fs.existsSync(f));
    if (exe) return exe;
  }
  return undefined; // Playwright default
}

const server = await startServer();
const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
fs.mkdirSync(OUT, { recursive: true });

/** Opens a page in the given theme, lets `scene` drive it while calling snap(), then encodes the frames. */
async function record(name, theme, scene, { verifyDelayMs = 0 } = {}) {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  const ctx = await browser.newContext({ viewport: SIZE, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => {
    localStorage.setItem('mineiro_theme_preference', t);
  }, theme);
  await ctx.route('**/*', async (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== new URL(server.url).origin) return route.abort('blockedbyclient');
    if (u.pathname === '/api/osint/verify' && route.request().method() === 'POST') {
      if (verifyDelayMs) await new Promise((r) => setTimeout(r, verifyDelayMs));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cannedVerify(route.request().postDataJSON() || {})) });
    }
    return route.continue();
  });
  const page = await ctx.newPage();
  let n = 0;
  const snap = async (times = 1) => {
    for (let i = 0; i < times; i++) await page.screenshot({ path: `${FRAMES}/f${String(n++).padStart(4, '0')}.png` });
  };
  await page.goto(server.url, { waitUntil: 'networkidle' });
  await page.locator('#lang-btn-en').click();
  await page.waitForTimeout(400);
  await scene(page, snap);
  await ctx.close();

  const file = path.join(OUT, `${name}.gif`);
  execFileSync('ffmpeg', [
    '-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${FRAMES}/f%04d.png`,
    '-vf', 'scale=960:-1:flags=lanczos,tpad=stop_mode=clone:stop_duration=2,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
    '-loop', '0', file,
  ]);
  console.log(`wrote ${path.relative('.', file)} (${n} frames, ${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
}

const tab = async (page, name) => {
  await page.locator('button', { hasText: new RegExp(`^${name}`, 'i') }).first().click();
  await page.waitForTimeout(700);
};

async function typeHandle(page, snap) {
  const input = page.locator('input[type=text]').first();
  await input.click();
  for (const [i, ch] of [...HANDLE].entries()) { await input.type(ch, { delay: 40 }); if (i % 2) await snap(1); }
}

async function waitDone(page, snap) {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    if (snap) await snap(1);
    await page.waitForTimeout(250);
    if (/100%/.test(await page.evaluate(() => document.body.innerText))) break;
  }
  await page.waitForTimeout(600);
}

async function scanned(page) {
  await page.locator('input[type=text]').first().fill(HANDLE);
  await page.locator('button', { hasText: /^Standard/ }).first().click();
  await page.locator('button[type=submit]').first().click();
  await waitDone(page);
}

async function scrollBy(page, snap, steps, dy) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy);
    await page.waitForTimeout(180);
    await snap(1);
  }
}

// 1. The scan: type a handle, pick Standard, watch the platform cards resolve.
await record('scan', 'dark', async (page, snap) => {
  await snap(4);
  await typeHandle(page, snap);
  await page.locator('button', { hasText: /^Standard/ }).first().click();
  await page.waitForTimeout(300);
  await snap(3);
  await page.locator('button[type=submit]').first().click();
  await tab(page, 'Platforms');
  await waitDone(page, snap);
  await snap(4);
  await scrollBy(page, snap, 5, 260);
  await snap(4);
}, { verifyDelayMs: 1100 });

// 2. From verdicts to assessment: evidence matrix, correlation, intelligence report.
await record('report', 'dark', async (page, snap) => {
  await scanned(page);
  await tab(page, 'Evidence');
  await snap(6);
  await tab(page, 'Correlation');
  await snap(6);
  await tab(page, 'Intelligence');
  await snap(4);
  await scrollBy(page, snap, 16, 420);
  await snap(4);
});

// 3. The three themes on the same screen.
await record('themes', 'dark', async (page, snap) => {
  await scanned(page);
  await tab(page, 'Platforms');
  await snap(7);
  for (let i = 0; i < 2; i++) {
    await page.locator('button', { hasText: /^Theme/ }).first().click();
    await page.waitForTimeout(400);
    await snap(7);
  }
  await page.locator('button', { hasText: /^Theme/ }).first().click();
  await page.waitForTimeout(400);
  await snap(3);
});

await browser.close();
await server.stop();
fs.rmSync(FRAMES, { recursive: true, force: true });
