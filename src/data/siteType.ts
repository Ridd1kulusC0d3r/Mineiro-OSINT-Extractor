import type { Category, Platform } from '../types';

/**
 * Site type shown under each platform in the results table and counted by /api/registry/stats (bySiteType).
 *
 * The catalog category is the starting point: every category has a default type, and the name, description and
 * URL may only refine it to a type that makes sense for that category. Keywords match whole words (or a word
 * prefix), never a fragment inside another word. The previous version matched raw substrings across all
 * categories, so "digital" hit "git" (Spotify and Steam became developer platforms) and any "video" in the
 * description won over the category (Instagram and TikTok became video streaming). Baseline defect 13.
 */
export const SITE_TYPES = [
  'developer_platform',
  'package_registry',
  'security_research',
  'social_network',
  'professional',
  'community_forum',
  'publishing_media',
  'entertainment_media',
  'video_streaming',
  'music_audio',
  'photo_media',
  'creative_portfolio',
  'gaming',
  'crypto_web3',
  'finance_payments',
] as const;

export type SiteType = (typeof SITE_TYPES)[number];

/** Checked in this order; the first rule allowed for the category that matches wins. */
const RULES: ReadonlyArray<readonly [SiteType, RegExp]> = [
  ['package_registry', /\bpackages?\b|\bregistr(y|ies)\b|\bnpm\b|\bpypi\b|\brubygems\b|\bnuget\b|\bcrates?\b|\bcomposer\b|\bgems?\b/],
  ['security_research', /\bsecurity\b|\bctf\b|\bbug bount|\bhack(er|ers|ing)?\b|\binfosec\b|\bpgp\b|\bkeybase\b|\bvulnerab|\bmalware\b/],
  ['crypto_web3', /\bcrypto|\bblockchain|\bwallets?\b|\bweb3\b|\bbitcoin|\bethereum|\bnfts?\b|\bdefi\b|\btokens?\b|\bton\b|\bdecentrali[sz]ed\b|\bcoins?\b/],
  ['finance_payments', /\bfinanc|\bpayments?\b|\bdonat|\btips?\b|\binvest|\btrading\b|\bremittance\b|\bescrow\b|\bbank/],
  ['music_audio', /\bmusic|\baudio\b|\bsound|\bbands?\b|\bpodcasts?\b|\bplaylists?\b|\bsongs?\b|\bdj\b/],
  ['photo_media', /\bphoto|\bimages?\b|\bgifs?\b|\bpictures?\b|\bflickr\b/],
  ['video_streaming', /\bvideos?\b|\bstream(s|ing|er|ers)?\b|\blive ?stream|\bbroadcast|\bwebcam|\bcams?\b/],
  ['professional', /\bprofessional\b|\bcareers?\b|\bjobs?\b|\blinkedin\b|\bresumes?\b|\brecruit/],
  ['publishing_media', /\bnews\b|\bblog|\bpublish(ing|er|ers)?\b|\bwriters?\b|\bjournal|\bmagazines?\b|\barticles?\b|\bbooks?\b|\blibrary\b|\bdocuments?\b/],
  ['community_forum', /\bforums?\b|\bcommunity\b|\bdiscussions?\b|\bboards?\b|\bq ?& ?a\b|\baggregat/],
  ['social_network', /\bsocial (network|media|platform)|\bmicroblog|\bdating\b/],
];

/** Default type of each category and the types its entries may be refined to. */
const BY_CATEGORY: Record<Category, { fallback: SiteType; refine: readonly SiteType[] }> = {
  developer: { fallback: 'developer_platform', refine: ['package_registry', 'security_research', 'professional', 'publishing_media', 'community_forum'] },
  social: { fallback: 'social_network', refine: ['professional', 'publishing_media', 'community_forum'] },
  gaming: { fallback: 'gaming', refine: [] },
  security: { fallback: 'security_research', refine: [] },
  creative: { fallback: 'creative_portfolio', refine: ['music_audio', 'photo_media', 'video_streaming', 'publishing_media'] },
  crypto: { fallback: 'crypto_web3', refine: ['crypto_web3', 'finance_payments'] },
  community: { fallback: 'community_forum', refine: ['professional', 'publishing_media', 'social_network'] },
  media: { fallback: 'entertainment_media', refine: ['music_audio', 'photo_media', 'video_streaming', 'publishing_media'] },
};

export function inferSiteType(platform: Pick<Platform, 'name' | 'description' | 'urlPattern' | 'category'>): SiteType {
  const { fallback, refine } = BY_CATEGORY[platform.category] ?? { fallback: 'community_forum', refine: [] };
  const text = `${platform.name} ${platform.description || ''} ${platform.urlPattern}`.toLowerCase();
  for (const [type, pattern] of RULES) {
    if (refine.includes(type) && pattern.test(text)) return type;
  }
  return fallback;
}
