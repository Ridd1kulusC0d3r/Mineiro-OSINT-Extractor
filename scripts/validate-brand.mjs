import fs from 'node:fs';

const PRODUCT = 'Mineiro Username Intelligence';
const SUBTITLE = 'OSINT Investigation Workbench';

const required = [
  ['README.md', PRODUCT],
  ['README.md', SUBTITLE],
  ['index.html', PRODUCT],
  ['index.html', SUBTITLE],
  ['src/components/Header.tsx', PRODUCT],
  ['src/components/Header.tsx', SUBTITLE],
  ['notebooks/Mineiro_Username_Intelligence_Colab.ipynb', PRODUCT],
  ['notebooks/Mineiro_Username_Intelligence_Colab.ipynb', SUBTITLE],
  ['MANUAL.html', PRODUCT],
];

for (const [file, token] of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing brand surface: ${file}`);
  const body = fs.readFileSync(file, 'utf8');
  if (!body.includes(token)) {
    throw new Error(`${file} is missing canonical brand token: ${token}`);
  }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.name !== 'mineiro-username-intelligence') {
  throw new Error(`Unexpected package name: ${pkg.name}`);
}

const forbiddenCurrentBrand = [
  ['src/components/Header.tsx', 'Mineiro Intel'],
  ['index.html', 'Mineiro Username Extractor'],
];

for (const [file, token] of forbiddenCurrentBrand) {
  const body = fs.readFileSync(file, 'utf8');
  if (body.includes(token)) throw new Error(`${file} still contains legacy product name: ${token}`);
}

console.log('[PASS] Canonical product branding validated.');
