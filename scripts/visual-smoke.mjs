// Visual smoke: opens every reachable screen of the built app in the three themes and saves a PNG of each.
//   npm run visual                      (builds first when dist/ is missing)
//   node scripts/visual-smoke.mjs --theme dark --only report,console
// Output: artifacts/visual/<theme>/<screen>.png (1440x900 viewport; full page, except modals) and artifacts/visual/report.json.
//
// The run is offline and deterministic: /api/osint/verify is answered by canned responses (the real scan path:
// useScan -> src/scan/engine.ts -> src/api/client.ts runs, only the network probe is replaced), every request that is not for the local server is blocked and
// recorded, Date is frozen, Math.random is seeded, motion is reduced and the UI language is fixed to English.
// Exits 1 when a page throws, the console logs an error, a screen cannot be reached, or any request tries to leave
// the machine (the app is local-first: opening it must not contact third parties).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT, startServer } from './lib/local-server.mjs';

// Hosts allowed to be contacted while the screens open. Empty since Etapa 2 of docs/REFACTOR_PLAN.md: Google Fonts
// left index.html and PlatformFavicon draws a local monogram unless the user turns remote icons on
// (src/utils/faviconPreference.ts). Any external request is still blocked, recorded and fails the run.
const KNOWN_EXTERNAL_HOSTS = [];

const THEMES = ['dark', 'light', 'high-contrast'];
const LANGUAGE = 'en';
const TARGET = 'mineiro-smoke';
const BATCH_TARGETS = ['mineiro-smoke-a', 'mineiro-smoke-b'];
const FIXED_TIME = '2026-01-15T12:00:00.000Z';
const VIEWPORT = { width: 1440, height: 900 };
const OUT = path.join(ROOT, 'artifacts', 'visual');

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const themes = arg('theme') ? arg('theme').split(',') : THEMES;
const only = arg('only') ? new Set(arg('only').split(',')) : null;

/**
 * Chromium: Playwright's own build (1.63 expects build 1243, found in PLAYWRIGHT_BROWSERS_PATH or the default
 * cache). CHROME_PATH is ignored on purpose: a different browser renders different pixels and the PNGs are
 * compared across stages. MINEIRO_VISUAL_CHROME overrides it when a contributor has no Playwright browser.
 */
function launchOptions() {
  const explicit = process.env.MINEIRO_VISUAL_CHROME;
  if (explicit && fs.existsSync(explicit)) return { executablePath: explicit };
  return {};
}

// ---------- canned /api/osint/verify ----------
function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Same shape as server/routes/verify.ts. The verdict depends only on platformId and the handle. */
function cannedVerify(body) {
  const { platformId = 'unknown', url = '', username = '', detectorReliability = 60, scanDepth = 'fast' } = body;
  const h = hash(`${platformId}|${username}`);
  const bucket = h % 10;
  const status = bucket < 3 ? 'found' : bucket === 3 ? 'uncertain' : bucket === 4 ? 'rate_limited' : 'not_found';
  const statusCode = { found: 200, uncertain: 403, rate_limited: 429, not_found: 404 }[status];
  const base = {
    platformId, url, scanDepth, collectedAt: FIXED_TIME, detectorVersion: 'visual-smoke',
    status, statusCode, responseTimeMs: 120 + (h % 700), detectorReliability,
    wafRetried: false, retryResolved: false,
  };
  if (status === 'found') {
    return {
      ...base, confidenceScore: 70 + (h % 25), evidenceLevel: h % 2 ? 'confirmed' : 'probable',
      evidenceSignals: ['http_status:200', 'expected_status_match', 'handle_in_body'],
      evidenceChecksPassed: 5 + (h % 3), evidenceChecksTotal: 8,
    };
  }
  if (status === 'not_found') {
    return { ...base, confidenceScore: 88, evidenceLevel: 'absent', evidenceSignals: ['http_status:404'] };
  }
  return {
    ...base, confidenceScore: status === 'rate_limited' ? 35 : 42, evidenceLevel: 'uncertain',
    evidenceSignals: [`http_status:${statusCode}`, 'request_blocked'],
    uncertainReason: `HTTP ${statusCode} protection challenge (no retry in this mode)`,
  };
}

// ---------- page setup ----------
const initScript = ({ theme, language }) => {
  try {
    localStorage.setItem('mineiro_theme_preference', theme);
    localStorage.setItem('mineiro_language_preference', language);
  } catch { /* storage unavailable: the run reports the theme mismatch */ }
  let seed = 0x9e3779b9;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

async function openPage(browser, baseUrl, theme, problems, external) {
  const context = await browser.newContext({
    viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC',
    colorScheme: 'dark', reducedMotion: 'reduce',
  });
  const base = new URL(baseUrl);
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.host !== base.host) {
      external.push({ theme, host: url.host, url: request.url().slice(0, 200), known: KNOWN_EXTERNAL_HOSTS.includes(url.host) });
      return route.abort('blockedbyclient');
    }
    if (url.pathname === '/api/osint/verify' && request.method() === 'POST') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cannedVerify(request.postDataJSON() || {})) });
    }
    return route.continue();
  });
  await context.addInitScript(initScript, { theme, language: LANGUAGE });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(FIXED_TIME));

  let current = 'load';
  page.on('pageerror', (error) => problems.push({ theme, screen: current, kind: 'pageerror', text: error.message }));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const location = message.location()?.url || '';
    // A blocked request to a known external host logs "Failed to load resource"; that host is reported separately.
    if (/Failed to load resource/.test(message.text()) && location && KNOWN_EXTERNAL_HOSTS.includes(new URL(location).host)) return;
    problems.push({ theme, screen: current, kind: 'console', text: `${message.text()}${location ? ` @ ${location}` : ''}` });
  });
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.host === base.host && response.status() >= 500) {
      problems.push({ theme, screen: current, kind: 'http', text: `${response.status()} ${url.pathname}` });
    }
  });
  return { context, page, setScreen: (name) => { current = name; } };
}

// ---------- helpers ----------
const settle = async (page, ms = 400) => {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page.waitForTimeout(ms);
};

const modal = (page) => page.locator('div.fixed.inset-0').filter({ has: page.locator('h2') }).last();

async function closeModal(page) {
  await page.keyboard.press('Escape');
  await modal(page).waitFor({ state: 'detached', timeout: 5000 });
}

async function waitForScanDone(page, expectedCases) {
  // The case badge in the header increments once the collection has been written to IndexedDB.
  await page.locator('header').getByRole('button', { name: new RegExp(`Cases\\s*${expectedCases}\\b`) })
    .waitFor({ timeout: 60000 });
  await settle(page, 600);
}

// ---------- screens ----------
// Each step brings the page to a screen; the runner saves <name>.png. Order matters: later steps reuse the scan.
const STEPS = [
  ['start', async (page) => {
    await page.getByTestId('home-view').waitFor();
  }],
  ['report', async (page) => {
    const home = page.getByTestId('home-view');
    const input = home.locator('input[type=text]').first();
    await input.fill(TARGET);
    await input.press('Enter');
    await waitForScanDone(page, 1);
    await page.getByTestId('home-view').waitFor({ state: 'detached' });
  }],
  ['evidence', (page) => tab(page, 'Evidence')],
  ['platforms', (page) => tab(page, 'Platforms')],
  ['correlation', async (page) => {
    await tab(page, 'Correlation');
    await page.waitForTimeout(2500); // force layout of the relationship graph
  }],
  ['console', (page) => tab(page, 'Console')],
  ['header-report', (page) => headerButton(page, /^Report/)],
  ['header-ai', (page) => headerButton(page, /^AI/)],
  ['modal-gemini', async (page) => {
    await page.getByRole('button', { name: 'Configure Gemini' }).click();
    await modal(page).waitFor();
  }],
  ['header-cases-history-modal', async (page) => {
    await closeModal(page);
    await headerButton(page, /^Cases/);
    await modal(page).waitFor();
  }],
  ['header-batch-import-modal', async (page) => {
    await closeModal(page);
    await headerButton(page, /^Batch/);
    await modal(page).waitFor();
  }],
  ['modal-export', async (page) => {
    await closeModal(page);
    await page.locator('header').getByRole('button', { name: 'Export' }).click();
    await modal(page).waitFor();
  }],
  ['modal-modular-scan', async (page) => {
    await closeModal(page);
    await page.getByRole('button', { name: 'Advanced settings' }).click();
    await modal(page).waitFor();
  }],
  ['modal-shortcuts', async (page) => {
    await closeModal(page);
    await page.locator('body').click({ position: { x: 5, y: 890 } });
    await page.keyboard.press('Shift+Slash');
    await page.getByRole('dialog').waitFor();
  }],
  ['dashboard-legacy', async (page) => {
    // Not in the tab bar: only the "1" shortcut opens the old dashboard view.
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.keyboard.press('1');
    await settle(page, 6000); // the D3 force graph needs ~300 ticks to come to rest
  }],
  ['batch-queue', async (page) => {
    await headerButton(page, /^Batch/);
    const dialog = modal(page);
    await dialog.getByRole('tab', { name: /Paste List/ }).click();
    await dialog.locator('textarea').fill(BATCH_TARGETS.join('\n'));
    await dialog.getByRole('button', { name: /Launch Bulk Reconnaissance/ }).click();
    await dialog.waitFor({ state: 'detached' });
    await page.locator('[role="progressbar"][aria-valuenow="100"]').last().waitFor({ timeout: 60000 }); // fila de lote concluída
    await settle(page, 800);
  }],
  ['start-recent-cases', async (page) => {
    await page.locator('header').getByRole('button', { name: 'Clear workspace' }).click();
    await page.getByTestId('home-view').waitFor();
  }],
];

async function tab(page, name) {
  await page.getByRole('button', { name, exact: true }).first().click();
  await settle(page);
}

async function headerButton(page, name) {
  await page.locator('header nav').getByRole('button', { name }).click();
  await settle(page);
}

// ---------- run ----------
const problems = [];
const external = [];
const captured = [];
const unreachable = [];

const server = await startServer();
console.log(`[server] ${server.url}`);
const browser = await chromium.launch(launchOptions());
const browserVersion = browser.version();
console.log(`[browser] chromium ${browserVersion}`);
try {
  for (const theme of themes) {
    const dir = path.join(OUT, theme);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const { context, page, setScreen } = await openPage(browser, server.url, theme, problems, external);
    await page.goto(server.url, { waitUntil: 'networkidle' });
    const applied = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (applied !== theme) problems.push({ theme, screen: 'load', kind: 'theme', text: `data-theme is "${applied}"` });

    for (const [name, step] of STEPS) {
      setScreen(name);
      try {
        await step(page);
        await settle(page, 300);
        if (only && !only.has(name)) continue;
        const file = path.join(dir, `${name}.png`);
        await page.mouse.move(VIEWPORT.width - 2, VIEWPORT.height - 2); // no hover state on the captured controls
        // A modal is a fixed overlay sized to the viewport: a full-page capture would show the page below it uncovered.
        const fullPage = !(await modal(page).count()) && !(await page.getByRole('dialog').count());
        await page.screenshot({ path: file, fullPage, animations: 'disabled', caret: 'hide' });
        const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        captured.push({ theme, screen: name, file: path.relative(ROOT, file), overflowX });
        console.log(`[shot] ${theme}/${name}.png${overflowX ? '  (horizontal overflow)' : ''}`);
      } catch (error) {
        unreachable.push({ theme, screen: name, error: String(error.message || error).split('\n')[0] });
        console.log(`[fail] ${theme}/${name}: ${String(error.message || error).split('\n')[0]}`);
        // Recover a known state so the next steps still run: close any modal.
        await page.keyboard.press('Escape').catch(() => undefined);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.stop();
}

const unknownExternal = external.filter((item) => !item.known);
const hosts = [...new Set(external.map((item) => `${item.host}${item.known ? ' (known)' : ''}`))];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'report.json'), `${JSON.stringify({
  generatedWith: 'scripts/visual-smoke.mjs', browser: browserVersion, language: LANGUAGE, viewport: VIEWPORT, fixedTime: FIXED_TIME,
  captured, unreachable, problems, externalHosts: hosts,
  externalRequests: external.length, externalSample: external.slice(0, 50),
}, null, 2)}\n`);

console.log(`\n${captured.length} screenshot(s), ${unreachable.length} unreachable, ${problems.length} problem(s)`);
console.log(`external hosts (blocked): ${hosts.length ? hosts.join(', ') : 'none'} — ${external.length} request(s)`);
for (const p of problems) console.log(`[problem] ${p.theme}/${p.screen} ${p.kind}: ${p.text}`);
for (const u of unknownExternal.slice(0, 20)) console.log(`[external] ${u.theme} ${u.url}`);
process.exit(problems.length || unreachable.length || unknownExternal.length ? 1 : 0);
