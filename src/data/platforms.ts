import { Platform, PlatformScope, ModularScanConfig, ScanPreset } from '../types';
import { COMMUNITY_01_PACK } from './catalog-packs/community-01';
import { COMMUNITY_02_PACK } from './catalog-packs/community-02';
import { COMMUNITY_03_PACK } from './catalog-packs/community-03';
import { COMMUNITY_04_PACK } from './catalog-packs/community-04';
import { CREATIVE_01_PACK } from './catalog-packs/creative-01';
import { CREATIVE_02_PACK } from './catalog-packs/creative-02';
import { CRYPTO_01_PACK } from './catalog-packs/crypto-01';
import { DEVELOPER_01_PACK } from './catalog-packs/developer-01';
import { DEVELOPER_02_PACK } from './catalog-packs/developer-02';
import { DEVELOPER_03_PACK } from './catalog-packs/developer-03';
import { GAMING_01_PACK } from './catalog-packs/gaming-01';
import { GAMING_02_PACK } from './catalog-packs/gaming-02';
import { MEDIA_01_PACK } from './catalog-packs/media-01';
import { SECURITY_01_PACK } from './catalog-packs/security-01';
import { SOCIAL_01_PACK } from './catalog-packs/social-01';
import { SOCIAL_02_PACK } from './catalog-packs/social-02';
import { SOCIAL_03_PACK } from './catalog-packs/social-03';

const LEGACY_PLATFORM_CATALOG: Platform[] = [
  ...COMMUNITY_01_PACK,
  ...COMMUNITY_02_PACK,
  ...COMMUNITY_03_PACK,
  ...COMMUNITY_04_PACK,
  ...CREATIVE_01_PACK,
  ...CREATIVE_02_PACK,
  ...CRYPTO_01_PACK,
  ...DEVELOPER_01_PACK,
  ...DEVELOPER_02_PACK,
  ...DEVELOPER_03_PACK,
  ...GAMING_01_PACK,
  ...GAMING_02_PACK,
  ...MEDIA_01_PACK,
  ...SECURITY_01_PACK,
  ...SOCIAL_01_PACK,
  ...SOCIAL_02_PACK,
  ...SOCIAL_03_PACK
];

export const EVIDENCE_CHECKS = [
  { id: 'status_expected', label: 'Expected HTTP status', networkCost: 0 },
  { id: 'absence_status', label: 'Explicit absence status', networkCost: 0 },
  { id: 'redirect_consistency', label: 'Redirect consistency', networkCost: 0 },
  { id: 'username_final_url', label: 'Username continuity in final URL', networkCost: 0 },
  { id: 'username_body', label: 'Username token in response body', networkCost: 0 },
  { id: 'canonical_match', label: 'Canonical URL consistency', networkCost: 0 },
  { id: 'soft_404', label: 'Soft-404 / generic error detection', networkCost: 0 },
  { id: 'edge_protection', label: 'Rate-limit / edge protection detection', networkCost: 0 },
] as const;


function inferSiteType(platform: Platform): string {
  const text = `${platform.name} ${platform.description || ''} ${platform.urlPattern}`.toLowerCase();
  if (/package|registry|npm|pypi|rubygems|nuget|crate|composer/.test(text)) return 'package_registry';
  if (/git|code|developer|programming|coding|repository|devops/.test(text)) return 'developer_platform';
  if (/security|ctf|bug bounty|hacker|infosec|pgp|keybase/.test(text)) return 'security_research';
  if (/game|gaming|esport|steam|xbox|playstation|minecraft/.test(text)) return 'gaming';
  if (/music|audio|sound|band|artist|podcast/.test(text)) return 'music_audio';
  if (/video|stream|movie|film|tv|youtube|twitch/.test(text)) return 'video_streaming';
  if (/photo|image|photograph|flickr/.test(text)) return 'photo_media';
  if (/design|art|portfolio|creative|3d|model/.test(text)) return 'creative_portfolio';
  if (/forum|community|discussion|board|q&a|knowledge/.test(text)) return 'community_forum';
  if (/crypto|blockchain|wallet|web3|bitcoin|ethereum/.test(text)) return 'crypto_web3';
  if (/news|blog|publish|writer|journal|medium/.test(text)) return 'publishing_media';
  if (/professional|career|job|linkedin|resume/.test(text)) return 'professional';
  if (/social|profile|microblog|network|chat|messag/.test(text)) return 'social_network';
  return platform.category;
}

function detectorReliability(platform: Platform): number {
  let score = 58;
  if (platform.expectedStatus === 200) score += 7;
  if (platform.errorStatus === 404) score += 13;
  if (platform.checkMethod === 'body_content') score += 8;
  if (platform.urlPattern.includes('?')) score -= 8;
  if (platform.urlPattern.includes('search')) score -= 7;
  if (/\/user\/|\/users\/|\/u\/|\/@|~\{username\}|\{username\}\//i.test(platform.urlPattern)) score += 5;
  if (/instagram|tiktok|linkedin|facebook|x\.com|cloudflare/i.test(platform.urlPattern)) score -= 7;
  return Math.max(35, Math.min(95, score));
}

/**
 * Full project catalog.
 *
 * Historical entries are intentionally retained instead of silently deleted.
 * Each entry receives detector metadata and is marked as a legacy catalog item
 * until its provenance and behavior are independently revalidated.
 *
 * This is NOT a claim that every endpoint is currently reachable or accurate.
 */
export const PLATFORMS_DATABASE: Platform[] = LEGACY_PLATFORM_CATALOG.map((platform) => {
  const reliabilityScore = detectorReliability(platform);
  return {
    ...platform,
    source: 'mineiro-legacy',
    siteType: inferSiteType(platform),
    detectorReliability: reliabilityScore,
    reliabilityTier:
      reliabilityScore >= 85 ? 'high' :
      reliabilityScore >= 70 ? 'medium' : 'experimental',
    provenanceStatus: 'legacy-audit-required',
    licenseStatus: 'project-legacy-unverified',
    optionalEvidenceChecks: EVIDENCE_CHECKS.map((check) => check.id),
  };
});

export const OPTIONAL_EVIDENCE_CHECKS_COUNT =
  PLATFORMS_DATABASE.length * EVIDENCE_CHECKS.length;

export const CATALOG_STATS = {
  sites: PLATFORMS_DATABASE.length,
  evidenceChecksPerSite: EVIDENCE_CHECKS.length,
  optionalEvidenceChecks: OPTIONAL_EVIDENCE_CHECKS_COUNT,
  highReliability: PLATFORMS_DATABASE.filter((p) => p.reliabilityTier === 'high').length,
  mediumReliability: PLATFORMS_DATABASE.filter((p) => p.reliabilityTier === 'medium').length,
  experimental: PLATFORMS_DATABASE.filter((p) => p.reliabilityTier === 'experimental').length,
} as const;

export const CATEGORY_LABELS: Record<string, { label: string; count: number; desc: string }> = {
  all: { 
    label: 'All Platforms', 
    count: PLATFORMS_DATABASE.length, 
    desc: 'Complete scan across the full project catalog' 
  },
  developer: { 
    label: 'Developer', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'developer').length, 
    desc: 'Code repositories, package indices, & dev forums' 
  },
  social: { 
    label: 'Social & Networks', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'social').length, 
    desc: 'Public social profiles & microblogging' 
  },
  gaming: { 
    label: 'Gaming', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'gaming').length, 
    desc: 'Game platforms, esports, & leaderboards' 
  },
  security: { 
    label: 'Security & PGP', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'security').length, 
    desc: 'Keys, CTF, & bug bounty handles' 
  },
  creative: { 
    label: 'Creative & Audio', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'creative').length, 
    desc: 'Design, portfolios, 3D models, & music' 
  },
  crypto: { 
    label: 'Crypto & Web3', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'crypto').length, 
    desc: 'Wallets & blockchain forums' 
  },
  media: { 
    label: 'Media & Video', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'media').length, 
    desc: 'Video sharing, streaming, & cinema trackers' 
  },
  community: { 
    label: 'Community', 
    count: PLATFORMS_DATABASE.filter(p => p.category === 'community').length, 
    desc: 'Knowledge bases, forums, & hobby apps' 
  }
};

export const UNIFIED_DATABASES = [
  { id: 'core_vector', name: 'Mineiro Username Extractor Core Directory', count: `${PLATFORMS_DATABASE.length}+`, focus: 'Multi-Service Endpoint Directory', badge: 'Active' },
  { id: 'waf_guard', name: 'WAF & Anti-Bot Heuristics', count: 'Active', focus: 'Rate-limit / edge-protection detection and uncertainty flagging', badge: 'Active' },
  { id: 'email_matrix', name: 'Email & MX Recon', count: 'Deep', focus: 'Domain MX, SPF, DMARC & Permutation Analysis', badge: 'Active' },
  { id: 'correlation', name: 'Correlation Engine', count: 'Realtime', focus: 'Cross-Platform Moniker & Vector Linkage Analysis', badge: 'Active' },
  { id: 'async_pipeline', name: 'Async Probing Pipeline', count: 'Concurrent', focus: 'Bounded concurrent HTTP dispatcher', badge: 'Active' },
  { id: 'neural_profile', name: 'Optional AI Synthesis', count: 'AI Engine', focus: 'Optional summary of observed public signals', badge: 'Active' },
];

export const DEMO_PRESETS = [
  {
    target: 'deivsec',
    type: 'username' as const,
    label: 'DeivSec',
    tag: 'Security Analyst'
  },
  {
    target: 'satoshi',
    type: 'username' as const,
    label: 'Satoshi Nakamoto',
    tag: 'Cryptographer'
  },
  {
    target: 'antoniaci',
    type: 'username' as const,
    label: 'Lucas Antoniaci',
    tag: 'OSINT Researcher'
  },
  {
    target: 'octocat',
    type: 'username' as const,
    label: 'Octocat',
    tag: 'Sample Target'
  }
];

// ==========================================
// Modular OSINT Engine: Scope & Fast Presets
// ==========================================

export const TOP_20_PLATFORM_IDS: string[] = [
  'github',
  'twitter',
  'reddit',
  'instagram',
  'tiktok',
  'threads',
  'linkedin',
  'pinterest',
  'telegram',
  'medium',
  'gravatar',
  'steam',
  'twitch',
  'spotify',
  'keybase',
  'youtube',
  'discord',
  'gitlab',
  'devto',
  'hackernews'
];

export const TOP_50_PLATFORM_IDS: string[] = [
  ...TOP_20_PLATFORM_IDS,
  'dockerhub',
  'npm',
  'pypi',
  'bitbucket',
  'codepen',
  'replit',
  'kaggle',
  'snapchat',
  'quora',
  'vimeo',
  'soundcloud',
  'roblox',
  'chess',
  'duolingo',
  'kick',
  'patreon',
  'buymeacoffee',
  'substack',
  'behance',
  'dribbble',
  'artstation',
  'deviantart',
  'flickr',
  'unsplash',
  'producthunt',
  'goodreads',
  'lastfm',
  'letterboxd',
  'huggingface',
  'codesandbox'
];

export const DEFAULT_SCAN_CONFIGS: Record<ScanPreset, ModularScanConfig> = {
  quick: {
    preset: 'quick',
    platformScope: 'top20',
    selectedCategory: 'all',
    concurrency: 10,
    timeoutMs: 2500,
    wafInspectionMode: 'fast',
    wafRetryStrategy: 'none',
    scanDepth: 'fast',
    enableEmailRecon: false,
    enableAutoAiProfile: false,
    enableAccountLinkage: true,
    enableEvidenceChecks: false,
  },
  standard: {
    preset: 'standard',
    platformScope: 'top50',
    selectedCategory: 'all',
    concurrency: 8,
    timeoutMs: 4500,
    wafInspectionMode: 'deep',
    wafRetryStrategy: 'adaptive',
    scanDepth: 'deep',
    enableEmailRecon: true,
    enableAutoAiProfile: false,
    enableAccountLinkage: true,
    enableEvidenceChecks: true,
  },
  deep: {
    preset: 'deep',
    platformScope: 'all',
    selectedCategory: 'all',
    concurrency: 6,
    timeoutMs: 6500,
    wafInspectionMode: 'deep',
    wafRetryStrategy: 'adaptive',
    scanDepth: 'deep',
    enableEmailRecon: true,
    enableAutoAiProfile: false,
    enableAccountLinkage: true,
    enableEvidenceChecks: true,
  },
  email_only: {
    preset: 'email_only',
    platformScope: 'none',
    selectedCategory: 'all',
    concurrency: 8,
    timeoutMs: 2500,
    wafInspectionMode: 'fast',
    wafRetryStrategy: 'none',
    scanDepth: 'fast',
    enableEmailRecon: true,
    enableAutoAiProfile: false,
    enableAccountLinkage: false,
    enableEvidenceChecks: false,
  },
  custom: {
    preset: 'custom',
    platformScope: 'top20',
    selectedCategory: 'all',
    concurrency: 8,
    timeoutMs: 2500,
    wafInspectionMode: 'fast',
    wafRetryStrategy: 'none',
    scanDepth: 'fast',
    enableEmailRecon: true,
    enableAutoAiProfile: false,
    enableAccountLinkage: true,
    enableEvidenceChecks: false,
  },
};

export function getPlatformsForScope(
  scope: PlatformScope,
  category: string = 'all',
  targetType: 'username' | 'email' = 'username'
): Platform[] {
  if (scope === 'none') {
    return [];
  }

  let pool = PLATFORMS_DATABASE;

  // STRICT TARGET CLASSIFICATION:
  // When searching an email, do NOT scan all 1,000+ username-only platforms.
  // Only probe platforms that support email validation ('email' or 'both').
  if (targetType === 'email') {
    pool = pool.filter((p) => p.targetType === 'email' || p.targetType === 'both');
  } else {
    pool = pool.filter((p) => !p.targetType || p.targetType === 'username' || p.targetType === 'both');
  }

  if (scope === 'top20') {
    const top20Set = new Set(TOP_20_PLATFORM_IDS);
    pool = pool.filter((p) => top20Set.has(p.id));
  } else if (scope === 'top50') {
    const top50Set = new Set(TOP_50_PLATFORM_IDS);
    pool = pool.filter((p) => top50Set.has(p.id));
  }

  if (category !== 'all') {
    return pool.filter((p) => p.category === category);
  }

  return pool;
}

export function getUsernamePlatformsCount(): number {
  return PLATFORMS_DATABASE.filter(p => !p.targetType || p.targetType === 'username' || p.targetType === 'both').length;
}

export function getEmailPlatformsCount(): number {
  return PLATFORMS_DATABASE.filter(p => p.targetType === 'email' || p.targetType === 'both').length;
}
