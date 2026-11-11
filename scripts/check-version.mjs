// Fails when the version is not identical everywhere it is declared. Optional arg: a tag like v1.7.0.
import fs from 'node:fs';

const read = (f) => fs.readFileSync(f, 'utf8');
const pkg = JSON.parse(read('package.json')).version;

const found = {
  'package.json': pkg,
  'package-lock.json': JSON.parse(read('package-lock.json')).version,
  'python/pyproject.toml': read('python/pyproject.toml').match(/^version\s*=\s*"([^"]+)"/m)?.[1],
  'python/src/mineiro_osint/__init__.py': read('python/src/mineiro_osint/__init__.py').match(/__version__\s*=\s*"([^"]+)"/)?.[1],
  // The server takes its version from package.json (health, User-Agent, terminal banner).
  'server/version.ts': /from '\.\.\/package\.json'/.test(read('server/version.ts')) && /VERSION[^=]*=\s*pkg\.version/.test(read('server/version.ts')) ? pkg : 'does not read package.json',
  'README.md badge': read('README.md').match(/badge\/version-([\d.]+)-/)?.[1],
  'README.pt-BR.md badge': read('README.pt-BR.md').match(/badge\/version-([\d.]+)-/)?.[1],
};

// No server file may carry its own copy of the version (it would drift on the next release).
const serverFiles = ['server.ts', ...fs.readdirSync('server', { recursive: true }).map((f) => `server/${f}`)].filter((f) => f.endsWith('.ts'));
const literal = new RegExp(`['"\`/v]${pkg.replace(/\./g, '\\.')}\\b`);
for (const file of serverFiles) {
  read(file).split('\n').forEach((line, index) => {
    if (literal.test(line)) found[`${file}:${index + 1} (hard-coded version)`] = line.trim();
  });
}

// The browser client takes it from package.json too (src/version.ts, inlined by Vite); the console banner shows it.
found['src/version.ts'] = /import \{ version \} from '\.\.\/package\.json'/.test(read('src/version.ts')) && /APP_VERSION[^=]*=\s*version/.test(read('src/version.ts')) ? pkg : 'does not read package.json';
const terminal = read('src/components/TerminalLogs.tsx');
found['src/components/TerminalLogs.tsx banner'] = /\$\{APP_VERSION\}/.test(terminal) && !/\bv\d+\.\d+\.\d+\b/.test(terminal) ? pkg : 'banner does not use APP_VERSION';
const clientFiles = fs.readdirSync('src', { recursive: true }).map((f) => `src/${f}`).filter((f) => /\.tsx?$/.test(f) && f !== 'src/version.ts');
for (const file of clientFiles) {
  read(file).split('\n').forEach((line, index) => {
    if (literal.test(line)) found[`${file}:${index + 1} (hard-coded version)`] = line.trim();
  });
}

const tag = process.argv[2];
if (tag) found[`tag ${tag}`] = tag.replace(/^v/, '');

if (!read('CHANGELOG.md').includes(`## [${pkg}]`)) found['CHANGELOG.md'] = 'missing section';

const bad = Object.entries(found).filter(([, v]) => v !== pkg);
if (bad.length) {
  console.error(`Version mismatch (expected ${pkg}):`);
  bad.forEach(([file, v]) => console.error(`  ${file}: ${v}`));
  process.exit(1);
}
console.log(`[PASS] Version ${pkg} is consistent across ${Object.keys(found).length} places.`);
