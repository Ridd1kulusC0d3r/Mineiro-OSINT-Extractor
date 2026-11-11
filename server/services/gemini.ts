import { GoogleGenAI } from '@google/genai';
import { COPILOT_RESPONSE_SCHEMA } from '../../src/ai/analystCopilot';
import { PUBLIC_MODE } from '../security/middleware';

// Initialize GoogleGenAI client lazily or safely with User-Agent telemetry
export function getGenAiClient(customApiKey?: string): { client: GoogleGenAI; isCustom: boolean } | null {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 10)
    ? customApiKey.trim()
    : (PUBLIC_MODE ? undefined : process.env.GEMINI_API_KEY);

  if (!apiKey) return null;
  return {
    client: new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'mineiro-username-intelligence/1.7.0',
        },
      },
    }),
    isCustom: Boolean(customApiKey && customApiKey.trim().length > 10),
  };
}

export const COPILOT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
] as const;

export function normalizeCopilotModel(model?: unknown): string {
  const requested = typeof model === 'string' ? model.trim() : '';
  return requested || COPILOT_MODELS[0];
}

export function classifyGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)) return 'rate_limited';
  if (/401|403|API key|permission|unauth/i.test(message)) return 'authentication';
  if (/404|not found|model.*available/i.test(message)) return 'model_unavailable';
  if (/503|UNAVAILABLE|high demand|timeout|timed out/i.test(message)) return 'temporary_unavailable';
  return 'provider_error';
}

export async function generateCopilotWithFallback(
  client: GoogleGenAI,
  prompt: string,
  preferredModel?: unknown
): Promise<{ parsed: any; modelUsed: string; attemptedModels: string[] }> {
  const preferred = normalizeCopilotModel(preferredModel);
  const candidates = [preferred, ...COPILOT_MODELS].filter((value, index, array) => array.indexOf(value) === index);
  const attemptedModels: string[] = [];
  const errors: string[] = [];

  for (const modelName of candidates) {
    attemptedModels.push(modelName);
    try {
      const response: any = await withTimeout(
        client.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: COPILOT_RESPONSE_SCHEMA,
            temperature: 0.2,
          },
        }),
        15000
      );

      const parsed = parseCleanJson(response.text || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Provider returned an invalid JSON object.');
      }

      return { parsed, modelUsed: modelName, attemptedModels };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const kind = classifyGeminiError(error);
      errors.push(`${modelName}: ${kind}: ${message}`);

      // Invalid credentials will fail identically for every model, so stop early.
      if (kind === 'authentication') break;
    }
  }

  throw new Error(`Gemini Copilot unavailable after ${attemptedModels.length} attempt(s). ${errors.join(' | ')}`);
}

// Helper function to extract and parse JSON cleanly
export function parseCleanJson(text: string): any {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

// Timeout helper to avoid uncomfortably long blocking calls on model backend spikes
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Resilient Gemini generateContent with cascading models and backoff retries for 503 / high demand spikes
export async function generateDossierWithGemini(
  aiClient: GoogleGenAI,
  prompt: string,
  preferredModel?: string
): Promise<{ data: any; modelUsed: string; quotaExceeded?: boolean } | null> {
  // Modern supported models from @google/genai guidelines - prioritizing gemini-3.8-flash for stability and speed
  const modernModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  // Filter out any deprecated models
  const deprecated = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
  const cleanPreferred = preferredModel && !deprecated.includes(preferredModel.trim())
    ? preferredModel.trim()
    : 'gemini-3.8-flash';

  const candidateModels = [cleanPreferred, ...modernModels].filter((v, i, a) => a.indexOf(v) === i);
  let quotaExceeded = false;

  for (const model of candidateModels) {
    try {
      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        10000
      );

      const rawText = response.text || '';
      if (rawText) {
        const parsed = parseCleanJson(rawText);
        if (parsed && (parsed.summary || parsed.archetype)) {
          return { data: parsed, modelUsed: model };
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isDemandSpike = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('timed out');
      const isRateLimited = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('exceeded your current quota');

      if (isRateLimited) {
        quotaExceeded = true;
      }

      console.log(`[Gemini Engine] Candidate '${model}' unavailable (${isDemandSpike ? '503 demand/timeout' : isRateLimited ? '429 rate limit' : 'error'}). Seamlessly cascading to next candidate...`);
      // Immediately cascade to next candidate without blocking delay
      continue;
    }
  }

  return quotaExceeded ? { data: null, modelUsed: 'quota-exceeded', quotaExceeded: true } : null;
}

export interface ExtractedEntities {
  industry: string;
  interests: string[];
  technicalFootprint: {
    level: 'None' | 'Minimal' | 'Moderate' | 'Advanced' | 'Expert';
    isTechProfessional: boolean;
    evidence: string;
    primaryTools?: string[];
  };
}

// Pass 1: Granular entity identification for Industry, Interests, and Technical Footprint
export async function evaluatePass1Entities(
  aiClient: GoogleGenAI,
  target: string,
  targetType: string,
  platformsList: string,
  categoryPercentages: Record<string, number>,
  categoryDistribution: Record<string, number>,
  emailData: any,
  preferredModel?: string
): Promise<ExtractedEntities | null> {
  const pass1Prompt = `You are the Pre-Profiling Entity Extraction Engine in Mineiro Username Intelligence OSINT.
Perform PASS 1 of a multi-pass evaluation on target "${target}" (${targetType}).

Discovered Platforms & Profiles:
${platformsList}

Platform Category Breakdown:
${Object.entries(categoryPercentages)
  .filter(([_, pct]) => pct > 0)
  .map(([cat, pct]) => `- ${cat}: ${pct}% (${categoryDistribution[cat]} platform(s))`)
  .join('\n')}

Email Data:
${emailData ? JSON.stringify(emailData) : 'None'}

TASK: Identify 'Industry', 'Interests', and 'Technical Footprint' as distinct metadata entities.
CRITICAL CONSTRAINT FOR TECHNICAL FOOTPRINT:
- Carefully distinguish between true tech professionals and non-tech users (e.g. creative artists, illustrators, gamers, musicians, athletes, runners, e-commerce sellers, students, social users).
- "isTechProfessional" MUST be FALSE if the target has no verified proof of active professional software engineering or cybersecurity research. Having an account on a social platform is NOT proof of being a tech professional.
- For non-tech users, set "level" to "None" or "Minimal", "isTechProfessional" to false, and identify their authentic real-world industry (e.g., "Creative Arts & Visual Design", "Music & Audio Production", "Endurance Athletics & Fitness", "Gaming & Interactive Entertainment", "E-Commerce & Digital Merchandising", "Academic & Scientific Research").

Respond strictly in valid JSON matching this schema:
{
  "industry": string,
  "interests": string[],
  "technicalFootprint": {
    "level": "None" | "Minimal" | "Moderate" | "Advanced" | "Expert",
    "isTechProfessional": boolean,
    "evidence": string,
    "primaryTools": string[]
  }
}`;

  try {
    const res = await generateDossierWithGemini(aiClient, pass1Prompt, preferredModel);
    if (res && res.data && res.data.industry && res.data.technicalFootprint) {
      const level = ['None', 'Minimal', 'Moderate', 'Advanced', 'Expert'].includes(res.data.technicalFootprint.level)
        ? res.data.technicalFootprint.level
        : 'None';
      return {
        industry: String(res.data.industry),
        interests: Array.isArray(res.data.interests) ? res.data.interests.map(String) : [],
        technicalFootprint: {
          level,
          isTechProfessional: Boolean(res.data.technicalFootprint.isTechProfessional),
          evidence: String(res.data.technicalFootprint.evidence || ''),
          primaryTools: Array.isArray(res.data.technicalFootprint.primaryTools)
            ? res.data.technicalFootprint.primaryTools.map(String)
            : [],
        },
      };
    }
  } catch (err) {
    console.warn('[Pass 1 Entity Extraction] Fallback to baseline entities:', err);
  }
  return null;
}

// Weight entities against verified platform activity patterns to prevent false tech labeling
export function weightEntitiesAgainstPatterns(
  entities: ExtractedEntities,
  foundPlatforms: any[],
  baselineBehavior: any,
  target: string
): {
  weightedEntities: ExtractedEntities;
  archetypeDirective: string;
} {
  const platformNames = new Set(foundPlatforms.map((p) => (p.platformName || '').toLowerCase()));
  const categoryCounts = baselineBehavior.categoryDistribution || {};
  const techPlatformCount = (categoryCounts.developer || 0) + (categoryCounts.security || 0);

  const hasGithub = platformNames.has('github');
  const hasGitlab = platformNames.has('gitlab');
  const hasBugBounty = platformNames.has('hackerone') || platformNames.has('bugcrowd') || platformNames.has('intigriti');
  const hasCtf = platformNames.has('hackthebox') || platformNames.has('tryhackme') || platformNames.has('ctftime');
  const lowerTarget = target.toLowerCase();
  const hasSecHandle = lowerTarget.includes('sec') || lowerTarget.includes('pwn') || lowerTarget.includes('root') || lowerTarget.includes('hack') || lowerTarget.includes('cyber');
  const hasDevHandle = lowerTarget.includes('dev') || lowerTarget.includes('code');

  const verifiedTechPresence = hasBugBounty || hasCtf || hasGithub || hasGitlab || (techPlatformCount >= 1 && (hasSecHandle || hasDevHandle));

  let isTechProfessional = entities.technicalFootprint.isTechProfessional;
  let level = entities.technicalFootprint.level;
  let evidence = entities.technicalFootprint.evidence;
  let industry = entities.industry;
  let interests = entities.interests.length > 0 ? entities.interests : baselineBehavior.interests;
  let primaryTools = entities.technicalFootprint.primaryTools && entities.technicalFootprint.primaryTools.length > 0
    ? entities.technicalFootprint.primaryTools
    : baselineBehavior.technicalFootprint.primaryTools || [];

  // STRICT CROSS-CHECK: If marked as tech professional, but 0 verified tech platforms or handle signals exist:
  if (isTechProfessional && !verifiedTechPresence) {
    isTechProfessional = false;
    level = 'Minimal';
    evidence = `Cross-examination against platform activity patterns detected 0 verified source code repositories, package distributions, or security credentials. Overriding tech classification to reflect authentic ${baselineBehavior.industry} footprint.`;
    industry = baselineBehavior.industry;
    interests = baselineBehavior.interests;
    primaryTools = baselineBehavior.technicalFootprint.primaryTools || [];
  }

  // Generate strict archetype weighting directive
  let archetypeDirective = '';
  if (!isTechProfessional) {
    archetypeDirective = `CRITICAL NON-TECH USER ENFORCEMENT:
Target is verified as a NON-TECH user in the "${industry}" sector (Technical Footprint Level: ${level}, isTechProfessional: false).
Platform activity patterns show no software development or cybersecurity participation.
You are STRICTLY FORBIDDEN from assigning any archetype, description, or skills referencing "Software Engineer", "Developer", "Programmer", "Systems Architect", "Cybersecurity Analyst", "Hacker", or "Security Researcher".
The Archetype MUST strictly reflect their authentic industry ("${industry}") and interests (${interests.join(', ')}).
Recommended Archetype alignment: "${baselineBehavior.archetype}".`;
  } else {
    archetypeDirective = `VERIFIED TECHNICAL FOOTPRINT:
Target has verified technical credentials in "${industry}" (Level: ${level}, isTechProfessional: true).
Synthesize an authentic technical archetype reflecting their verified technical sector (e.g., "${baselineBehavior.archetype}").`;
  }

  return {
    weightedEntities: {
      industry,
      interests,
      technicalFootprint: {
        level,
        isTechProfessional,
        evidence,
        primaryTools,
      },
    },
    archetypeDirective,
  };
}
