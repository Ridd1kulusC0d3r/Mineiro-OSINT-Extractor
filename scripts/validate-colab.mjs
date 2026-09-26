import fs from 'node:fs';

const path = 'notebooks/Mineiro_Official_Colab.ipynb';
if (!fs.existsSync(path)) throw new Error(`Missing canonical notebook: ${path}`);

const notebook = JSON.parse(fs.readFileSync(path, 'utf8'));
if (notebook.nbformat !== 4) throw new Error('Official Colab notebook must use nbformat 4.');
if (!Array.isArray(notebook.cells) || notebook.cells.length < 8) {
  throw new Error('Official Colab notebook is unexpectedly incomplete.');
}

const source = notebook.cells
  .flatMap((cell) => Array.isArray(cell.source) ? cell.source : [])
  .join('');

const required = [
  'Mineiro Official Colab',
  'registry:validate',
  '/api/health',
  'google.colab.kernel.proxyPort',
  'mineiro-server.log',
  'intelligence:test',
];

for (const token of required) {
  if (!source.includes(token)) throw new Error(`Official Colab notebook missing required token: ${token}`);
}

const forbidden = [
  'MINEIRO_ENABLE_LEGACY_PROFILE=1',
  'allowedHosts: true',
];

for (const token of forbidden) {
  if (source.includes(token)) throw new Error(`Official Colab notebook contains forbidden configuration: ${token}`);
}

for (const cell of notebook.cells) {
  if (Array.isArray(cell.outputs) && cell.outputs.length > 0) {
    throw new Error('Official Colab notebook must be committed without execution outputs.');
  }
}

console.log('[PASS] Official Colab notebook validated.');
