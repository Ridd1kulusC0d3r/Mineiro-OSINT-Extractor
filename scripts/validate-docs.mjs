import fs from 'node:fs';

const requiredFiles = [
  'README.md',
  'docs/README.md',
  'docs/GETTING-STARTED.md',
  'docs/USER-GUIDE.md',
  'docs/COLAB.md',
  'docs/TROUBLESHOOTING.md',
  'docs/FAQ.md',
  'docs/GRAPH-HUNTING.md',
  'docs/DEPLOYMENT.md',
  'notebooks/Mineiro_Username_Intelligence_Colab.ipynb',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`Missing product documentation file: ${file}`);
}

const surfaces = [
  'README.md',
  'COLAB.md',
  'docs/README.md',
  'docs/GETTING-STARTED.md',
  'docs/COLAB.md',
];

const legacyNotebookNames = [
  'Mineiro_Official_Colab.ipynb',
  'Mineiro_One_Click_Colab.ipynb',
  'Mineiro_Username_Extractor_Colab.ipynb',
];

for (const file of surfaces) {
  const body = fs.readFileSync(file, 'utf8');
  for (const legacy of legacyNotebookNames) {
    if (body.includes(legacy)) {
      throw new Error(`${file} still references legacy notebook ${legacy}`);
    }
  }
}

const readme = fs.readFileSync('README.md', 'utf8');
if (!readme.includes('Mineiro_Username_Intelligence_Colab.ipynb')) {
  throw new Error('README does not link the canonical Colab notebook.');
}
if (!readme.includes('docs/USER-GUIDE.md')) {
  throw new Error('README does not link the user guide.');
}

console.log('[PASS] Product documentation surface validated.');
