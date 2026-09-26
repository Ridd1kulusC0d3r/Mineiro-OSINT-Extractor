import fs from 'node:fs';
import { calculateDetectorBenchmark } from '../src/registry/bench';

const input = JSON.parse(fs.readFileSync('demo/benchmark-input.json', 'utf8'));
const expected = JSON.parse(fs.readFileSync('demo/benchmark-expected.json', 'utf8'));
const ids = [...new Set(input.observations.map((item: any) => item.detectorId))] as string[];
const actual = Object.fromEntries(ids.map((id) => [id, calculateDetectorBenchmark(id, input.observations)]));
console.log('Mineiro synthetic Detector Bench demo');
console.log('-------------------------------------');
console.log(JSON.stringify(actual, null, 2));
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  console.error('\n[FAIL] O resultado não corresponde ao esperado.');
  process.exit(1);
}
console.log('\n[PASS] Demo sintética validada com sucesso.');
