import { ThreatActorAnalysis } from '../types';

export interface PlatformIndicatorInput {
  platformName: string;
  category?: string;
  url?: string;
}

export interface InferredOccupationInfo {
  inferredOccupation: string;
  occupationCategory:
    | 'technology'
    | 'cybersecurity'
    | 'creative_arts'
    | 'gaming_entertainment'
    | 'business_corporate'
    | 'academic_student'
    | 'finance_commerce'
    | 'general_civilian';
  confidence: number;
  sourceSignals: string[];
}

/**
 * High-precision Threat Actor Heuristics & Occupation Cross-Referencing Engine.
 * 
 * Accurately differentiates:
 * 1. Legitimate, authorized cybersecurity practitioners (Red/Blue teams, bug bounty hunters).
 * 2. Underground, opportunistic, or financially motivated threat actors (credential dumpers, script operators, forum brokers).
 * 3. Insider risk / dual-identity discrepancies (corporate occupation cross-referenced against illicit activity).
 * 4. Benign civilian profiles (artists, gamers, students, corporate workers) who must NEVER be misclassified.
 */
export function evaluateThreatActorHeuristics(
  platforms: PlatformIndicatorInput[] = [],
  target: string = '',
  emailData?: any
): ThreatActorAnalysis {
  const cleanTarget = target.trim();
  const lowerTarget = cleanTarget.toLowerCase();
  const count = platforms.length;
  const platformNames = new Set(platforms.map((p) => (p.platformName || '').toLowerCase()));
  const allUrls = platforms.map((p) => (p.url || '').toLowerCase()).join(' ');

  // 1. INFER OCCUPATION & PROFESSIONAL PROFILE FROM DISCOVERED METADATA
  const occupationInfo = inferUserOccupation(platforms, cleanTarget, emailData);

  // 2. CHECK SPECIFIC PLATFORM SIGNATURE CLUSTERS
  const undergroundForums = [
    'xss', 'exploit.in', 'breachforums', 'raidforums', 'cracked', 'nulled', 'v3rmillion',
    'mpgh', 'sinister.ly', 'hackforums', 'leakforums', 'weleakinfo', 'crackingorg',
    'anonfiles', 'rentry', 'pastebin'
  ];

  const ethicalCyberPlatforms = [
    'hackerone', 'bugcrowd', 'intigriti', 'hackthebox', 'tryhackme', 'ctftime',
    'root-me', 'overthewire', 'portswigger', 'shodan', 'binaryninja', 'keybase'
  ];

  const softwareDevPlatforms = [
    'github', 'gitlab', 'bitbucket', 'npm', 'pypi', 'crates.io', 'rubygems',
    'packagist', 'dockerhub', 'huggingface', 'kaggle', 'stackoverflow'
  ];

  const creativePlatforms = [
    'behance', 'dribbble', 'artstation', 'deviantart', 'pixiv', '500px', 'flickr',
    'soundcloud', 'bandcamp', 'audiomack', 'mixcloud'
  ];

  const gamingPlatforms = [
    'steam', 'twitch', 'discord', 'roblox', 'chess.com', 'lichess', 'speedrun.com',
    'nexusmods', 'epicgames', 'battlenet'
  ];

  // Matched categories
  const matchedUnderground = platforms.filter((p) => {
    const name = (p.platformName || '').toLowerCase();
    const url = (p.url || '').toLowerCase();
    return undergroundForums.some((u) => name.includes(u) || url.includes(u));
  });

  const matchedEthical = platforms.filter((p) => {
    const name = (p.platformName || '').toLowerCase();
    const url = (p.url || '').toLowerCase();
    return ethicalCyberPlatforms.some((e) => name.includes(e) || url.includes(e));
  });

  const matchedDev = platforms.filter((p) => {
    const name = (p.platformName || '').toLowerCase();
    return softwareDevPlatforms.some((d) => name.includes(d));
  });

  const matchedCreative = platforms.filter((p) => {
    const name = (p.platformName || '').toLowerCase();
    return creativePlatforms.some((c) => name.includes(c));
  });

  const matchedGaming = platforms.filter((p) => {
    const name = (p.platformName || '').toLowerCase();
    return gamingPlatforms.some((g) => name.includes(g));
  });

  // Handle semantics for threat or cyber clues
  const threatKeywords = ['sec', 'cyber', 'exploit', 'root', 'zero', 'c0de', 'rat', 'bot', 'anon', 'pwn', 'hack', 'inject'];
  const hasCyberMoniker = threatKeywords.some((kw) => lowerTarget.includes(kw));

  // TTPs and Indicators collections
  const observedTTPs: string[] = [];
  const indicatorMatches: ThreatActorAnalysis['indicatorMatches'] = [];
  const mitreTactics: string[] = [];

  let threatActorScore = 0; // 0 - 100
  let confidenceScore = 65;

  // 3. APPLY HEURISTIC EVALUATION RULES

  // Indicator 1: Underground & Cybercrime platform hits
  if (matchedUnderground.length > 0) {
    threatActorScore += matchedUnderground.length * 30;
    matchedUnderground.forEach((p) => {
      indicatorMatches.push({
        category: 'underground',
        severity: 'critical',
        indicator: `Presence on darknet/underground community: ${p.platformName}`,
        evidence: p.url || `Platform identifier @${cleanTarget}`,
      });
    });
    observedTTPs.push('Underground Identity Persona Staging');
    mitreTactics.push('TA0001 (Initial Access / Underground Forum Presence)');
  }

  // Indicator 2: Authorized Ethical Security Footprint
  if (matchedEthical.length > 0) {
    matchedEthical.forEach((p) => {
      indicatorMatches.push({
        category: 'credential_recon',
        severity: 'low',
        indicator: `Participation in accredited security ecosystem: ${p.platformName}`,
        evidence: p.url || `Public platform handle @${cleanTarget}`,
      });
    });
    observedTTPs.push('Responsible Vulnerability Research / Crowdsourced Security');
    mitreTactics.push('Reconnaissance (Authorized / Ethical CTF & Bug Bounty)');
  }

  // Indicator 3: Handle Security Marker Analysis
  if (hasCyberMoniker && (matchedEthical.length > 0 || matchedDev.length > 0)) {
    indicatorMatches.push({
      category: 'opsec_evasion',
      severity: 'low',
      indicator: `Explicit cybersecurity moniker convention ('${cleanTarget}')`,
      evidence: 'Handle incorporates overt security/systems terminology',
    });
  }

  // Indicator 4: Anonymous / Proton / Disposable Email correlation
  if (emailData?.isDisposable) {
    threatActorScore += 25;
    indicatorMatches.push({
      category: 'opsec_evasion',
      severity: 'high',
      indicator: 'Disposable temporary email domain utilized for persona generation',
      evidence: `Target domain: ${emailData.domain}`,
    });
    observedTTPs.push('Disposable Mail Cloaking / Anti-Attribution');
  }

  // 4. CROSS-REFERENCE OCCUPATION WITH PLATFORM-SPECIFIC BEHAVIOR PATTERNS
  let consistencyVerdict: 'CONSISTENT_LEGITIMATE' | 'NEUTRAL_BENIGN' | 'SUSPICIOUS_ANOMALY' | 'HIGH_RISK_DISCREPANCY' = 'NEUTRAL_BENIGN';
  let crossRefAnalysis = '';

  const isCorporateOrEnterprise = occupationInfo.occupationCategory === 'business_corporate';
  const isDeveloper = occupationInfo.occupationCategory === 'technology';
  const isSecurity = occupationInfo.occupationCategory === 'cybersecurity';
  const isCivilian = ['creative_arts', 'gaming_entertainment', 'finance_commerce', 'general_civilian', 'academic_student'].includes(occupationInfo.occupationCategory);

  // Cross-reference Rule A: High-Risk Discrepancy (Corporate or Academic claiming civilian role while active on underground forums)
  if (matchedUnderground.length > 0 && (isCorporateOrEnterprise || occupationInfo.occupationCategory === 'academic_student')) {
    consistencyVerdict = 'HIGH_RISK_DISCREPANCY';
    threatActorScore = Math.max(75, threatActorScore + 35);
    crossRefAnalysis = `Critical anomaly detected: User displays corporate/academic employment indicators (${occupationInfo.inferredOccupation}) while maintaining active registrations on illicit underground/cracking forums (${matchedUnderground.map((p) => p.platformName).join(', ')}). This cross-reference points to potential insider threat risk, unauthorized moonlighting, or compromised dual-persona credentials.`;
    observedTTPs.push('Dual-Identity Persona Splitting', 'Privileged Corporate Access Correlation');
  }
  // Cross-reference Rule B: Suspicious Anomaly (Standard developer with underground or malware-associated footprint)
  else if (matchedUnderground.length > 0 && isDeveloper) {
    consistencyVerdict = 'SUSPICIOUS_ANOMALY';
    threatActorScore = Math.max(65, threatActorScore + 25);
    crossRefAnalysis = `Suspicious profile discrepancy: While classified as a ${occupationInfo.inferredOccupation}, accounts on underground exchange hubs were identified. Cross-referencing suggests potential participation in offensive tool development, exploit modification, or dual-use software distribution.`;
    observedTTPs.push('Offensive Capability Development');
  }
  // Cross-reference Rule C: Consistent Legitimate Cybersecurity Professional
  else if (matchedEthical.length > 0 && matchedUnderground.length === 0) {
    consistencyVerdict = 'CONSISTENT_LEGITIMATE';
    threatActorScore = Math.min(20, threatActorScore); // Authorized, not a malicious threat actor!
    crossRefAnalysis = `Cross-referencing confirms high professional legitimacy: Activity across accredited platforms (${matchedEthical.map((p) => p.platformName).join(', ')}) aligns directly with the inferred occupation of '${occupationInfo.inferredOccupation}'. Zero illicit or underground markers detected. Characterized as an authorized security practitioner or white-hat researcher.`;
  }
  // Cross-reference Rule D: Consistent Legitimate Software Developer
  else if (isDeveloper && matchedUnderground.length === 0 && matchedEthical.length === 0) {
    consistencyVerdict = 'CONSISTENT_LEGITIMATE';
    threatActorScore = Math.min(10, threatActorScore);
    crossRefAnalysis = `Consistent technical footprint: Discovered repositories and developer networks align transparently with software engineering practices. No unauthorized threat actor heuristics triggered.`;
  }
  // Cross-reference Rule E: Completely Benign Civilian / Non-Cyber User
  else if (isCivilian && matchedUnderground.length === 0) {
    consistencyVerdict = 'NEUTRAL_BENIGN';
    threatActorScore = 0; // Pure benign profile!
    crossRefAnalysis = `Benign profile confirmed: Platform activity is exclusively focused on ${occupationInfo.inferredOccupation} domains (${matchedCreative.length ? 'visual creative, ' : ''}${matchedGaming.length ? 'gaming, ' : ''}social media). Cross-referencing shows zero indicators of offensive cyber capabilities, darknet activity, or malicious tradecraft.`;
  } else {
    consistencyVerdict = 'NEUTRAL_BENIGN';
    threatActorScore = Math.min(30, threatActorScore);
    crossRefAnalysis = `Platform distribution exhibits standard public consumer interaction with no confirmed indicators of malicious threat actor tradecraft.`;
  }

  // 5. DETERMINE FINAL THREAT ACTOR CATEGORY & VERDICT
  let isThreatActorSuspect = false;
  let threatActorCategory: ThreatActorAnalysis['threatActorCategory'] = 'BENIGN_CIVILIAN';
  let verdictTitle = 'Benign Civilian Profile (Zero Threat Footprint)';
  let verdictSummary = '';

  if (matchedUnderground.length >= 2 || (matchedUnderground.length >= 1 && consistencyVerdict === 'HIGH_RISK_DISCREPANCY')) {
    isThreatActorSuspect = true;
    threatActorCategory = consistencyVerdict === 'HIGH_RISK_DISCREPANCY' ? 'INSIDER_RISK_DISCREPANCY' : 'UNDERGROUND_FORUM_BROKER';
    verdictTitle = consistencyVerdict === 'HIGH_RISK_DISCREPANCY'
      ? 'Suspected Insider Threat / Discrepant Dual-Identity'
      : 'Underground Cybercrime Forum Actor / Broker';
    verdictSummary = `Analysis identified definitive markers linking the moniker '@${cleanTarget}' to illicit underground marketplaces. Cross-referencing with declared occupation reveals severe behavioral dissonance.`;
    confidenceScore = 88;
  } else if (matchedUnderground.length === 1) {
    isThreatActorSuspect = true;
    threatActorCategory = 'COMMODITY_SCRIPT_OPERATOR';
    verdictTitle = 'Opportunistic Cyber Actor (Commodity / Script Operator)';
    verdictSummary = `Evidence suggests casual or opportunistic participation on community cracking/leak platforms with low-to-medium operational complexity.`;
    confidenceScore = 74;
  } else if (matchedEthical.some((p) => ['hackerone', 'bugcrowd', 'intigriti'].includes((p.platformName || '').toLowerCase()))) {
    isThreatActorSuspect = false;
    threatActorCategory = 'AUTHORIZED_SECURITY_RESEARCHER';
    verdictTitle = 'Authorized Security Researcher & Crowdsourced Bounty Hunter';
    verdictSummary = `Target operates strictly within authorized, responsible disclosure frameworks. Cross-referencing validates legitimate security posture with zero malicious attribution.`;
    confidenceScore = 92;
  } else if (matchedEthical.some((p) => ['hackthebox', 'tryhackme', 'ctftime'].includes((p.platformName || '').toLowerCase()))) {
    isThreatActorSuspect = false;
    threatActorCategory = 'AUTHORIZED_RED_TEAM';
    verdictTitle = 'Offensive Security Trainee & CTF Competitor';
    verdictSummary = `Footprint demonstrates active adversarial skill development on gamified platforms and competitive CTF arenas without unauthorized targeting.`;
    confidenceScore = 85;
  } else if (isSecurity) {
    isThreatActorSuspect = false;
    threatActorCategory = 'DEFENSIVE_BLUE_TEAM';
    verdictTitle = 'Defensive Cybersecurity Specialist & Systems Guardian';
    verdictSummary = `Security markers reflect defensive operations, compliance, or enterprise monitoring without offensive or illicit platform involvement.`;
    confidenceScore = 80;
  } else {
    isThreatActorSuspect = false;
    threatActorCategory = 'BENIGN_CIVILIAN';
    verdictTitle = `Benign Civilian Profile (${occupationInfo.inferredOccupation})`;
    verdictSummary = `Target exhibits a benign digital presence centered on ${occupationInfo.inferredOccupation.toLowerCase()}. Zero threat actor TTPs or illicit platform heuristics detected.`;
    confidenceScore = 90;
  }

  return {
    isThreatActorSuspect,
    threatActorCategory,
    threatActorScore: Math.min(100, Math.max(0, threatActorScore)),
    confidenceScore,
    verdictTitle,
    verdictSummary,
    occupationCrossReference: {
      inferredOccupation: occupationInfo.inferredOccupation,
      platformBehaviorPattern: `${count} platform(s) analyzed; primary footprint in ${occupationInfo.occupationCategory.replace('_', ' ')} sector`,
      consistencyVerdict,
      analysis: crossRefAnalysis,
    },
    observedTTPs,
    indicatorMatches,
    mitreTactics: mitreTactics.length > 0 ? mitreTactics : undefined,
  };
}

/**
 * Accurately extracts the target's authentic occupation or professional domain.
 * Avoids default "Tech Professional" or "Software Developer" biases.
 */
export function inferUserOccupation(
  platforms: PlatformIndicatorInput[] = [],
  target: string = '',
  emailData?: any
): InferredOccupationInfo {
  const platformNames = new Set(platforms.map((p) => (p.platformName || '').toLowerCase()));
  const allUrls = platforms.map((p) => (p.url || '').toLowerCase()).join(' ');
  const t = target.toLowerCase();
  const sourceSignals: string[] = [];

  // Check specific high-signal platforms
  const hasArtStation = platformNames.has('artstation') || platformNames.has('behance') || platformNames.has('deviantart');
  const hasMusic = platformNames.has('soundcloud') || platformNames.has('bandcamp') || platformNames.has('spotify');
  const hasGaming = platformNames.has('steam') || platformNames.has('twitch') || platformNames.has('discord') || platformNames.has('roblox');
  const hasChess = platformNames.has('chess.com') || platformNames.has('lichess');
  const hasWriting = platformNames.has('substack') || platformNames.has('medium') || platformNames.has('wattpad');
  const hasEcommerce = platformNames.has('etsy') || platformNames.has('mercadolivre') || platformNames.has('ebay') || platformNames.has('shopify');
  const hasAcademic = platformNames.has('researchgate') || platformNames.has('orcid') || platformNames.has('googlescholar') || platformNames.has('arxiv');
  const hasCorporate = platformNames.has('linkedin') || platformNames.has('xing');
  const hasSecurity = platformNames.has('hackerone') || platformNames.has('bugcrowd') || platformNames.has('hackthebox') || platformNames.has('tryhackme');
  const hasDev = platformNames.has('github') || platformNames.has('gitlab') || platformNames.has('npm') || platformNames.has('pypi');

  // Handle semantics
  const isSecHandle = t.includes('sec') || t.includes('cyber') || t.includes('pwn') || t.includes('hack') || t.includes('root') || t.includes('c0de') || t.includes('zero') || t.includes('vuln') || t.includes('exploit');
  const isCreativeHandle = t.includes('art') || t.includes('design') || t.includes('draw') || t.includes('photo') || t.includes('visual');
  const isDevHandle = t.includes('dev') || t.includes('code') || t.includes('tech') || t.includes('soft') || t.includes('sys') || t.includes('git');

  if (isSecHandle) {
    sourceSignals.push(`Handle moniker '${target}' exhibits strong infosec/cybersecurity affinity`);
  }
  if (isCreativeHandle) {
    sourceSignals.push(`Handle moniker indicates creative visual specialization`);
  }
  if (isDevHandle) {
    sourceSignals.push(`Handle moniker indicates software engineering affinity`);
  }

  // 1. Cybersecurity Specialist (High Priority)
  if (hasSecurity || (isSecHandle && (hasDev || platforms.length > 0)) || (sourceSignals.some((s) => s.includes('infosec')) && hasDev)) {
    return {
      inferredOccupation: 'Cybersecurity Practitioner / Security Researcher',
      occupationCategory: 'cybersecurity',
      confidence: 90,
      sourceSignals: [...sourceSignals, 'Active registration on technical development and security research platforms'],
    };
  }

  // 2. Academic / Scientist
  if (hasAcademic) {
    return {
      inferredOccupation: 'Academic Scholar & Scientific Researcher',
      occupationCategory: 'academic_student',
      confidence: 85,
      sourceSignals: [...sourceSignals, 'Verified academic repository and peer-review identity markers'],
    };
  }

  // 3. Visual Designer & Concept Artist
  if (hasArtStation || (isCreativeHandle && platforms.some((p) => p.category === 'creative'))) {
    return {
      inferredOccupation: 'Digital Concept Artist & Visual Designer',
      occupationCategory: 'creative_arts',
      confidence: 89,
      sourceSignals: [...sourceSignals, 'Public portfolio showcases on dedicated graphic arts networks'],
    };
  }

  // 4. Audio Producer & Musician
  if (hasMusic && (platformNames.has('soundcloud') || platformNames.has('bandcamp'))) {
    return {
      inferredOccupation: 'Audio Producer & Independent Music Creator',
      occupationCategory: 'creative_arts',
      confidence: 86,
      sourceSignals: [...sourceSignals, 'Streaming audio releases and musical catalog curation'],
    };
  }

  // 5. Competitive Gamer & Streamer
  if (hasGaming && (platformNames.has('twitch') || platformNames.has('steam'))) {
    return {
      inferredOccupation: 'Competitive Gamer & Interactive Content Creator',
      occupationCategory: 'gaming_entertainment',
      confidence: 84,
      sourceSignals: [...sourceSignals, 'Gaming ecosystem profiles and live interactive broadcasts'],
    };
  }

  // 6. Chess & Strategy Analyst
  if (hasChess) {
    return {
      inferredOccupation: 'Competitive Chess Player & Strategy Enthusiast',
      occupationCategory: 'gaming_entertainment',
      confidence: 90,
      sourceSignals: [...sourceSignals, 'Ranked account on competitive digital chess platforms'],
    };
  }

  // 7. E-Commerce Merchant & Seller
  if (hasEcommerce) {
    return {
      inferredOccupation: 'Independent E-Commerce Merchant & Digital Seller',
      occupationCategory: 'finance_commerce',
      confidence: 82,
      sourceSignals: [...sourceSignals, 'Active commercial storefronts and merchant registry footprints'],
    };
  }

  // 8. Long-Form Writer & Journalist
  if (hasWriting) {
    return {
      inferredOccupation: 'Digital Journalist, Columnist & Essayist',
      occupationCategory: 'creative_arts',
      confidence: 83,
      sourceSignals: [...sourceSignals, 'Editorial publishing on independent newsletter platforms'],
    };
  }

  // 9. Enterprise / Corporate Professional
  if (hasCorporate && !hasDev && !hasSecurity) {
    return {
      inferredOccupation: 'Corporate Business Professional & Networker',
      occupationCategory: 'business_corporate',
      confidence: 80,
      sourceSignals: [...sourceSignals, 'Career-oriented presence on professional networking services'],
    };
  }

  // 10. Software Engineer & Systems Developer
  if (hasDev || isDevHandle || platforms.some((p) => p.category === 'developer' || p.category === 'coding')) {
    return {
      inferredOccupation: 'Software Engineer & Open Source Developer',
      occupationCategory: 'technology',
      confidence: 86,
      sourceSignals: [...sourceSignals, 'Source code repositories and developer platform presence'],
    };
  }

  // 11. General Digital Citizen
  return {
    inferredOccupation: 'Independent Digital Operator & Online Identity',
    occupationCategory: 'general_civilian',
    confidence: 72,
    sourceSignals: [...sourceSignals, 'Digital presence distributed across public communication and web services'],
  };
}
