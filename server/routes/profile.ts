import { Router, type Request, type Response } from 'express';
import { computeBehavioralProfile } from '../../src/data/behavioralEngine';
import { extractPlatformSignals } from '../../src/data/platformSignalExtractor';
import { evaluateThreatActorHeuristics } from '../../src/data/threatActorHeuristics';
import {
  evaluatePass1Entities,
  generateDossierWithGemini,
  getGenAiClient,
  weightEntitiesAgainstPatterns,
  type ExtractedEntities,
} from '../services/gemini';

// AI-Powered Autonomous Profiling Engine (Mineiro Username Intelligence Flagship Intelligence)
async function legacyProfile(req: Request, res: Response) {
  if (process.env.MINEIRO_ENABLE_LEGACY_PROFILE !== '1') {
    return res.status(410).json({
      error: 'Legacy speculative profile endpoint is disabled by default in Mineiro v1.4.1.',
      replacement: '/api/intelligence/copilot',
      note: 'Use the evidence-bounded Analyst Copilot. AI synthesis cannot raise factual confidence by itself.',
    });
  }
  const { target, targetType = 'username', foundPlatforms = [], emailData = null, model, customApiKey } = req.body;
  const userHeaderKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;

  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target identifier is required' });
  }

  const platformsList = Array.isArray(foundPlatforms)
    ? foundPlatforms.map((p: any) => `${p.platformName} (${p.category}): ${p.url}`).join('\n')
    : 'None explicitly provided.';

  // Extract explicit timezone and language signals from identified platform profiles
  const signals = extractPlatformSignals(foundPlatforms, target, emailData);

  // Compute baseline objective behavioral distribution
  const baselineBehavior = computeBehavioralProfile(foundPlatforms, target, emailData);

  // Evaluate security-focused heuristics for threat actor identification & occupation cross-referencing
  const threatActorHeuristics = baselineBehavior.threatActorAnalysis || evaluateThreatActorHeuristics(foundPlatforms, target, emailData);

  const clientInfo = getGenAiClient(userHeaderKey);
  let isQuotaExceeded = false;

  if (clientInfo) {
    // --- MULTI-PASS EVALUATION ---
    // Pass 1: Identify Industry, Interests, and Technical Footprint as distinct entities
    const rawEntities = await evaluatePass1Entities(
      clientInfo.client,
      target,
      targetType,
      platformsList,
      baselineBehavior.categoryPercentages,
      baselineBehavior.categoryDistribution,
      emailData,
      model
    );

    const initialEntities: ExtractedEntities = rawEntities || {
      industry: baselineBehavior.industry,
      interests: baselineBehavior.interests,
      technicalFootprint: baselineBehavior.technicalFootprint,
    };

    // Weight these three variables against platform activity patterns
    const { weightedEntities, archetypeDirective } = weightEntitiesAgainstPatterns(
      initialEntities,
      foundPlatforms,
      baselineBehavior,
      target
    );

    // Pass 2: Synthesize comprehensive forensic dossier with weighted Archetype mapping
    const prompt = `You are the AI Intelligence Profiling Engine inside Mineiro Username Intelligence, a unified high-grade open-source intelligence analysis system.
Analyze the following target reconnaissance data and generate an actionable, comprehensive forensic OSINT dossier.

Target: "${target}"
Target Type: ${targetType}
Discovered Platforms & Profiles (${foundPlatforms.length} total):
${platformsList}

Platform Category Breakdown:
${Object.entries(baselineBehavior.categoryPercentages)
  .filter(([_, pct]) => pct > 0)
  .map(([cat, pct]) => `- ${cat}: ${pct}% (${baselineBehavior.categoryDistribution[cat]} platform(s))`)
  .join('\n')}

MULTI-PASS VERIFIED ENTITIES:
- Industry: ${weightedEntities.industry}
- Interests: ${weightedEntities.interests.join(', ')}
- Technical Footprint Level: ${weightedEntities.technicalFootprint.level}
- Is Tech Professional: ${weightedEntities.technicalFootprint.isTechProfessional ? 'YES' : 'NO'}
- Technical Evidence: ${weightedEntities.technicalFootprint.evidence}
- Primary Tools: ${(weightedEntities.technicalFootprint.primaryTools || []).join(', ') || 'Standard web & communication tools'}

ARCHETYPE WEIGHTING DIRECTIVE:
${archetypeDirective}

Inferred Professional Occupation & Domain Footprint:
- Inferred Primary Occupation: ${threatActorHeuristics.occupationCrossReference.inferredOccupation}
- Platform Pattern: ${threatActorHeuristics.occupationCrossReference.platformBehaviorPattern}
- Cross-Reference Consistency Verdict: ${threatActorHeuristics.occupationCrossReference.consistencyVerdict}
- Preliminary Threat Actor Verdict: ${threatActorHeuristics.verdictTitle} (Score: ${threatActorHeuristics.threatActorScore}/100)
- Observed TTPs: ${threatActorHeuristics.observedTTPs.join(', ') || 'None (Benign non-adversarial activity)'}

Extracted Platform Behavioral Signals:
- Dominant Platform Sector: ${baselineBehavior.dominantDomain.toUpperCase()}
- Platform Timezone Footprint: ${signals.timezone} (${signals.activeTimezoneWindow})
- Platform Timezone Indicators:
${signals.timezoneSignals.map((s) => `  * ${s}`).join('\n')}
- Platform Language & Dialect Footprint: ${signals.language}
- Primary Language: ${signals.primaryLanguage}
- Secondary / Technical Languages: ${signals.secondaryLanguages.join(', ') || 'None'}
- Platform Language Indicators:
${signals.languageSignals.map((s) => `  * ${s}`).join('\n')}
- Inferred Linguistic Style: ${signals.linguisticStyle}

Additional Email Reconnaissance Data:
${emailData ? JSON.stringify(emailData, null, 2) : 'No direct email reconnaissance data available.'}

Respond strictly in valid JSON format matching this schema:
{
  "target": "${target}",
  "targetType": "${targetType}",
  "summary": "2-3 crisp sentences synthesizing the target's digital footprint, identity cohesion, and primary domain of activity.",
  "threatLevel": "Low" | "Moderate" | "Elevated" | "Critical",
  "footprintScore": number between 10 and 95 (higher means broader public digital attack surface),
  "industry": "${weightedEntities.industry}",
  "interests": ${JSON.stringify(weightedEntities.interests)},
  "technicalFootprint": {
    "level": "${weightedEntities.technicalFootprint.level}",
    "isTechProfessional": ${weightedEntities.technicalFootprint.isTechProfessional},
    "evidence": "${weightedEntities.technicalFootprint.evidence.replace(/"/g, '\\"')}",
    "primaryTools": ${JSON.stringify(weightedEntities.technicalFootprint.primaryTools)}
  },
  "archetype": "Specific archetype title strictly adhering to the Archetype Weighting Directive above",
  "archetypeDescription": "Detailed forensic explanation of why this specific archetype fits the discovered cross-platform activity signatures.",
  "threatActorAnalysis": {
    "isThreatActorSuspect": boolean,
    "threatActorCategory": "BENIGN_CIVILIAN" | "AUTHORIZED_SECURITY_RESEARCHER" | "AUTHORIZED_RED_TEAM" | "DEFENSIVE_BLUE_TEAM" | "COMMODITY_SCRIPT_OPERATOR" | "UNDERGROUND_FORUM_BROKER" | "FINANCIALLY_MOTIVATED_ACTOR" | "HACKTIVIST_OPERATOR" | "INSIDER_RISK_DISCREPANCY" | "STEALTH_OPSEC_OPERATOR",
    "threatActorScore": number between 0 and 100,
    "confidenceScore": number between 0 and 100,
    "verdictTitle": "Crisp title e.g. '${threatActorHeuristics.verdictTitle}'",
    "verdictSummary": "Forensic synthesis explaining the threat actor classification or benign confirmation.",
    "occupationCrossReference": {
      "inferredOccupation": "${threatActorHeuristics.occupationCrossReference.inferredOccupation}",
      "platformBehaviorPattern": "${threatActorHeuristics.occupationCrossReference.platformBehaviorPattern}",
      "consistencyVerdict": "CONSISTENT_LEGITIMATE" | "NEUTRAL_BENIGN" | "SUSPICIOUS_ANOMALY" | "HIGH_RISK_DISCREPANCY",
      "analysis": "Detailed cross-referencing analysis"
    },
    "observedTTPs": ["TTP 1", "TTP 2"],
    "indicatorMatches": [
      {
        "category": "underground" | "offensive_tools" | "opsec_evasion" | "leaks_dumps" | "credential_recon",
        "severity": "low" | "medium" | "high" | "critical",
        "indicator": "Indicator description",
        "evidence": "Observed evidence"
      }
    ]
  },
  "behavioralSignals": {
    "opsecHygiene": "Poor" | "Basic" | "Moderate" | "High" | "Paranoid",
    "timezone": "Specific inferred primary timezone e.g. '${signals.timezone}'",
    "timezoneSignals": [
      "Specific signal extracted from identified platforms e.g. '${signals.timezoneSignals[0] || 'Active during standard diurnal hours'}'"
    ],
    "activeTimezoneWindow": "Estimated peak activity window e.g. '${signals.activeTimezoneWindow}'",
    "language": "Primary and secondary language assessment e.g. '${signals.language}'",
    "primaryLanguage": "${signals.primaryLanguage}",
    "secondaryLanguages": ${JSON.stringify(signals.secondaryLanguages)},
    "languageSignals": [
      "Specific language indicator e.g. '${signals.languageSignals[0] || 'Standard international communication'}'"
    ],
    "linguisticStyle": "Observed psycholinguistic pattern e.g. '${signals.linguisticStyle}'",
    "socialExposureRisk": "Minimal" | "Moderate" | "Elevated" | "Severe",
    "handlePersistencePattern": "Single Moniker Reuse" | "Predictable Affixes" | "Segmented Personas" | "High-Entropy Anon",
    "anonymityEffort": "Low" | "Moderate" | "High",
    "accountCreationEra": "Estimated account era, e.g. 'Established Veteran (2012-2018)' or 'Recent Emergence (2020+)'"
  },
  "threatVulnerabilities": [
    "Vulnerability 1",
    "Vulnerability 2"
  ],
  "recommendedDefensiveActions": [
    "Defensive action 1",
    "Defensive action 2"
  ],
  "psycholinguisticClues": [
    "Clue 1",
    "Clue 2"
  ],
  "technicalSkills": ["relevant skill 1 based on dominant activity", "skill 2", "skill 3"],
  "personalityTraits": ["trait 1", "trait 2", "trait 3"],
  "inferredLocations": ["potential location based on timezone and language"],
  "potentialInterests": ["interest 1", "interest 2"],
  "identityCorrelation": "Analysis of handle reuse probability across platforms and whether it is a unique moniker or generic pseudonym.",
  "investigationPivots": [
    {
      "hop": "Next lead or platform to verify",
      "type": "username" | "domain" | "email" | "crypto" | "code",
      "explanation": "Why this pivot is high value",
      "recommendedAction": "Actionable command or search syntax"
    }
  ]
}

Return strictly the raw JSON without markdown code fences or backticks.`;

    const aiResult = await generateDossierWithGemini(clientInfo.client, prompt, model);

    if (aiResult && aiResult.data) {
      // Extra safety guard: If target is verified non-tech professional, ensure archetype is not contaminated with tech titles
      let finalArchetype = aiResult.data.archetype || baselineBehavior.archetype;
      if (!weightedEntities.technicalFootprint.isTechProfessional) {
        const lowerArchetype = finalArchetype.toLowerCase();
        const forbiddenTerms = ['software', 'developer', 'engineer', 'programmer', 'cybersecurity', 'hacker', 'infosec', 'penetration', 'cloud architect'];
        if (forbiddenTerms.some((term) => lowerArchetype.includes(term))) {
          finalArchetype = baselineBehavior.archetype;
        }
      }

      const mergedBehavioralSignals = {
        opsecHygiene: aiResult.data.behavioralSignals?.opsecHygiene || baselineBehavior.opsecHygiene,
        timezone: aiResult.data.behavioralSignals?.timezone || signals.timezone,
        timezoneSignals: aiResult.data.behavioralSignals?.timezoneSignals?.length
          ? aiResult.data.behavioralSignals.timezoneSignals
          : signals.timezoneSignals,
        activeTimezoneWindow: aiResult.data.behavioralSignals?.activeTimezoneWindow || signals.activeTimezoneWindow,
        language: aiResult.data.behavioralSignals?.language || signals.language,
        primaryLanguage: aiResult.data.behavioralSignals?.primaryLanguage || signals.primaryLanguage,
        secondaryLanguages: aiResult.data.behavioralSignals?.secondaryLanguages || signals.secondaryLanguages,
        languageSignals: aiResult.data.behavioralSignals?.languageSignals?.length
          ? aiResult.data.behavioralSignals.languageSignals
          : signals.languageSignals,
        linguisticStyle: aiResult.data.behavioralSignals?.linguisticStyle || signals.linguisticStyle,
        socialExposureRisk: aiResult.data.behavioralSignals?.socialExposureRisk || baselineBehavior.socialExposureRisk,
        handlePersistencePattern: aiResult.data.behavioralSignals?.handlePersistencePattern || baselineBehavior.handlePersistencePattern,
        anonymityEffort: aiResult.data.behavioralSignals?.anonymityEffort || baselineBehavior.anonymityEffort,
        accountCreationEra: aiResult.data.behavioralSignals?.accountCreationEra || baselineBehavior.accountCreationEra,
      };

      const mergedThreatActorAnalysis = {
        isThreatActorSuspect: typeof aiResult.data.threatActorAnalysis?.isThreatActorSuspect === 'boolean'
          ? aiResult.data.threatActorAnalysis.isThreatActorSuspect
          : threatActorHeuristics.isThreatActorSuspect,
        threatActorCategory: aiResult.data.threatActorAnalysis?.threatActorCategory || threatActorHeuristics.threatActorCategory,
        threatActorScore: typeof aiResult.data.threatActorAnalysis?.threatActorScore === 'number'
          ? aiResult.data.threatActorAnalysis.threatActorScore
          : threatActorHeuristics.threatActorScore,
        confidenceScore: typeof aiResult.data.threatActorAnalysis?.confidenceScore === 'number'
          ? aiResult.data.threatActorAnalysis.confidenceScore
          : threatActorHeuristics.confidenceScore,
        verdictTitle: aiResult.data.threatActorAnalysis?.verdictTitle || threatActorHeuristics.verdictTitle,
        verdictSummary: aiResult.data.threatActorAnalysis?.verdictSummary || threatActorHeuristics.verdictSummary,
        occupationCrossReference: {
          inferredOccupation: aiResult.data.threatActorAnalysis?.occupationCrossReference?.inferredOccupation || threatActorHeuristics.occupationCrossReference.inferredOccupation,
          platformBehaviorPattern: aiResult.data.threatActorAnalysis?.occupationCrossReference?.platformBehaviorPattern || threatActorHeuristics.occupationCrossReference.platformBehaviorPattern,
          consistencyVerdict: aiResult.data.threatActorAnalysis?.occupationCrossReference?.consistencyVerdict || threatActorHeuristics.occupationCrossReference.consistencyVerdict,
          analysis: aiResult.data.threatActorAnalysis?.occupationCrossReference?.analysis || threatActorHeuristics.occupationCrossReference.analysis,
        },
        observedTTPs: aiResult.data.threatActorAnalysis?.observedTTPs?.length
          ? aiResult.data.threatActorAnalysis.observedTTPs
          : threatActorHeuristics.observedTTPs,
        indicatorMatches: aiResult.data.threatActorAnalysis?.indicatorMatches?.length
          ? aiResult.data.threatActorAnalysis.indicatorMatches
          : threatActorHeuristics.indicatorMatches,
        mitreTactics: aiResult.data.threatActorAnalysis?.mitreTactics || threatActorHeuristics.mitreTactics,
      };

      return res.json({
        ...aiResult.data,
        industry: aiResult.data.industry || weightedEntities.industry,
        interests: Array.isArray(aiResult.data.interests) && aiResult.data.interests.length > 0
          ? aiResult.data.interests
          : weightedEntities.interests,
        technicalFootprint: aiResult.data.technicalFootprint || weightedEntities.technicalFootprint,
        archetype: finalArchetype,
        archetypeDescription: aiResult.data.archetypeDescription || baselineBehavior.archetypeDescription,
        threatActorAnalysis: mergedThreatActorAnalysis,
        behavioralSignals: mergedBehavioralSignals,
        generatedAt: new Date().toISOString(),
        modelUsed: aiResult.modelUsed,
        isCustomKey: clientInfo.isCustom,
      });
    }

    isQuotaExceeded = Boolean(aiResult?.quotaExceeded);
  }

  // High-fidelity fallback heuristic profiler (used if no API key or on temporary demand spike)
  const count = Array.isArray(foundPlatforms) ? foundPlatforms.length : 0;
  const threatLevel = threatActorHeuristics.isThreatActorSuspect
    ? 'Critical'
    : count > 12 ? 'Elevated' : count > 5 ? 'Moderate' : 'Low';
  const footprintScore = Math.min(95, Math.max(15, count * 7 + 20));

  return res.json({
    target,
    targetType,
    summary: baselineBehavior.summary,
    threatLevel,
    footprintScore,
    industry: baselineBehavior.industry,
    interests: baselineBehavior.interests,
    technicalFootprint: baselineBehavior.technicalFootprint,
    archetype: baselineBehavior.archetype,
    archetypeDescription: baselineBehavior.archetypeDescription,
    threatActorAnalysis: threatActorHeuristics,
    behavioralSignals: {
      opsecHygiene: baselineBehavior.opsecHygiene,
      timezone: signals.timezone,
      timezoneSignals: signals.timezoneSignals,
      activeTimezoneWindow: signals.activeTimezoneWindow,
      language: signals.language,
      primaryLanguage: signals.primaryLanguage,
      secondaryLanguages: signals.secondaryLanguages,
      languageSignals: signals.languageSignals,
      linguisticStyle: signals.linguisticStyle,
      socialExposureRisk: baselineBehavior.socialExposureRisk,
      handlePersistencePattern: baselineBehavior.handlePersistencePattern,
      anonymityEffort: baselineBehavior.anonymityEffort,
      accountCreationEra: baselineBehavior.accountCreationEra,
    },
    threatVulnerabilities: baselineBehavior.threatVulnerabilities,
    recommendedDefensiveActions: baselineBehavior.recommendedDefensiveActions,
    psycholinguisticClues: baselineBehavior.psycholinguisticClues,
    technicalSkills: baselineBehavior.technicalSkills,
    personalityTraits: baselineBehavior.personalityTraits,
    inferredLocations: [signals.timezone],
    potentialInterests: baselineBehavior.dominantDomain === 'security'
      ? ['Offensive Security', 'CTF Competitions', 'Privacy Protocols', 'Network Defense']
      : baselineBehavior.dominantDomain === 'developer'
      ? ['Open Source', 'Software Architecture', 'Continuous Delivery', 'API Engineering']
      : baselineBehavior.dominantDomain === 'creative'
      ? ['Visual Arts', 'Digital Illustration', 'UI/UX Design', 'Creative Branding']
      : baselineBehavior.dominantDomain === 'gaming'
      ? ['Competitive Gaming', 'Live Streaming', 'Game Mods', 'Voice Communities']
      : ['Social Trends', 'Media Consumption', 'Digital Culture', 'Online Communities'],
    identityCorrelation: `Analysis shows handle '@${target}' concentrated in the ${baselineBehavior.dominantDomain.toUpperCase()} domain (${baselineBehavior.categoryPercentages[baselineBehavior.dominantDomain] || 0}% share). Characteristic cross-site moniker reuse without random numeric affixes.`,
    investigationPivots: baselineBehavior.dominantDomain === 'developer'
      ? [
          {
            hop: 'Commit History & GPG Key Search',
            type: 'code',
            explanation: 'Audit public Git commit patches to extract author email, timezones, and signing keys.',
            recommendedAction: `git log --author="${target}" --format="%ae %ai"`,
          },
          {
            hop: 'Package Registry & Dep Graph',
            type: 'code',
            explanation: 'Audit npm/PyPI/crates.io for packages published under this namespace.',
            recommendedAction: `Check npmjs.com/~${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'security'
      ? [
          {
            hop: 'Bug Bounty Disclosures & CVE Hall of Fame',
            type: 'username',
            explanation: 'Search coordinated vulnerability disclosures and hacker rankings.',
            recommendedAction: `Audit HackerOne and Bugcrowd for @${target}`,
          },
          {
            hop: 'Keybase PGP & Cryptographic Identity Proofs',
            type: 'crypto',
            explanation: 'Cross-reference PGP key fingerprints linked to this handle.',
            recommendedAction: `keybase id ${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'gaming'
      ? [
          {
            hop: 'Steam Community & VAC History',
            type: 'username',
            explanation: 'Query SteamID database for match history, avatar caches, and alias history.',
            recommendedAction: `Lookup vanity URL steamcommunity.com/id/${target}`,
          },
          {
            hop: 'Interactive Live Streaming Archives',
            type: 'username',
            explanation: 'Inspect past VODs and chat log archives for time-of-day activity.',
            recommendedAction: `Cross-reference Twitch and Kick for @${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'creative'
      ? [
          {
            hop: 'Visual Portfolio Showcase Audit',
            type: 'domain',
            explanation: 'Audit Behance/Dribbble/ArtStation for contact forms, agency links, and client credits.',
            recommendedAction: `Review portfolio metadata on Behance for ${target}`,
          },
          {
            hop: 'Reverse Image & EXIF Extraction',
            type: 'username',
            explanation: 'Scan portfolio artwork for embedded camera and copyright EXIF signatures.',
            recommendedAction: `Extract EXIF metadata from published artwork`,
          },
        ]
      : [
          {
            hop: 'Cross-Network Social Graph Correlation',
            type: 'username',
            explanation: 'Correlate friend/follower mutual intersections across identified social networks.',
            recommendedAction: `Map mutual connections between public accounts for @${target}`,
          },
          {
            hop: 'Historical Avatar & Bio Fingerprinting',
            type: 'domain',
            explanation: 'Compare profile photos and bios across accounts for identical phrasing.',
            recommendedAction: `Cross-reference biography text snippets across found profiles`,
          },
        ],
    generatedAt: new Date().toISOString(),
    modelUsed: 'heuristic-rule-engine',
    fallbackNotice: clientInfo
      ? (isQuotaExceeded
          ? 'Server Gemini quota temporarily reached (429 Rate Limit). Dossier generated with high fidelity by the local heuristic engine. For unlimited real-time AI profiling, connect your personal key in the "Gemini AI" settings.'
          : 'Temporary high demand on Gemini clusters (503). Dossier generated by the behavioral heuristic engine.')
      : 'Gemini key not configured. Dossier generated by the behavioral heuristic engine.',
  });
}

export function profileRouter(): Router {
  const router = Router();
  router.post('/api/osint/profile', legacyProfile);
  return router;
}
