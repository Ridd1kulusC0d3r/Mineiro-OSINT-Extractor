// Prints the CHANGELOG section for a version: node scripts/release-notes.mjs 1.7.0
import fs from 'node:fs';

const version = (process.argv[2] || '').replace(/^v/, '');
const lines = fs.readFileSync('CHANGELOG.md', 'utf8').split('\n');
const start = lines.findIndex((l) => l.startsWith(`## [${version}]`));
if (start === -1) {
  console.error(`No CHANGELOG section for ${version}`);
  process.exit(1);
}
let end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
if (end === -1) end = lines.length;
console.log(lines.slice(start + 1, end).join('\n').trim());
