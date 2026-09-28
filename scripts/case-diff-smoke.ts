import { diffCollections } from '../src/cases/diff';
import type { CaseCollectionSnapshot } from '../src/cases/types';
import type { ScanResult } from '../src/types';

function result(
  platformId: string,
  platformName: string,
  status: ScanResult['status'],
  confidenceScore: number,
  extras: Partial<ScanResult> = {}
): ScanResult {
  return {
    id: `${platformId}-${status}`,
    platformId,
    platformName,
    category: 'developer',
    url: `https://example.test/${platformId}`,
    status,
    confidenceScore,
    detectorReliability: 80,
    checkedAt: new Date().toISOString(),
    ...extras,
  };
}

function snapshot(id: string, collectedAt: string, results: ScanResult[]): CaseCollectionSnapshot {
  return {
    id,
    caseId: 'case-test',
    target: 'pascho',
    targetType: 'username',
    collectedAt,
    preset: 'standard',
    results,
    emailData: null,
    foundCount: results.filter((item) => item.status === 'found').length,
    uncertainCount: results.filter((item) => item.status === 'uncertain' || item.status === 'rate_limited').length,
    totalScanned: results.length,
  };
}

const before = snapshot('s1', '2026-09-27T10:00:00Z', [
  result('github', 'GitHub', 'found', 80),
  result('gitlab', 'GitLab', 'found', 88),
  result('medium', 'Medium', 'found', 70),
  result('forum', 'Forum', 'uncertain', 40),
]);

const after = snapshot('s2', '2026-09-28T10:00:00Z', [
  result('github', 'GitHub', 'found', 94),
  result('gitlab', 'GitLab', 'not_found', 88),
  result('medium', 'Medium', 'found', 70, { metadata: { displayName: 'Pascho Dev' } }),
  result('newsite', 'New Site', 'found', 84),
]);

const report = diffCollections(before, after);

const github = report.entries.find((entry) => entry.platformId === 'github');
if (github?.changeType !== 'CONFIDENCE_UP') throw new Error('Expected GitHub CONFIDENCE_UP.');

const gitlab = report.entries.find((entry) => entry.platformId === 'gitlab');
if (gitlab?.changeType !== 'CHANGED') throw new Error('Expected GitLab CHANGED.');

const medium = report.entries.find((entry) => entry.platformId === 'medium');
if (medium?.changeType !== 'CHANGED' || !medium.changedFields.includes('metadata')) {
  throw new Error('Expected Medium metadata CHANGED.');
}

const newSite = report.entries.find((entry) => entry.platformId === 'newsite');
if (newSite?.changeType !== 'NEW') throw new Error('Expected NEW platform.');

const forum = report.entries.find((entry) => entry.platformId === 'forum');
if (forum?.changeType !== 'DISAPPEARED') throw new Error('Expected DISAPPEARED platform.');

if (report.materialChanges !== 5) {
  throw new Error(`Expected 5 material changes, got ${report.materialChanges}.`);
}

console.log('[PASS] Case Diff Intelligence engine validated.');
