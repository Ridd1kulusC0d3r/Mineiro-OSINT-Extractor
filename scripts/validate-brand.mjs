import fs from 'node:fs';
import path from 'node:path';

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

const forbidden = [
  'Mineiro Username Extractor',
  'MINEIRO USERNAME EXTRACTOR',
  'Mineiro Intel',
  'OSINT Intelligence Workbench',
  'Mineiro_Official_Colab.ipynb',
  'mineiro-username-extractor',
];

const roots = ['src', 'docs', 'scripts', 'notebooks'];
const rootFiles = [
  'README.md',
  'index.html',
  'MANUAL.html',
  'COLAB.md',
  'COMECE-AQUI.md',
  'USER_GUIDE.md',
  'server.ts',
  'Iniciar-Mineiro.bat',
  'Iniciar-Mineiro.command',
  'iniciar-mineiro.sh',
];

const textExtensions = new Set(['.ts','.tsx','.js','.mjs','.md','.html','.json','.ipynb','.sh','.bat','.command','.txt']);

function collect(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (textExtensions.has(path.extname(entry.name)) || entry.name.endsWith('.command')) out.push(full);
  }
  return out;
}

const validatorFilesAllowedToReferenceLegacyNames = new Set([
  'scripts/validate-brand.mjs',
  'scripts/validate-docs.mjs',
]);

const activeFiles = [
  ...rootFiles.filter((file) => fs.existsSync(file)),
  ...roots.flatMap((root) => fs.existsSync(root) ? collect(root) : []),
].filter((file) => !validatorFilesAllowedToReferenceLegacyNames.has(file));

const violations = [];
for (const file of activeFiles) {
  const body = fs.readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (body.includes(token)) violations.push(`${file}: ${token}`);
  }
}

if (violations.length) {
  throw new Error(`Legacy product branding remains on active surfaces:\n- ${violations.join('\n- ')}`);
}

console.log(`[PASS] Canonical product branding validated across ${activeFiles.length} active files.`);
