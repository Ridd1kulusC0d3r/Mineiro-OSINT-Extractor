// Stages the production app inside the Python package (python/src/mineiro_osint/_app),
// so `pip install mineiro-osint` ships a self-contained build: no npm, no node_modules.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'python', 'src', 'mineiro_osint', '_app');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: root });

run('npx vite build');
run('npm run build:bundle');

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

// Frontend assets (exclude server bundles) -> _app/dist
fs.cpSync(path.join(root, 'dist'), path.join(target, 'dist'), {
  recursive: true,
  filter: (src) => !/server\.(cjs|bundle\.cjs)(\.map)?$/.test(src),
});
// Server bundle + declarative detectors
fs.copyFileSync(path.join(root, 'dist', 'server.bundle.cjs'), path.join(target, 'server.cjs'));
fs.cpSync(path.join(root, 'registry', 'detectors'), path.join(target, 'registry', 'detectors'), { recursive: true });
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(root, 'python', 'LICENSE'));

const size = (dir) => {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return total;
};
console.log(`[python] staged app: ${(size(target) / 1024 / 1024).toFixed(2)} MB at ${path.relative(root, target)}`);
