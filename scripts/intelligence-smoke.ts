import { buildIntelligenceAssessment } from '../src/intelligence/assessment';
import {
  DEFAULT_INTELLIGENCE_EXPORT,
  createExportManifest,
  generateIntelligenceHtml,
  generateIntelligenceJson,
  generateIntelligenceMarkdown,
} from '../src/intelligence/reportExport';
import type { ScanResult } from '../src/types';

const results: ScanResult[] = [
  {
    id: '1', platformId: 'github', platformName: 'GitHub', category: 'developer',
    url: 'https://example.test/github/demo', status: 'found',
    confidenceScore: 94, detectorReliability: 96,
    evidenceChecksPassed: 8, evidenceChecksTotal: 8,
    evidenceSignals: ['expected_status_match','username_token_in_body','canonical_consistent','username_in_final_url'],
    checkedAt: '2026-09-26T18:00:00.000Z',
    metadata: {
      displayName: 'Demo Researcher',
      organization: 'Example Lab',
      extractedLinks: ['https://shared.example/profile'],
      publicProjects: ['Open Research Project'],
      accountCreatedAt: '2020-01-01T00:00:00.000Z',
      firstPublicEvidenceAt: '2020-02-01T00:00:00.000Z',
    },
  },
  {
    id: '2', platformId: 'gitlab', platformName: 'GitLab', category: 'developer',
    url: 'https://example.test/gitlab/demo', status: 'found',
    confidenceScore: 87, detectorReliability: 91,
    evidenceChecksPassed: 7, evidenceChecksTotal: 8,
    evidenceSignals: ['expected_status_match','username_in_final_url','canonical_consistent'],
    checkedAt: '2026-09-26T18:00:01.000Z',
    metadata: {
      displayName: 'Demo Researcher',
      extractedLinks: ['https://shared.example/profile'],
    },
  },
  {
    id: '3', platformId: 'medium', platformName: 'Medium', category: 'media',
    url: 'https://example.test/medium/demo', status: 'found',
    confidenceScore: 78, detectorReliability: 83,
    evidenceChecksPassed: 6, evidenceChecksTotal: 8,
    evidenceSignals: ['expected_status_match','username_in_final_url'],
    checkedAt: '2026-09-26T18:00:02.000Z',
    metadata: { extractedLinks: ['https://shared.example/about'] },
  },
  {
    id: '4', platformId: 'forum', platformName: 'Example Forum', category: 'community',
    url: 'https://example.test/forum/demo', status: 'uncertain',
    confidenceScore: 35, detectorReliability: 58,
    evidenceChecksPassed: 2, evidenceChecksTotal: 8,
    evidenceSignals: ['edge_protection_detected'],
    checkedAt: '2026-09-26T18:00:03.000Z',
  },
  {
    id: '5', platformId: 'missing', platformName: 'Missing', category: 'social',
    url: 'https://example.test/missing/demo', status: 'not_found',
    confidenceScore: 94, detectorReliability: 88,
    checkedAt: '2026-09-26T18:00:04.000Z',
  },
];

const assessment = buildIntelligenceAssessment(results, 'synthetic-demo', 'developer_footprint');

if (assessment.intelligenceRequirement !== 'developer_footprint') throw new Error('requirement mismatch');
if (assessment.collection.requested !== 5) throw new Error('requested coverage mismatch');
if (assessment.collection.found !== 3) throw new Error('found coverage mismatch');
if (assessment.collection.uncertain !== 1) throw new Error('uncertain coverage mismatch');
if (!assessment.judgments.length) throw new Error('missing judgments');
if (!assessment.evidence.length) throw new Error('missing evidence matrix');
if (!assessment.analyticLedger.length) throw new Error('missing analytic ledger');
if (!assessment.provenanceGraph.nodes.length) throw new Error('missing provenance graph');
if (!assessment.graph.edges.some((e) => e.relationship === 'SAME_DOMAIN')) throw new Error('missing same-domain correlation edge');
if (!assessment.timeline.some((e) => e.timestampKind === 'ACCOUNT_CREATED')) throw new Error('missing semantic timeline event');
if (!assessment.clusters.some((c) => c.overlaps.length > 0)) throw new Error('missing cross-cluster overlap');
if (!assessment.gaps.length) throw new Error('missing intelligence gaps');
if (!assessment.pivots.length) throw new Error('missing pivots');
if (!assessment.hypotheses.some((h) => h.alternative)) throw new Error('missing alternative hypothesis');

const json = generateIntelligenceJson('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT, 'developer_footprint');
const md = generateIntelligenceMarkdown('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT, 'developer_footprint');
const html = generateIntelligenceHtml('synthetic-demo', results, DEFAULT_INTELLIGENCE_EXPORT, 'developer_footprint');

if (!json.includes('mineiro.intelligence-report.v2')) throw new Error('JSON schema v2 missing');
if (!json.includes('developer_footprint')) throw new Error('requirement missing from JSON');
if (!md.includes('## 19 Provenance')) throw new Error('Markdown provenance section missing');
if (!html.includes('OPEN-SOURCE INTELLIGENCE ASSESSMENT')) throw new Error('HTML report missing');
if (!html.includes('22 · EXPORT MANIFEST')) throw new Error('HTML export manifest section missing');
if (!html.includes('shared.example')) throw new Error('correlation evidence missing from HTML');

const manifest = await createExportManifest(
  'synthetic-demo',
  'developer_footprint',
  DEFAULT_INTELLIGENCE_EXPORT,
  'html',
  html
);
if (!/^[a-f0-9]{64}$/.test(manifest.payloadSha256)) throw new Error('manifest SHA-256 invalid');
if (manifest.hashScope !== 'payload-before-manifest') throw new Error('manifest hash scope mismatch');

console.log('[PASS] v1.4.1 complete intelligence assessment/export smoke test.');
