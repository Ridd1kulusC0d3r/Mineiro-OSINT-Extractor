// Fails when the version is not identical everywhere it is declared. Optional arg: a tag like v1.7.0.
import fs from 'node:fs';

const read = (f) => fs.readFileSync(f, 'utf8');
const pkg = JSON.parse(read('package.json')).version;

const found = {
  'package.json': pkg,
  'package-lock.json': JSON.parse(read('package-lock.json')).version,
  'python/pyproject.toml': read('python/pyproject.toml').match(/^version\s*=\s*"([^"]+)"/m)?.[1],
  'python/src/mineiro_osint/__init__.py': read('python/src/mineiro_osint/__init__.py').match(/__version__\s*=\s*"([^"]+)"/)?.[1],
  'server.ts (health)': read('server.ts').match(/version:\s*'([\d.]+)'/)?.[1],
  'server/routes/verify.ts': read('server/routes/verify.ts').match(/VERSION\s*=\s*'([\d.]+)'/)?.[1],
  'README.md badge': read('README.md').match(/badge\/version-([\d.]+)-/)?.[1],
  'README.pt-BR.md badge': read('README.pt-BR.md').match(/badge\/version-([\d.]+)-/)?.[1],
};

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
