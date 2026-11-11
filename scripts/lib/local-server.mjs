// Starts the built server (dist/server.cjs) on a free local port for scripts that need a running instance.
// Used by scripts/visual-smoke.mjs and scripts/api-baseline.mjs.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const SERVER = path.join(ROOT, 'dist', 'server.cjs');

/** Runs `npm run build` when the client or the server bundle is missing. */
export function ensureBuild() {
  if (fs.existsSync(SERVER) && fs.existsSync(path.join(ROOT, 'dist', 'index.html'))) return;
  console.log('[build] dist/ is missing, running npm run build');
  const result = spawnSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('npm run build failed');
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

/**
 * Starts dist/server.cjs in production mode, bound to 127.0.0.1, with an in-memory SQLite store and no
 * Gemini key, and resolves once it prints "[ready]". Returns { url, stop, output }.
 */
export async function startServer({ timeoutMs = 30000 } = {}) {
  ensureBuild();
  const port = await freePort();
  const env = { ...process.env, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1', MINEIRO_DB: ':memory:' };
  delete env.GEMINI_API_KEY;
  delete env.MINEIRO_PUBLIC;
  delete env.MINEIRO_ENABLE_LEGACY_PROFILE;
  const child = spawn(process.execPath, [SERVER], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const collect = (chunk) => { output += chunk.toString(); };
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not print [ready] within ${timeoutMs}ms\n${output}`)), timeoutMs);
    const onData = () => {
      if (output.includes('[ready]')) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited with code ${code} before it was ready\n${output}`));
    });
  });

  const stop = () => new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    child.once('exit', () => resolve());
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 3000).unref();
  });

  return { url: `http://127.0.0.1:${port}`, port, stop, output: () => output };
}
