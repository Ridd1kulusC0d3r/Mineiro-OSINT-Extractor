import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'README.md',
  'README.pt-BR.md',
  'docs/README.md',
  'docs/GETTING-STARTED.md',
  'docs/USER-GUIDE.md',
  'docs/CLI-E-API.md',
  'docs/CHEATSHEET.md',
  'docs/RECEITAS.md',
  'docs/GLOSSARIO.md',
  'docs/PRIVACIDADE-E-DADOS.md',
  'docs/COLAB.md',
  'docs/TROUBLESHOOTING.md',
  'docs/FAQ.md',
  'docs/GRAPH-HUNTING.md',
  'docs/INTELLIGENCE-METHODOLOGY.md',
  'docs/DEPLOYMENT.md',
  'notebooks/Mineiro_Username_Intelligence_Colab.ipynb',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
];

const errors = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`Missing product documentation file: ${file}`);
}

const legacyNotebookNames = [
  'Mineiro_Official_Colab.ipynb',
  'Mineiro_One_Click_Colab.ipynb',
  'Mineiro_Username_Extractor_Colab.ipynb',
];
for (const file of ['README.md', 'COLAB.md', 'docs/README.md', 'docs/GETTING-STARTED.md', 'docs/COLAB.md']) {
  if (!fs.existsSync(file)) continue;
  const body = fs.readFileSync(file, 'utf8');
  for (const legacy of legacyNotebookNames) {
    if (body.includes(legacy)) errors.push(`${file} still references legacy notebook ${legacy}`);
  }
}

const readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('Mineiro_Username_Intelligence_Colab.ipynb')) errors.push('README does not link the canonical Colab notebook.');
if (!readme.includes('docs/USER-GUIDE.md')) errors.push('README does not link the user guide.');

// ---- Link and anchor checker -------------------------------------------------
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.venv', 'venv']);
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.') && entry.name !== '.github') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

// GitHub-style heading slug, with -1/-2 suffixes for duplicates.
function anchorsOf(file, cache = new Map()) {
  if (cache.has(file)) return cache.get(file);
  const set = new Set();
  const seen = new Map();
  let inFence = false;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[1].replace(/<[^>]+>/g, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*_~]/g, '');
    const base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    set.add(n === 0 ? base : `${base}-${n}`);
  }
  // explicit HTML anchors
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/<a\s+(?:name|id)="([^"]+)"/g)) set.add(m[1]);
  cache.set(file, set);
  return set;
}

const mdFiles = walk('.');
let checked = 0;
for (const file of mdFiles) {
  const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, (b) => b.replace(/[^\n]/g, ' ')).replace(/`[^`\n]*`/g, (b) => ' '.repeat(b.length));
  const targets = [];
  for (const m of text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) targets.push(m[1]);
  for (const m of text.matchAll(/\b(?:src|href)="([^"]+)"/g)) targets.push(m[1]);
  for (const raw of targets) {
    if (/^(https?:|mailto:|tel:|data:)/i.test(raw)) continue;
    const [pathPart, hash] = raw.split('#');
    const target = pathPart ? path.normalize(path.join(path.dirname(file), decodeURI(pathPart))) : file;
    checked++;
    if (!fs.existsSync(target)) { errors.push(`${file}: broken link → ${raw}`); continue; }
    if (hash && target.endsWith('.md') && fs.statSync(target).isFile()) {
      if (!anchorsOf(target).has(decodeURIComponent(hash).toLowerCase())) errors.push(`${file}: missing anchor → ${raw}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((e) => `  - ${e}`).join('\n'));
  console.error(`\n[FAIL] ${errors.length} documentation problem(s) (${checked} links checked in ${mdFiles.length} files).`);
  process.exit(1);
}
console.log(`[PASS] Product documentation validated: ${checked} links/anchors in ${mdFiles.length} Markdown files.`);
