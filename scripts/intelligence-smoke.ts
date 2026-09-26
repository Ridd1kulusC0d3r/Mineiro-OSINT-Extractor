import { buildIntelligenceAssessment } from '../src/intelligence/assessment';
import {
  DEFAULT_INTELLIGENCE_EXPORT,
  generateIntelligenceJson,
  generateIntelligenceMarkdown,
  generateIntelligenceHtml,
} from '../src/intelligence/reportExport';
import type { ScanResult } from '../src/types';

const results: ScanResult[] = [
  {
    id: '1', platformId: 'github', platformName: 'GitHub', category: 'developer',
    url: 'https://example.test/github/demo', status: 'found',
    confidenceScore: 92, detectorReliability: 95,
    evidenceChecksPassed: 7, evidenceChecksTotal: 8,
    evidenceSignals: ['expected_status_match','username_token_in_body','canonical_consistent'],
  },
  {
    id: '2', platformId: 'gitlab', platformName: 'GitLab', category: 'developer',
    url: 'https://example.test/gitlab/demo', status: 'found',
    confidenceScore: 84, detectorReliability: 90,
    evidenceChecksPassed: 6, evidenceChecksTotal: 8,
    evidenceSignals: ['expected_status_match','username_in_final_url'],
  },
  {
    id: '3', platformId: 'forum', platformName: 'Example Forum', category: 'community',
    url: 'https://example.test/forum/demo', status: 'uncertain',
    confidenceScore: 35, detectorReliability: 58,
    evidenceChecksPassed: 2, evidenceChecksTotal: 8,
    evidenceSignals: ['edge_protection_detected'],
  },
  {
    id: '4', platformId: 'missing', platformName: 'Missing', category: 'social',
    url: 'https://example.test/missing/demo', status: 'not_found',
    confidenceScore: 94, detectorReliability: 88,
  },
];

const assessment = buildIntelligenceAssessment(results);

if (assessment.collection.requested !== 4) throw new Error('requested coverage mismatch');
if (assessment.collection.found !== 2) throw new Error('found coverage mismatch');
if (assessment.collection.uncertain !== 1) throw new Error('uncertain coverage mismatch');
if (!assessment.judgments.length) throw new Error('missing judgments');
if (!assessment.evidence.length) throw new Error('missing evidence matrix');
if (!assessment.gaps.length) throw new Error('missing intelligence gaps');
if (!assessment.pivots.length) throw new Error('missing pivots');

const json = generateIntelligenceJson('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT);
const md = generateIntelligenceMarkdown('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT);
const html = generateIntelligenceHtml('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT);

if (!json.includes('mineiro.intelligence-report.v1')) throw new Error('JSON schema missing');
if (!md.includes('Key Intelligence Judgments')) throw new Error('Markdown assessment missing');
if (!html.includes('OPEN-SOURCE INTELLIGENCE ASSESSMENT')) throw new Error('HTML report missing');
if (/https?:\/\/example\.test/.test(html) === false) throw new Error('Evidence URL unexpectedly missing from report data');

console.log('[PASS] v1.4 intelligence assessment and export smoke test.');
