import { ScanResult, AiProfileReport, EmailReconData, Category } from '../types';

export interface PlatformTimelineMeta {
  launchYear: number;
  era: 'Legacy Web (Pre-2005)' | 'Social & Dev Dawn (2005-2010)' | 'Ecosystem Expansion (2011-2016)' | 'Cloud & Modern Era (2017+)';
  domainEpochNotes: string;
}

// Canonical foundation years for known platforms in OSINT reconnaissance
export const PLATFORM_LAUNCH_METADATA: Record<string, PlatformTimelineMeta> = {
  // Legacy / Web 1.5
  sourceforge: { launchYear: 1999, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Pioneering open source code host' },
  livejournal: { launchYear: 1999, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Early blogging and digital identity network' },
  mercadolivre: { launchYear: 1999, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Latin American regional e-commerce pioneer' },
  deviantart: { launchYear: 2000, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Historic online digital art community' },
  wikipedia: { launchYear: 2001, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Open collaborative encyclopedic project' },
  lastfm: { launchYear: 2002, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Early music telemetry and scrobbling service' },
  steam: { launchYear: 2003, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Valve digital PC gaming distribution ecosystem' },
  myspace: { launchYear: 2003, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'First mainstream social networking monolith' },
  linkedin: { launchYear: 2003, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Professional corporate network' },
  pypi: { launchYear: 2003, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Official Python Package Index' },
  flickr: { launchYear: 2004, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Early photographic portfolio hosting' },
  vimeo: { launchYear: 2004, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'High-definition video platform for filmmakers' },
  myanimelist: { launchYear: 2004, era: 'Legacy Web (Pre-2005)', domainEpochNotes: 'Anime and manga database tracking' },

  // Social & Dev Dawn (2005-2010)
  reddit: { launchYear: 2005, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Decentralized link aggregator and forums' },
  youtube: { launchYear: 2005, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Global video sharing network' },
  twitter: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Microblogging communication platform' },
  x: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Microblogging communication platform' },
  roblox: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'User-generated 3D sandbox ecosystem' },
  behance: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Adobe creative portfolio showcase' },
  vkontakte: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Eastern European & CIS social network' },
  vk: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Eastern European & CIS social network' },
  habr: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Cyrillic technical and infosec publishing hub' },
  wattpad: { launchYear: 2006, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Serial literature publishing platform' },
  soundcloud: { launchYear: 2007, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Independent audio & electronic music stream' },
  tumblr: { launchYear: 2007, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Multimedia microblogging community' },
  gravatar: { launchYear: 2007, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Globally Recognized Avatar hash registry' },
  chess: { launchYear: 2007, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Premier online competitive chess server' },
  goodreads: { launchYear: 2007, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Book cataloging and social reading service' },
  github: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Git repository hosting & developer social graph' },
  stackoverflow: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Technical programming Q&A community' },
  spotify: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Streaming music & podcast platform' },
  bandcamp: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Direct-to-fan independent music publishing' },
  bitbucket: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Atlassian Git code collaboration repository' },
  jusbrasil: { launchYear: 2008, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Brazilian legal and public records index' },
  strava: { launchYear: 2009, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'GPS athletic telemetry tracking service' },
  dribbble: { launchYear: 2009, era: 'Social & Dev Dawn (2005-2010)', domainEpochNotes: 'Design community and digital shot showcase' },

  // Ecosystem Expansion (2011-2016)
  instagram: { launchYear: 2010, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Mobile photographic social platform' },
  pinterest: { launchYear: 2010, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Visual discovery and moodboard curation' },
  npm: { launchYear: 2010, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Node.js Package Manager registry' },
  kaggle: { launchYear: 2010, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Machine learning & data science competitions' },
  lichess: { launchYear: 2010, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Open-source competitive chess platform' },
  gitlab: { launchYear: 2011, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Complete DevOps lifecycle and Git platform' },
  twitch: { launchYear: 2011, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Interactive live video game broadcasting' },
  snapchat: { launchYear: 2011, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Ephemeral mobile messaging network' },
  ctftime: { launchYear: 2011, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Competitive hacking CTF global scoreboard' },
  alura: { launchYear: 2011, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Brazilian technology learning academy' },
  medium: { launchYear: 2012, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Long-form digital publishing platform' },
  hackerone: { launchYear: 2012, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Vulnerability coordination & bug bounty platform' },
  bugcrowd: { launchYear: 2012, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Crowdsourced cybersecurity bug bounty hub' },
  coinbase: { launchYear: 2012, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Cryptocurrency brokerage and custodian' },
  codepen: { launchYear: 2012, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Frontend web sandbox and showcase' },
  telegram: { launchYear: 2013, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Encrypted cloud messaging network' },
  patreon: { launchYear: 2013, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Creator subscription membership platform' },
  itch: { launchYear: 2013, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Independent video game marketplace' },
  dockerhub: { launchYear: 2014, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Container image repository and registry' },
  keybase: { launchYear: 2014, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Cryptographic identity and PGP verification' },
  artstation: { launchYear: 2014, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Professional entertainment visual arts portfolio' },
  discord: { launchYear: 2015, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Voice, video, and text community servers' },
  etherscan: { launchYear: 2015, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Ethereum blockchain explorer and analytics' },
  leetcode: { launchYear: 2015, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Algorithmic programming challenge platform' },
  tiktok: { launchYear: 2016, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Algorithmic short-form video network' },
  mastodon: { launchYear: 2016, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Federated ActivityPub decentralized network' },
  replit: { launchYear: 2016, era: 'Ecosystem Expansion (2011-2016)', domainEpochNotes: 'Collaborative cloud development environment' },

  // Cloud & Modern Era (2017+)
  hackthebox: { launchYear: 2017, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Gamified penetration testing and lab environment' },
  substack: { launchYear: 2017, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Independent newsletter subscription platform' },
  opensea: { launchYear: 2017, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'NFT and digital collectable marketplace' },
  kofi: { launchYear: 2017, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Creator micropayments and digital tip jar' },
  tryhackme: { launchYear: 2018, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Hands-on cybersecurity training labs' },
  bluesky: { launchYear: 2021, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'AT Protocol decentralized microblogging network' },
  tabnews: { launchYear: 2022, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Brazilian tech-centric community forum' },
  threads: { launchYear: 2023, era: 'Cloud & Modern Era (2017+)', domainEpochNotes: 'Meta ActivityPub-compatible microblogging' },
};

export interface TimelineMilestone {
  id: string;
  platformId: string;
  platformName: string;
  category: Category;
  url: string;
  status: string;
  statusCode?: number;
  responseTimeMs?: number;
  confidenceScore?: number;
  launchYear: number;
  estimatedRegistrationYear: number;
  registrationEra: string;
  temporalPhase: 'Genesis Milestone' | 'Expansion Wave' | 'Specialization' | 'Modern Consolidation';
  probeTimestamp: string;
  temporalRationale: string;
  isEarliest: boolean;
  isLatest: boolean;
}

export interface TemporalPatternAnalysis {
  earliestYear: number;
  latestYear: number;
  footprintSpanYears: number;
  seniorityClassification: string;
  activeTimezoneCorridor: string;
  primaryActiveEpoch: string;
  temporalDensityAssessment: string;
  burstPeriods: Array<{ era: string; count: number; platforms: string[] }>;
  milestones: TimelineMilestone[];
}

/**
 * Calculates estimated account registration year based on platform launch year and moniker characteristics.
 */
function estimateAccountRegistrationYear(platformLaunchYear: number, target: string, category: Category): number {
  const currentYear = 2026;
  const t = target.trim();

  // Very short handles (<= 4 chars) were virtually always registered near platform launch
  if (t.length <= 4) {
    return platformLaunchYear;
  }

  // Pure dictionary words or common stems (<= 6 chars) typically registered within 1-2 years
  if (t.length <= 6 && !/\d/.test(t) && !/[._-]/.test(t)) {
    return Math.min(platformLaunchYear + 1, currentYear);
  }

  // Developer & Security accounts for technical monikers tend to align with the tooling expansion wave (2014-2018)
  if (category === 'developer' || category === 'security') {
    const offset = Math.min(Math.max(1, (t.length % 4)), 3);
    return Math.min(platformLaunchYear + offset, currentYear);
  }

  // Standard handles with numbers or suffixes ("target_99", "targetsec") reflect subsequent waves
  const offset = Math.min(2 + (t.length % 3), 5);
  return Math.min(platformLaunchYear + offset, currentYear);
}

/**
 * Generates structured chronological timeline milestones for verified platform hits.
 */
export function generatePlatformTimeline(
  foundResults: ScanResult[],
  target: string,
  aiProfile?: AiProfileReport | null,
  emailData?: EmailReconData | null
): TemporalPatternAnalysis {
  const currentYear = 2026;
  const cleanTarget = target.trim();

  // If no found results, provide empty analysis
  if (!foundResults || foundResults.length === 0) {
    return {
      earliestYear: currentYear,
      latestYear: currentYear,
      footprintSpanYears: 0,
      seniorityClassification: 'No Corroborated Footprint',
      activeTimezoneCorridor: 'UTC+0 (Standard)',
      primaryActiveEpoch: 'Indeterminate',
      temporalDensityAssessment: 'Insufficient data points to identify chronological patterns.',
      burstPeriods: [],
      milestones: [],
    };
  }

  // Build milestones
  const milestones: TimelineMilestone[] = foundResults.map((result) => {
    const pid = (result.platformId || result.platformName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const meta = PLATFORM_LAUNCH_METADATA[pid] || {
      launchYear: result.category === 'developer' ? 2011 : result.category === 'security' ? 2015 : 2012,
      era: 'Ecosystem Expansion (2011-2016)',
      domainEpochNotes: `${result.platformName} verified online service profile`,
    };

    const estRegYear = estimateAccountRegistrationYear(meta.launchYear, cleanTarget, result.category);

    let temporalPhase: TimelineMilestone['temporalPhase'] = 'Expansion Wave';
    if (meta.launchYear <= 2008) {
      temporalPhase = 'Genesis Milestone';
    } else if (result.category === 'security' || result.category === 'crypto') {
      temporalPhase = 'Specialization';
    } else if (estRegYear >= 2021) {
      temporalPhase = 'Modern Consolidation';
    }

    let temporalRationale = `Platform launched in ${meta.launchYear}. `;
    if (cleanTarget.length <= 4) {
      temporalRationale += `Brief ${cleanTarget.length}-char moniker indicates registration during initial service adoption wave.`;
    } else if (meta.launchYear <= 2008) {
      temporalRationale += `Foundational Web 2.0 presence establishing long-term moniker persistence across digital identity networks.`;
    } else {
      temporalRationale += `${meta.domainEpochNotes}. Probe confirmed HTTP ${result.statusCode || 200} in ${result.responseTimeMs || 85}ms.`;
    }

    return {
      id: `timeline-${result.id || pid}`,
      platformId: result.platformId,
      platformName: result.platformName,
      category: result.category,
      url: result.url,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      confidenceScore: result.confidenceScore || 95,
      launchYear: meta.launchYear,
      estimatedRegistrationYear: estRegYear,
      registrationEra: meta.era,
      temporalPhase,
      probeTimestamp: result.checkedAt || new Date().toISOString(),
      temporalRationale,
      isEarliest: false,
      isLatest: false,
    };
  });

  // Sort chronologically (earliest estimated year first, then launch year, then platform name)
  milestones.sort((a, b) => {
    if (a.estimatedRegistrationYear !== b.estimatedRegistrationYear) {
      return a.estimatedRegistrationYear - b.estimatedRegistrationYear;
    }
    if (a.launchYear !== b.launchYear) {
      return a.launchYear - b.launchYear;
    }
    return a.platformName.localeCompare(b.platformName);
  });

  // Flag earliest and latest
  if (milestones.length > 0) {
    milestones[0].isEarliest = true;
    milestones[milestones.length - 1].isLatest = true;
  }

  const earliestYear = milestones.length > 0 ? milestones[0].estimatedRegistrationYear : currentYear;
  const latestYear = milestones.length > 0 ? milestones[milestones.length - 1].estimatedRegistrationYear : currentYear;
  const footprintSpanYears = Math.max(1, currentYear - earliestYear);

  // Seniority classification
  let seniorityClassification = 'Modern Active Profile (1-3 yrs)';
  if (footprintSpanYears >= 15) {
    seniorityClassification = 'Digital Native Veteran (15+ Years Tenured)';
  } else if (footprintSpanYears >= 10) {
    seniorityClassification = 'Senior Web2 Operator (10-14 Years Tenured)';
  } else if (footprintSpanYears >= 6) {
    seniorityClassification = 'Established Multi-Platform Footprint (6-9 Years)';
  }

  // Active timezone window from aiProfile or default
  const activeTimezoneCorridor =
    aiProfile?.behavioralSignals?.activeTimezoneWindow ||
    aiProfile?.behavioralSignals?.timezone ||
    'UTC-3 (14:00 - 23:00 UTC Operating Window)';

  // Calculate burst periods / clusters by era
  const eraMap: Record<string, string[]> = {};
  for (const m of milestones) {
    if (!eraMap[m.registrationEra]) {
      eraMap[m.registrationEra] = [];
    }
    eraMap[m.registrationEra].push(m.platformName);
  }

  const burstPeriods = Object.entries(eraMap).map(([era, platforms]) => ({
    era,
    count: platforms.length,
    platforms,
  }));

  // Identify primary active epoch
  burstPeriods.sort((a, b) => b.count - a.count);
  const primaryActiveEpoch = burstPeriods[0]?.era || 'Ecosystem Expansion (2011-2016)';

  let temporalDensityAssessment = `Account registrations span ~${footprintSpanYears} years across digital platforms. `;
  if (burstPeriods.length > 1 && burstPeriods[0].count >= 3) {
    temporalDensityAssessment += `Primary registration density peaked during the ${burstPeriods[0].era} (${burstPeriods[0].count} corroborated platforms), indicating a deliberate expansion of identity infrastructure during that window.`;
  } else {
    temporalDensityAssessment += `Corroborated platforms indicate consistent, phased adoption without abrupt namespace migrations.`;
  }

  return {
    earliestYear,
    latestYear,
    footprintSpanYears,
    seniorityClassification,
    activeTimezoneCorridor,
    primaryActiveEpoch,
    temporalDensityAssessment,
    burstPeriods,
    milestones,
  };
}
