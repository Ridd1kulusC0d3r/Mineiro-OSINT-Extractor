// End-to-end smoke test of the start screen against a running instance:
//   NODE_ENV=production PORT=3400 node dist/server.cjs &
//   node scripts/e2e-start-page.mjs --url http://localhost:3400
// Needs a Chromium (CHROME_PATH, /opt/pw-browsers, or Playwright's own). Exits 1 on the first failed expectation.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const BASE = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://localhost:3400';
const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = '/opt/pw-browsers';
  if (fs.existsSync(base)) {
    const dir = fs.readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return path.join(base, dir, 'chrome-linux', 'chrome');
  }
  return undefined;
}

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failures++;
};

const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox'] });
const errors = [];

// ---------- desktop ----------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });

const home = page.locator('[data-testid=home-view]');
const heroInput = home.locator('input[type=text]');
check('start screen is shown before any scan', (await home.count()) === 1);
check('search is focused on desktop (checked before touching anything else)', await heroInput.evaluate((el) => el === document.activeElement));
await page.locator('#lang-btn-en').click();
check('page is compact (no empty report wall)', (await page.evaluate(() => document.documentElement.scrollHeight)) < 2600);

// pasted profile URL -> handle suggestion, Enter applies it (does not scan)
await heroInput.fill('https://github.com/forgejo');
check('profile URL shows a suggestion', (await home.getByText(/profile URL/i).count()) === 1);
await heroInput.press('Enter');
check('Enter applies the suggestion instead of scanning', (await heroInput.inputValue()) === 'forgejo' && (await home.count()) === 1);

// e-mail typed in username mode -> switches mode
await heroInput.fill('ana@example.org');
await home.getByRole('button', { name: /switch to e-mail mode/i }).click();
check('e-mail hint switches to e-mail mode', (await home.locator('button[aria-pressed=true]', { hasText: /email/i }).count()) === 1 && (await heroInput.inputValue()) === 'ana@example.org');

// spaces + leading @
await home.locator('button[aria-pressed]', { hasText: /^Username$/ }).click();
await heroInput.fill('@@john smith');
check('leading @ is stripped while typing', (await heroInput.inputValue()) === 'john smith');
check('spaces get a suggestion', (await home.getByText(/rarely contain spaces/i).count()) === 1);

// mode card
await home.locator('button[aria-pressed]', { hasText: 'Standard' }).click();
check('mode card becomes selected', (await home.locator('button[aria-pressed=true]', { hasText: 'Standard' }).count()) === 1);

// example -> scan
await home.getByRole('button', { name: '@forgejo' }).click();
check('example fills the search', (await heroInput.inputValue()) === 'forgejo');
await heroInput.press('Enter');
await page.waitForTimeout(2500);
check('scan replaces the start screen with the report', (await home.count()) === 0 && (await page.getByText('Executive view').count()) >= 1);

// wait for completion so the case is persisted, then reload -> recent case card
const t0 = Date.now();
while (Date.now() - t0 < 90000) {
  if (/100%/.test(await page.evaluate(() => document.body.innerText))) break;
  await page.waitForTimeout(500);
}
await page.waitForTimeout(1500);
await page.reload({ waitUntil: 'networkidle' });
await page.locator('#lang-btn-en').click();
const recent = page.locator('[data-testid=home-view]').getByRole('button', { name: /@forgejo/ }).filter({ hasText: /found/ });
check('recent case appears after reload', (await recent.count()) >= 1);
check('status footer shows version', /v\d+\.\d+\.\d+/.test((await page.locator('[data-testid=home-status]').innerText().catch(() => '')) || ''));

// accessibility (axe) on the start screen
await page.evaluate(() => (window.scrollTo(0, 0)));
await page.addScriptTag({ path: AXE });
const axe = await page.evaluate(async () => {
  const result = await window.axe.run(document.querySelector('[data-testid=home-view]'), { runOnly: ['wcag2a', 'wcag2aa'] });
  return result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
});
check('axe: no serious/critical WCAG A/AA violations on the start screen', !axe.some((v) => ['serious', 'critical'].includes(v.impact)), JSON.stringify(axe));
await ctx.close();

// ---------- short laptop screen: autofocus must not scroll the headline away ----------
const short = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const sp = await short.newPage();
await sp.goto(BASE, { waitUntil: 'networkidle' });
check('720px-high screen: page is not scrolled by the autofocus', (await sp.evaluate(() => window.scrollY)) === 0);
check('720px-high screen: headline is visible', await sp.locator('[data-testid=home-view] h1').evaluate((el) => el.getBoundingClientRect().top >= 0));
await short.close();

// ---------- phone ----------
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mp = await m.newPage();
await mp.goto(BASE, { waitUntil: 'networkidle' });
check('phone: no horizontal overflow', !(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)));
check('phone: search is not auto-focused (no keyboard pop-up)', !(await mp.evaluate(() => document.activeElement?.tagName === 'INPUT')));
await m.close();

check('no uncaught page errors', errors.length === 0, errors.join(' | '));
await browser.close();
process.exit(failures ? 1 : 0);
