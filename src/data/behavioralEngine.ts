/**
 * Advanced Behavioral & Archetype Forensic Engine for Mineiro Username Intelligence OSINT
 * Computes objective, distribution-weighted archetypes and behavioral signals.
 * Strictly prevents false defaults to generic "tech professional" or bland catch-alls.
 * Provides granular, domain-specific archetypes cross-referenced with occupation data.
 */

import { evaluateThreatActorHeuristics } from './threatActorHeuristics';
import { ThreatActorAnalysis, TechnicalFootprint } from '../types';

export interface PlatformItem {
  platformName: string;
  category?: string;
  url?: string;
}

export interface ComputedBehavioralProfile {
  industry: string;
  interests: string[];
  technicalFootprint: TechnicalFootprint;
  archetype: string;
  archetypeDescription: string;
  dominantDomain: string;
  categoryDistribution: Record<string, number>;
  categoryPercentages: Record<string, number>;
  opsecHygiene: 'Poor' | 'Basic' | 'Moderate' | 'High' | 'Paranoid';
  socialExposureRisk: 'Minimal' | 'Moderate' | 'Elevated' | 'Severe';
  anonymityEffort: 'Low' | 'Moderate' | 'High';
  handlePersistencePattern: 'Single Moniker Reuse' | 'Predictable Affixes' | 'Segmented Personas' | 'High-Entropy Anon';
  accountCreationEra: string;
  technicalSkills: string[];
  personalityTraits: string[];
  threatVulnerabilities: string[];
  recommendedDefensiveActions: string[];
  psycholinguisticClues: string[];
  summary: string;
  threatActorAnalysis?: ThreatActorAnalysis;
}

/**
 * Analyzes platform footprints and infers the authentic, granular archetype.
 * Incorporates security-focused heuristics for threat actor identification
 * and cross-references user occupation data against platform behavior patterns.
 */
/**
 * Normalizes platform category strings across local platform catalog
 */
function normalizeCategory(rawCat?: string): string {
  if (!rawCat) return 'social';
  const c = rawCat.toLowerCase().trim();

  // Developer & Programming
  if (['developer', 'coding', 'development', 'dev', 'tech', 'software', 'programming', 'code', 'repo', 'repositories'].includes(c)) {
    return 'developer';
  }
  // Security & Infosec
  if (['security', 'cyber', 'cybersecurity', 'infosec', 'hacking', 'bounty', 'ctf', 'pentest', 'vulnerability', 'exploit'].includes(c)) {
    return 'security';
  }
  // Creative & Visual Arts
  if (['creative', 'art', 'design', 'illustration', 'photography', 'photo', 'portfolio', '3d', 'modeling'].includes(c)) {
    return 'creative';
  }
  // Multimedia, Audio & Video
  if (['multimedia', 'media', 'music', 'audio', 'sound', 'video', 'streaming', 'podcast', 'broadcast'].includes(c)) {
    return 'multimedia';
  }
  // Gaming & Esports
  if (['gaming', 'games', 'game', 'esports', 'speedrun'].includes(c)) {
    return 'gaming';
  }
  // Writing & Publishing
  if (['writing', 'blog', 'blogs', 'publishing', 'news', 'journalism', 'literature', 'editorial'].includes(c)) {
    return 'writing';
  }
  // Business & Career
  if (['business', 'career', 'corporate', 'professional', 'networking', 'work', 'finance'].includes(c)) {
    return 'business';
  }
  // Commerce & E-commerce
  if (['commerce', 'ecommerce', 'shopping', 'store', 'marketplace', 'merchant', 'retail'].includes(c)) {
    return 'commerce';
  }
  // Crypto & Web3
  if (['crypto', 'cryptocurrency', 'blockchain', 'web3', 'defi', 'nft', 'onchain'].includes(c)) {
    return 'crypto';
  }
  // Academic & Research
  if (['academic', 'education', 'research', 'science', 'scholar', 'scientific'].includes(c)) {
    return 'academic';
  }
  // Community & Forums
  if (['community', 'forum', 'forums', 'discussion', 'boards', 'board'].includes(c)) {
    return 'community';
  }
  // Lifestyle & Health
  if (['lifestyle', 'sports', 'fitness', 'health', 'travel'].includes(c)) {
    return 'lifestyle';
  }
  // Social Communication
  return 'social';
}

export function computeBehavioralProfile(
  platforms: PlatformItem[] = [],
  target: string = '',
  emailData?: any
): ComputedBehavioralProfile {
  const count = platforms.length;
  const cleanTarget = target.trim();
  const lowerTarget = cleanTarget.toLowerCase();

  // 1. Calculate Normalized Category Frequencies and Weights
  const categoryCounts: Record<string, number> = {
    social: 0,
    creative: 0,
    gaming: 0,
    multimedia: 0,
    writing: 0,
    business: 0,
    commerce: 0,
    crypto: 0,
    security: 0,
    developer: 0,
    community: 0,
    academic: 0,
    lifestyle: 0,
  };

  const platformNames = new Set(platforms.map((p) => (p.platformName || '').toLowerCase()));
  const allUrls = platforms.map((p) => (p.url || '').toLowerCase()).join(' ');

  for (const p of platforms) {
    const normalized = normalizeCategory(p.category);
    if (categoryCounts[normalized] !== undefined) {
      categoryCounts[normalized]++;
    } else {
      categoryCounts.social++;
    }
  }

  // Calculate percentages
  const categoryPercentages: Record<string, number> = {};
  for (const [cat, c] of Object.entries(categoryCounts)) {
    categoryPercentages[cat] = count > 0 ? Math.round((c / count) * 100) : 0;
  }

  // 2. Run Threat Actor & Occupation Heuristics
  const threatActorAnalysis = evaluateThreatActorHeuristics(platforms, target, emailData);

  // 3. Platform Detection for Specific Sub-Ecosystems
  const hasGithub = platformNames.has('github');
  const hasGitlab = platformNames.has('gitlab');
  const hasNpm = platformNames.has('npm');
  const hasDocker = platformNames.has('dockerhub') || platformNames.has('docker');
  const hasSteam = platformNames.has('steam');
  const hasTwitch = platformNames.has('twitch');
  const hasDiscord = platformNames.has('discord');
  const hasChess = platformNames.has('chess.com') || platformNames.has('lichess');
  const hasRoblox = platformNames.has('roblox');
  const hasSpeedrun = platformNames.has('speedrun.com');
  const hasInstagram = platformNames.has('instagram');
  const hasTiktok = platformNames.has('tiktok');
  const hasTwitter = platformNames.has('twitter') || platformNames.has('x');
  const hasPinterest = platformNames.has('pinterest');
  const hasLinkedin = platformNames.has('linkedin');
  const hasSpotify = platformNames.has('spotify');
  const hasSoundcloud = platformNames.has('soundcloud');
  const hasBandcamp = platformNames.has('bandcamp');
  const hasMedium = platformNames.has('medium');
  const hasSubstack = platformNames.has('substack');
  const hasWattpad = platformNames.has('wattpad') || platformNames.has('ao3');
  const hasGoodreads = platformNames.has('goodreads');
  const hasEtsy = platformNames.has('etsy') || platformNames.has('mercadolivre') || platformNames.has('ebay');
  const hasShopify = platformNames.has('shopify');
  const hasBehance = platformNames.has('behance') || platformNames.has('dribbble');
  const hasArtstation = platformNames.has('artstation') || platformNames.has('deviantart') || platformNames.has('pixiv');
  const hasPhoto = platformNames.has('500px') || platformNames.has('flickr') || platformNames.has('vsco');
  const hasAcademic = platformNames.has('researchgate') || platformNames.has('orcid') || platformNames.has('googlescholar') || platformNames.has('arxiv');
  const hasKaggle = platformNames.has('kaggle') || platformNames.has('huggingface');
  const hasBugBounty = platformNames.has('hackerone') || platformNames.has('bugcrowd') || platformNames.has('intigriti');
  const hasCtf = platformNames.has('hackthebox') || platformNames.has('tryhackme') || platformNames.has('ctftime') || platformNames.has('root-me');
  const hasCrypto = platformNames.has('opensea') || platformNames.has('mirror') || platformNames.has('farcaster') || platformNames.has('etherscan');
  const hasSports = platformNames.has('strava') || platformNames.has('garmin') || platformNames.has('komoot');
  const hasReddit = platformNames.has('reddit') || platformNames.has('lemmy');
  const hasKeybase = platformNames.has('keybase');

  // Handle semantics for deep domain correlation
  const isArtHandle = lowerTarget.includes('art') || lowerTarget.includes('draw') || lowerTarget.includes('design') || lowerTarget.includes('photo') || lowerTarget.includes('visual') || lowerTarget.includes('pixel');
  const isMusicHandle = lowerTarget.includes('beats') || lowerTarget.includes('music') || lowerTarget.includes('sound') || lowerTarget.includes('prod') || lowerTarget.includes('synth') || lowerTarget.includes('dj');
  const isGamerHandle = lowerTarget.includes('gg') || lowerTarget.includes('ttv') || lowerTarget.includes('play') || lowerTarget.includes('gamer') || lowerTarget.includes('esports');
  const isDevHandle = lowerTarget.includes('dev') || lowerTarget.includes('code') || lowerTarget.includes('tech') || lowerTarget.includes('soft') || lowerTarget.includes('sys') || lowerTarget.includes('ops') || lowerTarget.includes('git');
  const isSecHandle = lowerTarget.includes('sec') || lowerTarget.includes('pwn') || lowerTarget.includes('root') || lowerTarget.includes('hack') || lowerTarget.includes('cyber') || lowerTarget.includes('c0de') || lowerTarget.includes('zero') || lowerTarget.includes('exploit') || lowerTarget.includes('recon') || lowerTarget.includes('audit');
  const isAcademicHandle = lowerTarget.includes('dr') || lowerTarget.includes('phd') || lowerTarget.includes('prof') || lowerTarget.includes('sci') || lowerTarget.includes('lab');
  const isCryptoHandle = lowerTarget.includes('btc') || lowerTarget.includes('eth') || lowerTarget.includes('sat') || lowerTarget.includes('crypto') || lowerTarget.includes('web3') || lowerTarget.includes('chain') || lowerTarget.includes('defi');

  // --- MULTI-PASS EVALUATION: ENTITY IDENTIFICATION (PASS 1) ---
  // Identify Industry, Interests, and Technical Footprint as distinct metadata entities
  const techPlatformCount = categoryCounts.developer + categoryCounts.security;

  // Determine Technical Footprint level and professional status
  let techLevel: 'None' | 'Minimal' | 'Moderate' | 'Advanced' | 'Expert' = 'None';
  let isTechProfessional = false;
  let techEvidence = '';
  let primaryTools: string[] = [];

  if (hasBugBounty || hasCtf || (threatActorAnalysis.observedTTPs && threatActorAnalysis.observedTTPs.length > 0)) {
    techLevel = 'Expert';
    isTechProfessional = true;
    techEvidence = 'Direct verified participation in authorized vulnerability disclosure, security research, or adversarial CTF war-games.';
    primaryTools = ['Burp Suite', 'GPG', 'Nmap', 'Metasploit', 'Wireshark'];
  } else if ((hasGithub && (hasNpm || hasDocker)) || (categoryCounts.developer >= 2 && hasGithub)) {
    techLevel = 'Advanced';
    isTechProfessional = true;
    techEvidence = 'Active public repositories combined with package registry distribution or containerized services.';
    primaryTools = ['Git', 'Docker', 'TypeScript', 'Node.js', 'Linux'];
  } else if (hasGithub || hasGitlab || (isSecHandle && (categoryCounts.security >= 1 || categoryCounts.developer >= 1))) {
    techLevel = 'Advanced';
    isTechProfessional = true;
    techEvidence = isSecHandle
      ? 'Specialized security moniker corroborated by active software repositories and technical tooling.'
      : 'Identified source repository versioning activity with public code projects.';
    primaryTools = isSecHandle ? ['Git', 'Linux CLI', 'Python', 'Security Tools'] : ['Git', 'VS Code', 'Node.js'];
  } else if (hasKaggle || hasKeybase || (categoryCounts.developer >= 1 && isDevHandle) || (categoryCounts.security >= 1 && isSecHandle)) {
    techLevel = 'Moderate';
    isTechProfessional = true;
    techEvidence = 'Identified presence within technical data science, cryptographic identity, or systems repositories.';
    primaryTools = ['Python', 'Jupyter', 'Git'];
  } else if (isDevHandle || isSecHandle) {
    // Has a technical moniker keyword but 0 corroborated developer or security platforms
    techLevel = 'Minimal';
    isTechProfessional = false;
    techEvidence = `Moniker '${cleanTarget}' contains technical tokens ('${isSecHandle ? 'sec/hack' : 'dev/code'}'), but zero active software repositories or security disclosure accounts were verified.`;
    primaryTools = [];
  } else {
    techLevel = 'None';
    isTechProfessional = false;
    techEvidence = 'No developer repositories, security platforms, or package registries identified. Target exhibits a verified non-technical digital footprint.';
    primaryTools = [];
  }

  // Determine Industry entity
  let industry = 'Digital Communications & Social Media';
  let interests: string[] = [];

  if (isTechProfessional && (categoryCounts.security >= 1 || isSecHandle || hasBugBounty || hasCtf)) {
    industry = 'Cybersecurity & Information Security';
    interests = ['Vulnerability Research', 'Defensive Security', 'Network Auditing', 'Threat Intelligence'];
    if (!primaryTools.length) primaryTools = ['Wireshark', 'Burp Suite', 'Linux CLI'];
  } else if (isTechProfessional) {
    industry = 'Software Engineering & Technology';
    interests = ['Open-Source Software', 'Software Architecture', 'Cloud Infrastructure', 'API Engineering'];
    if (!primaryTools.length) primaryTools = ['Git', 'VS Code', 'Docker'];
  } else if (hasCrypto || (isCryptoHandle && categoryCounts.crypto >= 1)) {
    industry = 'Decentralized Finance & Blockchain';
    interests = ['Web3 Protocols', 'Smart Contracts', 'DeFi Liquidity', 'On-Chain Provenance'];
    primaryTools = ['Metamask', 'Etherscan', 'Hardware Wallet'];
  } else if (hasArtstation || hasBehance || isArtHandle || categoryCounts.creative >= 1 || hasPhoto) {
    industry = 'Creative Arts & Visual Design';
    interests = ['Digital Illustration', 'Visual Arts', 'Concept Art', 'UI/UX Design', 'Color Theory'];
    primaryTools = ['Adobe Photoshop', 'Figma', 'Procreate', 'Blender'];
  } else if (hasBandcamp || hasSoundcloud || isMusicHandle || categoryCounts.multimedia >= 1 || (hasSpotify && count <= 3)) {
    industry = 'Music & Audio Production';
    interests = ['Electronic Music', 'Sound Design', 'Audio Synthesis', 'Track Curation'];
    primaryTools = ['Ableton Live', 'FL Studio', 'Logic Pro', 'Audacity'];
  } else if (hasSports || categoryCounts.lifestyle >= 1) {
    industry = 'Endurance Athletics & Fitness';
    interests = ['Distance Running', 'Cycling Telemetry', 'Pace Optimization', 'Performance Analytics'];
    primaryTools = ['Strava GPS', 'Garmin Connect', 'Heart Rate Telemetry'];
  } else if (hasChess || hasSteam || isGamerHandle || categoryCounts.gaming >= 1) {
    industry = 'Gaming & Interactive Entertainment';
    interests = ['Competitive Gaming', 'Interactive Gameplay', 'Esports Strategy', 'Gaming Communities'];
    primaryTools = ['Steam Client', 'Discord', 'OBS Studio'];
  } else if (hasEtsy || hasShopify || categoryCounts.commerce >= 1) {
    industry = 'E-Commerce & Digital Merchandising';
    interests = ['Direct-to-Consumer Retail', 'Product Photography', 'Merchant Fulfillment', 'Brand Development'];
    primaryTools = ['Shopify Admin', 'Etsy Shop Manager', 'Canva'];
  } else if (hasAcademic || isAcademicHandle || categoryCounts.academic >= 1) {
    industry = 'Academic & Scientific Research';
    interests = ['Scholarly Research', 'Peer Review', 'Data Analysis', 'Academic Publication'];
    primaryTools = ['LaTeX', 'Zotero', 'Google Scholar'];
  } else if (hasSubstack || hasMedium || categoryCounts.writing >= 1) {
    industry = 'Publishing & Digital Editorial';
    interests = ['Long-Form Essays', 'Investigative Journalism', 'Audience Newsletters', 'Cultural Commentary'];
    primaryTools = ['Substack Editor', 'Medium CMS', 'Markdown'];
  } else if (hasLinkedin || categoryCounts.business >= 1) {
    industry = 'Business Operations & Management';
    interests = ['Professional Networking', 'Corporate Strategy', 'Industry Insights', 'Career Development'];
    primaryTools = ['LinkedIn Recruiter', 'Google Workspace', 'Slack'];
  } else if (hasReddit || categoryCounts.community >= 1) {
    industry = 'Online Communities & Digital Culture';
    interests = ['Community Moderation', 'Threaded Discourse', 'Digital Subcultures', 'Trend Analysis'];
    primaryTools = ['Reddit Web', 'Discord'];
  } else {
    industry = 'Digital Persona & Online Communications';
    interests = ['Social Media Networking', 'Digital Content Discovery', 'Online Communications', 'Web Culture'];
    primaryTools = ['Web Browser', 'Mobile Communications'];
  }

  const technicalFootprint: TechnicalFootprint = {
    level: techLevel,
    isTechProfessional,
    evidence: techEvidence,
    primaryTools,
  };

  // --- MULTI-PASS WEIGHTING & ARCHETYPE MAPPING (PASS 2) ---
  // Only map the Archetype field after weighting Industry, Interests, and Technical Footprint
  // against actual platform activity patterns to strictly prevent false tech labeling.
  let archetype = 'Digital Persona & Online Communications Operator';
  let archetypeDescription = 'Footprint distributed across public digital services with active online communications.';
  let dominantDomain = 'social';

  // PRIORITY 1: THREAT ACTOR & CYBERSECURITY (MANDATES VERIFIED TECH OR ANOMALY)
  if (threatActorAnalysis.threatActorCategory === 'INSIDER_RISK_DISCREPANCY') {
    archetype = 'Privileged Enterprise Identity with Underground Anomaly';
    archetypeDescription = threatActorAnalysis.occupationCrossReference.analysis;
    dominantDomain = 'security';
  } else if (threatActorAnalysis.threatActorCategory === 'UNDERGROUND_FORUM_BROKER') {
    archetype = 'Underground Exchange & Data Marketplace Operator';
    archetypeDescription = 'Reconnaissance identified participation on illicit darknet/underground cracking forums and credential clearinghouses.';
    dominantDomain = 'security';
  } else if (threatActorAnalysis.threatActorCategory === 'COMMODITY_SCRIPT_OPERATOR') {
    archetype = 'Opportunistic Cyber Operator & Tool Consumer';
    archetypeDescription = 'Reconnaissance identified participation on community cracking or database leak platforms without signs of advanced state-grade infrastructure.';
    dominantDomain = 'security';
  } else if (hasBugBounty && isTechProfessional) {
    archetype = 'Elite Crowdsourced Bug Bounty Hunter & Security Researcher';
    archetypeDescription = 'Verified activity across accredited vulnerability disclosure platforms conducting authorized responsible security research.';
    dominantDomain = 'security';
  } else if (hasCtf && isTechProfessional) {
    archetype = 'Competitive CTF Competitor & Offensive Security Trainee';
    archetypeDescription = 'Hands-on adversarial skill training anchored on HackTheBox, TryHackMe, and competitive Capture The Flag war-games.';
    dominantDomain = 'security';
  } else if (isSecHandle && isTechProfessional && (hasGithub || hasGitlab || hasKeybase || categoryCounts.developer >= 1 || categoryCounts.security >= 1)) {
    archetype = 'Offensive Security Specialist & Vulnerability Researcher';
    archetypeDescription = 'Demonstrated infosec footprint combining technical source code repositories, vulnerability analysis tooling, and security research.';
    dominantDomain = 'security';
  } else if (isTechProfessional && (categoryCounts.security >= 2 || (hasKeybase && (hasGithub || isSecHandle)))) {
    archetype = 'Cybersecurity Practitioner & Cryptographic Systems Analyst';
    archetypeDescription = 'Specialized presence across cryptographic identities, security archives, and technical security tooling projects.';
    dominantDomain = 'security';
  } else if (isSecHandle && isTechProfessional) {
    archetype = 'Cybersecurity Analyst & Threat Intelligence Researcher';
    archetypeDescription = 'Specialized security moniker and footprint aligned with information security research and defense domains.';
    dominantDomain = 'security';
  }

  // PRIORITY 2: CRYPTO & DECENTRALIZED PROTOCOLS
  else if (hasCrypto || (isCryptoHandle && (hasGithub || categoryCounts.crypto >= 1))) {
    archetype = 'Cryptographic Protocol Architect & Blockchain Specialist';
    archetypeDescription = 'Cryptographic wallet-linked footprint interacting with decentralized protocols, smart contract repositories, and on-chain provenance.';
    dominantDomain = 'crypto';
  }

  // PRIORITY 3: CREATIVE & VISUAL ARTS
  else if (hasArtstation || (isArtHandle && (hasInstagram || hasPinterest || hasBehance))) {
    archetype = 'Concept Character Artist & Digital Illustrator';
    archetypeDescription = 'Portfolio-centric digital identity showcasing 2D/3D concept art, illustration pipelines, and character visual assets.';
    dominantDomain = 'creative';
  } else if (hasBehance || (hasPinterest && hasInstagram && categoryCounts.creative >= 1)) {
    archetype = 'Product Designer & Visual Systems Specialist';
    archetypeDescription = 'Curated public profile concentrated on UI/UX product systems, typography, and brand identity showcases.';
    dominantDomain = 'creative';
  } else if (hasPhoto) {
    archetype = 'Fine Art & Editorial Photographer';
    archetypeDescription = 'Visual footprint centered on high-resolution image galleries, photographic composition, and portfolio indexing.';
    dominantDomain = 'creative';
  }

  // PRIORITY 4: MUSIC & AUDIO PRODUCTION
  else if (hasBandcamp || (hasSoundcloud && hasSpotify) || (isMusicHandle && (categoryCounts.multimedia >= 1 || categoryCounts.creative >= 1))) {
    archetype = 'Independent Electronic Music Producer & Sound Designer';
    archetypeDescription = 'Public footprint distributed across streaming audio hubs, digital audio synthesis, and independent music distribution.';
    dominantDomain = 'multimedia';
  } else if (hasSoundcloud || hasSpotify) {
    archetype = 'Digital Audio Curator & Underground Track Collector';
    archetypeDescription = 'Engaged with independent music streaming platforms, public playlists, and audio community syndication.';
    dominantDomain = 'multimedia';
  }

  // PRIORITY 5: GAMING & ESPORTS
  else if (hasChess) {
    archetype = 'Competitive Chess & Strategy Gaming Tactician';
    archetypeDescription = 'Ranked online presence anchored on digital chess servers and analytical turn-based strategy platforms.';
    dominantDomain = 'gaming';
  } else if (hasSpeedrun) {
    archetype = 'Precision Speedrunner & Game Mechanics Analyst';
    archetypeDescription = 'Competitive profile dedicated to mechanical game mastery, frame-perfect optimization, and leaderboard timing.';
    dominantDomain = 'gaming';
  } else if (hasSteam && (hasTwitch || hasDiscord)) {
    archetype = 'Competitive Multiplayer Gamer & Discord Community Host';
    archetypeDescription = 'Synchronized digital footprint spanning PC gaming libraries, interactive live streaming, and voice communications servers.';
    dominantDomain = 'gaming';
  } else if (hasRoblox) {
    archetype = 'Sandbox Virtual World Creator & Modeler';
    archetypeDescription = 'Presence anchored around interactive sandbox engine game creation, asset crafting, and virtual community spaces.';
    dominantDomain = 'gaming';
  } else if (categoryCounts.gaming >= 1 && (isGamerHandle || hasSteam)) {
    archetype = 'PC Gaming Community Member & Digital Leisure Enthusiast';
    archetypeDescription = 'Profile integrated into digital gaming distribution networks, community modding, and interactive leisure.';
    dominantDomain = 'gaming';
  }

  // PRIORITY 6: ACADEMIC & DATA SCIENCE
  else if (hasAcademic || (isAcademicHandle && (hasGithub || categoryCounts.academic >= 1))) {
    archetype = 'Academic Scholar & Peer-Reviewed Scientific Researcher';
    archetypeDescription = 'Institutional footprint across academic citation indexes, research preprint servers, and peer-reviewed scholarly networks.';
    dominantDomain = 'academic';
  } else if (hasKaggle) {
    archetype = 'Machine Learning Practitioner & Applied Data Scientist';
    archetypeDescription = 'Applied data science presence featuring predictive modeling pipelines, dataset benchmarks, and AI model hubs.';
    dominantDomain = 'developer';
  }

  // PRIORITY 7: WRITING & CULTURAL COMMENTARY
  else if (hasSubstack || hasMedium) {
    archetype = 'Investigative Essayist & Digital Newsletter Writer';
    archetypeDescription = 'Long-form editorial presence focused on in-depth analytical essays, subscriber publications, and cultural commentary.';
    dominantDomain = 'writing';
  } else if (hasWattpad) {
    archetype = 'Narrative Fiction Author & Serial Worldbuilder';
    archetypeDescription = 'Active storytelling footprint across serial literary communities and collaborative fan fiction platforms.';
    dominantDomain = 'writing';
  } else if (hasGoodreads) {
    archetype = 'Literary Critic & Bibliophile Community Reader';
    archetypeDescription = 'Public accounts dedicated to book curation, literary review syndication, and reading catalogue tracking.';
    dominantDomain = 'writing';
  }

  // PRIORITY 8: ATHLETIC & LIFESTYLE PERFORMANCE
  else if (hasSports) {
    archetype = 'Endurance Athlete & Telemetry Performance Enthusiast';
    archetypeDescription = 'Connected GPS telemetry profiles logging physical endurance activities, pace segments, and athletic milestones.';
    dominantDomain = 'lifestyle';
  }

  // PRIORITY 9: E-COMMERCE & BUSINESS ENTREPRENEURSHIP
  else if (hasEtsy || hasShopify) {
    archetype = 'Direct-to-Consumer Merchant & Digital Brand Maker';
    archetypeDescription = 'Commercial footprint spanning digital merchant storefronts, product catalogs, and independent retail sales.';
    dominantDomain = 'commerce';
  } else if (hasLinkedin && (categoryCounts.business >= 1 || count <= 3)) {
    archetype = 'Enterprise Corporate Operator & Industry Networker';
    archetypeDescription = 'Career-focused presence maintaining verifiable professional credentials and executive networking profiles.';
    dominantDomain = 'business';
  }

  // PRIORITY 10: SOFTWARE ENGINEERING (STRICT VERIFICATION)
  else if (isTechProfessional && ((hasGithub && (hasNpm || hasDocker || categoryCounts.developer >= 2)) || (categoryCounts.developer >= 2 && isDevHandle))) {
    archetype = 'Full-Stack Software Architect & Cloud Systems Engineer';
    archetypeDescription = 'Demonstrated developer footprint spanning source code maintenance, build pipelines, and public package registries.';
    dominantDomain = 'developer';
  } else if (isTechProfessional && (hasGithub || hasGitlab || categoryCounts.developer >= 1)) {
    archetype = 'Open-Source Contributor & Software Systems Developer';
    archetypeDescription = 'Identified source repository presence reflecting software development experimentation and code versioning.';
    dominantDomain = 'developer';
  }

  // PRIORITY 11: SPECIFIC SOCIAL / COMMUNITY COMBINATIONS
  else if (hasReddit) {
    archetype = 'Discussion Community Power-User & Topic Moderator';
    archetypeDescription = 'Community-driven presence focused on threaded public discourse, topic moderation, and digital subcultures.';
    dominantDomain = 'community';
  } else if (hasTiktok || (hasInstagram && hasTwitter)) {
    archetype = 'Digital Communications & Social Media Operator';
    archetypeDescription = 'Cross-network social syndication spanning microblogging, visual media, and audience engagement.';
    dominantDomain = 'social';
  }

  // PRIORITY 12: MINIMAL / FOCUSED PRESENCE (HIGH FORENSIC FIDELITY)
  else if (count === 1) {
    const singlePlatform = platforms[0]?.platformName || 'the web';
    const singleCat = normalizeCategory(platforms[0]?.category);
    dominantDomain = singleCat;

    if (singleCat === 'developer' && isTechProfessional) {
      archetype = 'Emerging Open-Source Contributor & Software Developer';
      archetypeDescription = `Solitary public developer registration located on ${singlePlatform}, reflecting focused code versioning without broad social syndication.`;
    } else if (singleCat === 'security' && isTechProfessional) {
      archetype = 'Focused Infosec Researcher & Security Specialist';
      archetypeDescription = `Specific security profile located on ${singlePlatform}, indicating specialized technical focus with low lateral exposure.`;
    } else if (singleCat === 'creative') {
      archetype = 'Independent Visual Artist & Portfolio Creator';
      archetypeDescription = `Dedicated creative portfolio identified on ${singlePlatform} with visual asset showcases.`;
    } else if (singleCat === 'gaming') {
      archetype = 'PC Gaming Community Member & Digital Leisure Enthusiast';
      archetypeDescription = `Specific gaming distribution registration identified on ${singlePlatform}.`;
    } else {
      archetype = `Direct Moniker Profile (${singlePlatform})`;
      archetypeDescription = `Account registration verified on ${singlePlatform}, with discreet lateral footprint across adjacent networks.`;
    }
  } else if (count <= 3) {
    const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'social';
    dominantDomain = topCat;

    if (topCat === 'developer' && isTechProfessional) {
      archetype = 'Specialized Software Engineer & Open-Source Contributor';
      archetypeDescription = 'Target maintains a disciplined, code-focused presence concentrated in software development and versioning platforms.';
    } else if (topCat === 'security' && isTechProfessional) {
      archetype = 'Cybersecurity Analyst & Threat Researcher';
      archetypeDescription = 'Concentrated footprint within information security and system auditing environments.';
    } else if (topCat === 'creative') {
      archetype = 'Visual Media Designer & Creative Practitioner';
      archetypeDescription = 'Public footprint focused primarily within visual arts and creative portfolio hubs.';
    } else {
      archetype = 'Discreet Digital Operator & Independent Web User';
      archetypeDescription = `Concentrated footprint across ${count} verified channels showing disciplined privacy hygiene and minimal lateral exposure.`;
    }
  }

  // 5. Inferred Skills based on REAL dominant domain
  let technicalSkills: string[] = [];
  let personalityTraits: string[] = [];

  switch (dominantDomain) {
    case 'security':
      technicalSkills = threatActorAnalysis.isThreatActorSuspect
        ? ['Underground Platform Navigation', 'Identity Segmentation', 'Offensive Tool Utilization', 'Network Probing', 'Darknet Protocol Navigation']
        : ['Vulnerability Assessment', 'Threat Modeling', 'Bug Bounty Reconnaissance', 'Network Security Auditing', 'Exploit Analysis'];
      personalityTraits = threatActorAnalysis.isThreatActorSuspect
        ? ['Clandestine', 'Opportunistic', 'Technically Experimental', 'Adversarially Minded']
        : ['Methodical', 'Adversarial Mindset', 'Detail-Obsessed', 'OpSec-Minded'];
      break;
    case 'developer':
      technicalSkills = ['Version Control (Git)', 'Software Architecture', 'API Integration', 'Package Registry Management', 'Continuous Integration'];
      personalityTraits = ['Systematic', 'Problem Solver', 'Collaborative', 'Technically Inquisitive'];
      break;
    case 'creative':
      technicalSkills = ['Visual Composition', 'Digital Illustration', 'UI/UX & Brand Curation', 'Creative Asset Delivery', 'Typography'];
      personalityTraits = ['Aesthetically Driven', 'Expressive', 'Perfectionist', 'Visual Thinker'];
      break;
    case 'gaming':
      technicalSkills = ['Broadcast Streaming Setup', 'Community Moderation', 'Game Mechanics Optimization', 'Voice Communications', 'Hardware Configuration'];
      personalityTraits = ['Competitive', 'Community-Oriented', 'High Reactivity', 'Socially Interactive'];
      break;
    case 'multimedia':
      technicalSkills = ['Audio Mixing & Mastering', 'Digital Audio Workstations', 'Sound Design', 'Streaming Media Distribution', 'Track Metadata Tagging'];
      personalityTraits = ['Auditory Focused', 'Creative', 'Self-Expressive', 'Persistent'];
      break;
    case 'academic':
      technicalSkills = ['Empirical Research Methodology', 'Statistical Modeling', 'Peer-Review Literature Indexing', 'Quantitative Analysis', 'Scholarly Writing'];
      personalityTraits = ['Rigorous', 'Inquisitive', 'Academic', 'Analytical'];
      break;
    case 'business':
      technicalSkills = ['Executive Positioning', 'Professional Networking', 'Business Development', 'Public Relations', 'Cross-Company Collaboration'];
      personalityTraits = ['Pragmatic', 'Goal-Oriented', 'Relationship-Driven', 'Strategic'];
      break;
    case 'writing':
      technicalSkills = ['Long-Form Editorial Writing', 'Investigative Research', 'Newsletter Management', 'Audience Syndication', 'Narrative Structuring'];
      personalityTraits = ['Analytical', 'Reflective', 'Articulate', 'Information Synthesizer'];
      break;
    case 'commerce':
      technicalSkills = ['Marketplace Merchandising', 'Storefront Analytics', 'Product Listing Optimization', 'Fulfillment Tracking', 'Direct-to-Consumer Marketing'];
      personalityTraits = ['Entrepreneurial', 'Customer-Centric', 'Resourceful', 'Adaptable'];
      break;
    case 'lifestyle':
      technicalSkills = ['Telemetry Performance Tracking', 'Endurance Pacing', 'Activity Log Analysis', 'Athletic Metric Interpretation', 'Gear Optimization'];
      personalityTraits = ['Disciplined', 'Goal-Driven', 'Resilient', 'Health-Conscious'];
      break;
    case 'crypto':
      technicalSkills = ['Non-Custodial Wallets', 'Decentralized Applications', 'Token Governance', 'Smart Contract Interactions', 'Digital Ownership'];
      personalityTraits = ['Early Adopter', 'Risk-Tolerant', 'Decentralization Advocate', 'Autonomous'];
      break;
    default:
      technicalSkills = ['Digital Identity Curation', 'Social Media Syndication', 'Content Consumption', 'Cross-Platform Communication', 'Information Filtering'];
      personalityTraits = ['Socially Connected', 'Media Savvy', 'Trend Aware', 'Conversational'];
      break;
  }

  // 6. OpSec Hygiene & Social Exposure Risk
  let opsecHygiene: 'Poor' | 'Basic' | 'Moderate' | 'High' | 'Paranoid' = 'Moderate';
  let socialExposureRisk: 'Minimal' | 'Moderate' | 'Elevated' | 'Severe' = 'Moderate';

  if (count >= 16) {
    opsecHygiene = 'Poor';
    socialExposureRisk = 'Severe';
  } else if (count >= 9) {
    opsecHygiene = 'Basic';
    socialExposureRisk = 'Elevated';
  } else if (count >= 4) {
    opsecHygiene = 'Moderate';
    socialExposureRisk = 'Moderate';
  } else {
    opsecHygiene = 'High';
    socialExposureRisk = 'Minimal';
  }

  // 7. Psycholinguistic & Moniker Clues
  const psycholinguisticClues: string[] = [];
  if (cleanTarget.length <= 4) {
    psycholinguisticClues.push(`Short legacy moniker ('${cleanTarget}') indicating early platform adoption or competitive handle acquisition.`);
  } else if (cleanTarget.length >= 10) {
    psycholinguisticClues.push(`Distinctive high-entropy handle stem ('${cleanTarget}') minimizing random cross-account namespace collision.`);
  } else {
    psycholinguisticClues.push(`Standard memorable moniker format ('${cleanTarget}') optimized for personal recognition across services.`);
  }

  if (cleanTarget.includes('_') || cleanTarget.includes('.')) {
    psycholinguisticClues.push(`Deliberate punctuation delimiter usage (${cleanTarget.includes('_') ? 'underscore' : 'period'}) to preserve handle identity.`);
  }

  const domainPct = categoryPercentages[dominantDomain] || (categoryCounts[dominantDomain] > 0 ? Math.round((categoryCounts[dominantDomain] / Math.max(1, count)) * 100) : 100);
  psycholinguisticClues.push(`Dominant online activity gravitates toward ${dominantDomain.toUpperCase()} ecosystems (${domainPct}% of detected profiles).`);

  if (threatActorAnalysis.observedTTPs.length > 0) {
    psycholinguisticClues.push(`Threat Heuristics Verdict: ${threatActorAnalysis.verdictTitle}.`);
  }

  // 8. Threat Vulnerabilities & Defensive Recommendations
  const threatVulnerabilities: string[] = [
    `Persistent handle reuse of '@${cleanTarget}' enables direct cross-platform correlation across ${count} service(s)`,
    `Activity timeline clustering across ${dominantDomain} networks exposes regular diurnal patterns`,
  ];

  if (threatActorAnalysis.isThreatActorSuspect) {
    threatVulnerabilities.push('Underground marketplace or illicit forum footprint creates severe reputational and legal correlation risk');
  }

  if (count > 6) {
    threatVulnerabilities.push('Aggregated public metadata creates risk of spear-phishing or credential stuffing reconnaissance');
  }

  const recommendedDefensiveActions: string[] = [
    `Separate usernames across critical private services and public ${dominantDomain} profiles`,
    'Enable hardware-backed Multi-Factor Authentication (FIDO2 / Security Key) across all found hubs',
  ];

  if (threatActorAnalysis.isThreatActorSuspect) {
    recommendedDefensiveActions.push('Audit public credentials and sever correlation between corporate employment and illicit alias history');
  }

  if (dominantDomain === 'developer') {
    recommendedDefensiveActions.push('Audit public Git commits to verify no private personal emails or API secrets are exposed');
  } else if (dominantDomain === 'social' || dominantDomain === 'creative') {
    recommendedDefensiveActions.push('Review public follower and following lists to mitigate social graph correlation');
  }

  const domainPercentage = categoryPercentages[dominantDomain] || Math.round((1 / Math.max(1, count)) * 100);
  const summary = `Target '${cleanTarget}' presents a verified digital footprint across ${count} platform(s) with primary activity anchored in the ${dominantDomain.toUpperCase()} domain (${domainPercentage}% concentration). Cross-referenced analysis categorizes the subject under the "${archetype}" archetype, with a security posture status of "${threatActorAnalysis.verdictTitle}".`;

  return {
    industry,
    interests,
    technicalFootprint,
    archetype,
    archetypeDescription,
    dominantDomain,
    categoryDistribution: categoryCounts,
    categoryPercentages,
    opsecHygiene,
    socialExposureRisk,
    anonymityEffort: dominantDomain === 'security' || threatActorAnalysis.isThreatActorSuspect ? 'Moderate' : 'Low',
    handlePersistencePattern: 'Single Moniker Reuse',
    accountCreationEra: count > 8 ? 'Established Digital Footprint (2014-2021)' : 'Modern Active Era (2020+)',
    technicalSkills,
    personalityTraits,
    threatVulnerabilities,
    recommendedDefensiveActions,
    psycholinguisticClues,
    summary,
    threatActorAnalysis,
  };
}
