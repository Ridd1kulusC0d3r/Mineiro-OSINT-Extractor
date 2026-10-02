// Live canary check: each declarative detector must see its known profile as present and a random one as absent.
// Run weekly in CI. Exit code 1 + markdown report when any detector drifted (site changed its page).
import fs from 'node:fs';
import { evaluateMatchers } from '../src/core/matchers';
import { buildDetectorUrl } from '../src/core/net';
import { getRegistryDetector } from '../src/registry/registry';
import { loadDeclarativeDetectors } from '../server/detectors';
import { readBodyPreview } from '../src/core/evidence';
import { safeFetch } from '../server/security/safeFetch';

const { detectors } = loadDeclarativeDetectors();
const failures: string[] = [];
const lines: string[] = ['| detector | present canary | absent canary |', '|---|---|---|'];

async function check(id: string, handle: string, expected: 'present' | 'absent'): Promise<string> {
  const reg = getRegistryDetector(id)!;
  const url = buildDetectorUrl(reg.urlPattern, handle);
  try {
    const { response, finalUrl } = await safeFetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'MineiroDetectorHealth/1.0' } });
    const body = await readBodyPreview(response as any);
    const verdict = evaluateMatchers(detectors.get(id)!, { status: response.status, finalUrl, body }).verdict;
    if (verdict !== expected) failures.push(`${id}: ${handle} expected ${expected}, got ${verdict} (HTTP ${response.status})`);
    return verdict === expected ? 'ok' : `FAIL (${verdict}, HTTP ${response.status})`;
  } catch (err) {
    failures.push(`${id}: ${handle} request failed: ${(err as Error).message}`);
    return 'ERROR';
  }
}

for (const [id, det] of detectors) {
  if (!det.canary) continue;
  const present = await check(id, det.canary.present, 'present');
  const absent = det.canary.absent ? await check(id, det.canary.absent, 'absent') : 'n/a';
  lines.push(`| ${id} | ${present} | ${absent} |`);
}

const report = ['# Detector health', '', ...lines, '', failures.length ? `## Drift\n${failures.map((f) => `- ${f}`).join('\n')}` : 'All canaries passed.'].join('\n');
fs.writeFileSync('detector-health.md', report);
console.log(report);
process.exit(failures.length ? 1 : 0);
