/**
 * Standalone Gemini AI OSINT Profiling Module for Mineiro Username Extractor
 * Can be imported into any Node.js/TypeScript project or executed directly.
 * 
 * Usage in code:
 *   import { profileTargetWithGemini } from './modules/geminiProfiler';
 *   const dossier = await profileTargetWithGemini({ target: 'example', apiKey: 'AIzaSy...' });
 * 
 * CLI execution:
 *   npx tsx src/modules/geminiProfiler.ts <handle>
 */

import { GoogleGenAI } from '@google/genai';
import { extractPlatformSignals } from '../data/platformSignalExtractor';
import { computeBehavioralProfile } from '../data/behavioralEngine';
import { evaluateThreatActorHeuristics } from '../data/threatActorHeuristics';
import { BehavioralSignals, ThreatActorAnalysis } from '../types';

export interface ProfilerPlatformInput {
  platformName: string;
  category: string;
  url: string;
}

export interface ProfilerOptions {
  target: string;
  targetType?: 'username' | 'email';
  foundPlatforms?: ProfilerPlatformInput[];
  emailData?: any;
  apiKey?: string;
  model?: string;
}

export interface ProfilerOutput {
  target: string;
  targetType: string;
  summary: string;
  threatLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  footprintScore: number;
  archetype: string;
  archetypeDescription?: string;
  threatActorAnalysis?: ThreatActorAnalysis;
  behavioralSignals?: BehavioralSignals;
  threatVulnerabilities?: string[];
  recommendedDefensiveActions?: string[];
  psycholinguisticClues?: string[];
  technicalSkills: string[];
  personalityTraits: string[];
  inferredLocations: string[];
  potentialInterests: string[];
  identityCorrelation: string;
  investigationPivots: Array<{
    hop: string;
    type: 'username' | 'domain' | 'email' | 'crypto' | 'code';
    explanation: string;
    recommendedAction: string;
  }>;
  modelUsed: string;
  generatedAt: string;
}

/**
 * Validates a user's Google Gemini API key
 */
export async function validateGeminiKey(apiKey: string, model: string = 'gemini-3.8-flash'): Promise<boolean> {
  if (!apiKey || apiKey.trim().length < 15) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const res = await ai.models.generateContent({
      model,
      contents: 'Respond with "OK"',
    });
    return Boolean(res.text);
  } catch {
    return false;
  }
}

/**
 * Synthesizes an OSINT intelligence dossier using Gemini AI
 */
export async function profileTargetWithGemini(options: ProfilerOptions): Promise<ProfilerOutput> {
  const apiKey = options.apiKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY in .env or pass apiKey in options.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'mineiro-osint-profiler' },
    },
  });

  const deprecated = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
  const userModel = options.model && !deprecated.includes(options.model.trim())
    ? options.model.trim()
    : 'gemini-3.8-flash';

  const target = options.target.trim();
  const targetType = options.targetType || (target.includes('@') ? 'email' : 'username');
  const platforms = options.foundPlatforms || [];

  // Extract explicit timezone and language platform signals
  const signals = extractPlatformSignals(platforms, target, options.emailData);
  const baselineBehavior = computeBehavioralProfile(platforms, target, options.emailData);
  const threatActorHeuristics = baselineBehavior.threatActorAnalysis || evaluateThreatActorHeuristics(platforms, target, options.emailData);

  const platformsFormatted = platforms.length > 0
    ? platforms.map((p) => `- ${p.platformName} (${p.category}): ${p.url}`).join('\n')
    : 'None explicitly provided.';

  const prompt = `You are the AI Intelligence Profiling Engine inside Mineiro Username Extractor, a unified OSINT analysis system.
Analyze the following target reconnaissance data and generate an actionable, forensic OSINT dossier with deep behavioral, timezone, language, occupation cross-referencing, threat actor heuristics, and granular archetype analysis.

Target: "${target}"
Target Type: ${targetType}
Discovered Platforms & Profiles (${platforms.length} total):
${platformsFormatted}

Platform Category Breakdown:
${Object.entries(baselineBehavior.categoryPercentages)
  .filter(([_, pct]) => pct > 0)
  .map(([cat, pct]) => `- ${cat}: ${pct}% (${baselineBehavior.categoryDistribution[cat]} platform(s))`)
  .join('\n')}

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
${options.emailData ? JSON.stringify(options.emailData, null, 2) : 'No direct email data available.'}

CRITICAL ARCHETYPE & FORENSIC PROFILING DIRECTIVES:
1. STRICTLY FORBIDDEN from outputting generic placeholders like "Casual Social Citizen", "Corporate Professional", "Low-Footprint Casual User", "Single-Hub Digital User", or "Tech Professional".
2. Synthesize an authentic, granular, high-precision archetype directly reflecting their verified technical sector, domain markers, and handle moniker semantics (e.g. '${baselineBehavior.archetype}').
   - If the handle has 'sec', 'pwn', 'hack' or technical footprints, profile as a specialized Cybersecurity / Infosec Researcher.
   - For creative users: e.g. "Concept Character Artist & 2D Illustrator", "Product Designer & Visual Systems Specialist", "Fine Art & Editorial Photographer".
   - For gamers: e.g. "Competitive Esports Player & Interactive Streamer", "Precision Speedrunner & Game Mechanics Analyst", "Sandbox Virtual World Creator & Modeler".
   - For audio/musicians: e.g. "Independent Electronic Music Producer & Sound Designer", "Digital Audio Curator & Track Collector".
   - For writers/commentators: e.g. "Investigative Essayist & Substack Newsletter Writer", "Narrative Fiction Author & Serial Worldbuilder".
   - For developers: e.g. "Full-Stack Software Architect & Cloud Systems Engineer", "Open-Source Contributor & Software Systems Developer".
   - For security researchers: e.g. "Offensive Security Specialist & Vulnerability Researcher", "Elite Crowdsourced Bug Bounty Hunter & Security Researcher".

CRITICAL THREAT ACTOR IDENTIFICATION HEURISTICS:
1. Cross-reference user occupation data against platform-specific behavior patterns instead of blindly applying a default "professional" tag.
2. Differentiate between:
   - Rogue / Underground threat actors (participation on cracking/breached forums, credential dump sharing, offensive commodity weaponization, dual-identity concealment).
   - Authorized cybersecurity professionals (accredited bug bounty hunters on HackerOne/Bugcrowd, ethical CTF players on HackTheBox/TryHackMe, blue team defenders).
   - Benign civilians (creative artists, gamers, students, corporate employees, e-commerce sellers) who must NEVER be tagged as threat actors.
3. Discrepancy Evaluation:
   - If claimed or inferred occupation is corporate/academic, but user is active on underground/cracking markets, flag a HIGH_RISK_DISCREPANCY (Potential Insider Risk or Rogue Moonlighting).
   - If inferred occupation is completely non-cyber (e.g. Graphic Designer, Competitive Gamer, Musician), confirm NEUTRAL_BENIGN with 0% threat actor suspicion.

Respond strictly in valid JSON format matching this schema:
{
  "target": "${target}",
  "targetType": "${targetType}",
  "summary": "2-3 crisp sentences synthesizing the target's digital footprint, identity cohesion, and primary domain of activity.",
  "threatLevel": "Low" | "Moderate" | "Elevated" | "Critical",
  "footprintScore": number between 10 and 95,
  "archetype": "Specific archetype title representing their genuine dominant domain (e.g. '${baselineBehavior.archetype}')",
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
      "Specific language indicator e.g. '${signals.languageSignals[0] || 'International English technical communication'}'"
    ],
    "linguisticStyle": "Observed psycholinguistic pattern e.g. '${signals.linguisticStyle}'",
    "socialExposureRisk": "Minimal" | "Moderate" | "Elevated" | "Severe",
    "handlePersistencePattern": "Single Moniker Reuse" | "Predictable Affixes" | "Segmented Personas" | "High-Entropy Anon",
    "anonymityEffort": "Low" | "Moderate" | "High",
    "accountCreationEra": "Estimated account era, e.g. 'Established Veteran (2012-2018)' or 'Recent Emergence (2020+)'"
  },
  "threatVulnerabilities": [
    "Vulnerability 1, e.g. 'Public commit history exposing direct work email and personal GPG signature'",
    "Vulnerability 2, e.g. 'Identical handle reuse on legacy forums susceptible to credential stuffing'"
  ],
  "recommendedDefensiveActions": [
    "Defensive action 1, e.g. 'Deploy privacy WHOIS masking on personal domains'",
    "Defensive action 2, e.g. 'Separate professional open-source commit emails from personal identity'"
  ],
  "psycholinguisticClues": [
    "Clue 1, e.g. 'Consistent usage of snake_case syntax in technical handle choices'",
    "Clue 2, e.g. 'Affinity for open protocol standards over walled-garden commercial platforms'"
  ],
  "technicalSkills": ["skill 1", "skill 2", "skill 3"],
  "personalityTraits": ["trait 1", "trait 2", "trait 3"],
  "inferredLocations": ["potential location or 'Global / Western UTC' based on clues"],
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

  const candidateModels = [userModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'].filter((v, i, a) => a.indexOf(v) === i);
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      let clean = (response.text || '').trim();
      if (clean.startsWith('```')) {
        clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      }
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(clean);
      const behavioralSignals: BehavioralSignals = {
        opsecHygiene: parsed.behavioralSignals?.opsecHygiene || 'Moderate',
        timezone: parsed.behavioralSignals?.timezone || signals.timezone,
        timezoneSignals: parsed.behavioralSignals?.timezoneSignals?.length ? parsed.behavioralSignals.timezoneSignals : signals.timezoneSignals,
        activeTimezoneWindow: parsed.behavioralSignals?.activeTimezoneWindow || signals.activeTimezoneWindow,
        language: parsed.behavioralSignals?.language || signals.language,
        primaryLanguage: parsed.behavioralSignals?.primaryLanguage || signals.primaryLanguage,
        secondaryLanguages: parsed.behavioralSignals?.secondaryLanguages || signals.secondaryLanguages,
        languageSignals: parsed.behavioralSignals?.languageSignals?.length ? parsed.behavioralSignals.languageSignals : signals.languageSignals,
        linguisticStyle: parsed.behavioralSignals?.linguisticStyle || signals.linguisticStyle,
        socialExposureRisk: parsed.behavioralSignals?.socialExposureRisk || 'Moderate',
        handlePersistencePattern: parsed.behavioralSignals?.handlePersistencePattern || 'Single Moniker Reuse',
        anonymityEffort: parsed.behavioralSignals?.anonymityEffort || 'Moderate',
        accountCreationEra: parsed.behavioralSignals?.accountCreationEra || 'Established Veteran (2015-2021)',
      };

      const threatActorAnalysisResult: ThreatActorAnalysis = {
        isThreatActorSuspect: typeof parsed.threatActorAnalysis?.isThreatActorSuspect === 'boolean'
          ? parsed.threatActorAnalysis.isThreatActorSuspect
          : threatActorHeuristics.isThreatActorSuspect,
        threatActorCategory: parsed.threatActorAnalysis?.threatActorCategory || threatActorHeuristics.threatActorCategory,
        threatActorScore: typeof parsed.threatActorAnalysis?.threatActorScore === 'number'
          ? parsed.threatActorAnalysis.threatActorScore
          : threatActorHeuristics.threatActorScore,
        confidenceScore: typeof parsed.threatActorAnalysis?.confidenceScore === 'number'
          ? parsed.threatActorAnalysis.confidenceScore
          : threatActorHeuristics.confidenceScore,
        verdictTitle: parsed.threatActorAnalysis?.verdictTitle || threatActorHeuristics.verdictTitle,
        verdictSummary: parsed.threatActorAnalysis?.verdictSummary || threatActorHeuristics.verdictSummary,
        occupationCrossReference: {
          inferredOccupation: parsed.threatActorAnalysis?.occupationCrossReference?.inferredOccupation || threatActorHeuristics.occupationCrossReference.inferredOccupation,
          platformBehaviorPattern: parsed.threatActorAnalysis?.occupationCrossReference?.platformBehaviorPattern || threatActorHeuristics.occupationCrossReference.platformBehaviorPattern,
          consistencyVerdict: parsed.threatActorAnalysis?.occupationCrossReference?.consistencyVerdict || threatActorHeuristics.occupationCrossReference.consistencyVerdict,
          analysis: parsed.threatActorAnalysis?.occupationCrossReference?.analysis || threatActorHeuristics.occupationCrossReference.analysis,
        },
        observedTTPs: parsed.threatActorAnalysis?.observedTTPs?.length
          ? parsed.threatActorAnalysis.observedTTPs
          : threatActorHeuristics.observedTTPs,
        indicatorMatches: parsed.threatActorAnalysis?.indicatorMatches?.length
          ? parsed.threatActorAnalysis.indicatorMatches
          : threatActorHeuristics.indicatorMatches,
        mitreTactics: parsed.threatActorAnalysis?.mitreTactics || threatActorHeuristics.mitreTactics,
      };

      return {
        ...parsed,
        archetype: parsed.archetype || baselineBehavior.archetype,
        archetypeDescription: parsed.archetypeDescription || baselineBehavior.archetypeDescription,
        threatActorAnalysis: threatActorAnalysisResult,
        behavioralSignals,
        modelUsed: model,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate profile with Gemini AI');
}
