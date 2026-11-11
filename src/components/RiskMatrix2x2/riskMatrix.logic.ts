// Pure computation of the 2x2 risk matrix: sensitivity and activity heuristics, quadrants, filters, size.
// No React, no DOM. Tested in tests/riskMatrix.logic.test.ts.
import type { ScanResult } from '../../types';

export interface RiskMatrixAccount {
  id: string;
  platformName: string;
  category: string;
  url: string;
  sensitivity: number; // 0 - 100
  activity: number;    // 0 - 100
  quadrant: 'critical' | 'latent' | 'surface' | 'peripheral';
  quadrantTitle: string;
  description: string;
  priorityScore: number;
  responseTimeMs?: number;
  statusCode?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export type QuadrantFilter = 'all' | RiskMatrixAccount['quadrant'];

// Heuristic calculation of Sensitivity (0 - 100) based on platform category and identity characteristics
export function calculatePlatformSensitivity(platform: ScanResult): number {
  const name = platform.platformName.toLowerCase();
  const category = (platform.category || '').toLowerCase();

  // Tier 1: Highest sensitivity (Financial, Cloud, Crypto, Security, Critical Dev Vaults)
  if (
    category === 'finance' || 
    category === 'crypto' || 
    category === 'security' ||
    name.includes('paypal') ||
    name.includes('coinbase') ||
    name.includes('binance') ||
    name.includes('keybase') ||
    name.includes('proton') ||
    name.includes('stripe') ||
    name.includes('hackerone') ||
    name.includes('bugcrowd')
  ) {
    return 85 + (hashString(name) % 13); // 85 - 97
  }

  // Tier 2: High sensitivity (Source Code, Cloud Services, Package Registries, Professional Career)
  if (
    category === 'developer' || 
    category === 'cloud' || 
    category === 'career' ||
    name.includes('github') ||
    name.includes('gitlab') ||
    name.includes('docker') ||
    name.includes('npm') ||
    name.includes('pypi') ||
    name.includes('linkedin') ||
    name.includes('aws')
  ) {
    return 65 + (hashString(name) % 18); // 65 - 82
  }

  // Tier 3: Moderate sensitivity (Messaging, Direct Communications, Forums, Blogs)
  if (
    category === 'messaging' || 
    category === 'social' || 
    category === 'tech' ||
    name.includes('telegram') ||
    name.includes('discord') ||
    name.includes('signal') ||
    name.includes('reddit') ||
    name.includes('twitter') ||
    name.includes('x') ||
    name.includes('medium') ||
    name.includes('substack')
  ) {
    return 45 + (hashString(name) % 18); // 45 - 62
  }

  // Tier 4: Lower sensitivity (Gaming, Music, Creative, Video, Lifestyle)
  if (
    category === 'gaming' || 
    category === 'music' || 
    category === 'creative' ||
    category === 'entertainment' ||
    name.includes('steam') ||
    name.includes('spotify') ||
    name.includes('twitch') ||
    name.includes('soundcloud') ||
    name.includes('pinterest') ||
    name.includes('deviantart')
  ) {
    return 20 + (hashString(name) % 22); // 20 - 41
  }

  // Default baseline
  return 30 + (hashString(name) % 25);
}

// Heuristic calculation of Activity Frequency (0 - 100)
export function calculateActivityFrequency(platform: ScanResult, sensitivity: number): number {
  const name = platform.platformName.toLowerCase();
  const category = (platform.category || '').toLowerCase();

  let baseActivity = 50;

  // High-cadence interactive platforms
  if (
    name.includes('twitter') || 
    name.includes('github') || 
    name.includes('reddit') || 
    name.includes('telegram') || 
    name.includes('discord') || 
    name.includes('linkedin') ||
    category === 'social' ||
    category === 'messaging'
  ) {
    baseActivity = 72 + (hashString(name + 'act') % 23); // 72 - 94
  } else if (
    category === 'developer' || 
    category === 'gaming' || 
    name.includes('twitch') || 
    name.includes('spotify')
  ) {
    baseActivity = 55 + (hashString(name + 'act') % 25); // 55 - 79
  } else if (
    category === 'finance' || 
    category === 'crypto' || 
    name.includes('keybase') ||
    name.includes('gravatar') ||
    name.includes('docker')
  ) {
    // Dormant repositories or static utility registrations
    baseActivity = 25 + (hashString(name + 'act') % 28); // 25 - 52
  } else {
    baseActivity = 35 + (hashString(name + 'act') % 35); // 35 - 69
  }

  // Latency modifier: fast response times often correlate with active edge nodes
  if (platform.responseTimeMs && platform.responseTimeMs < 250) {
    baseActivity = Math.min(98, baseActivity + 5);
  }

  return Math.max(10, Math.min(98, baseActivity));
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** One account per found result, placed in a quadrant by sensitivity and activity (50 is the split). */
export function buildRiskAccounts(results: ScanResult[]): RiskMatrixAccount[] {
  const found = results.filter((r) => r.status === 'found');
  return found.map((r) => {
    const sensitivity = calculatePlatformSensitivity(r);
    const activity = calculateActivityFrequency(r, sensitivity);
    
    let quadrant: 'critical' | 'latent' | 'surface' | 'peripheral';
    let quadrantTitle = '';
    let description = '';

    if (sensitivity >= 50 && activity >= 50) {
      quadrant = 'critical';
      quadrantTitle = 'Critical Threat & Prime Target';
      description = 'High privilege data (financial, credentials, source code) with active real-time footprint.';
    } else if (sensitivity >= 50 && activity < 50) {
      quadrant = 'latent';
      quadrantTitle = 'Latent Vault / High Privilege';
      description = 'High sensitivity account with low rotation/activity. High impact if compromised.';
    } else if (sensitivity < 50 && activity >= 50) {
      quadrant = 'surface';
      quadrantTitle = 'Broad Public Surface';
      description = 'Frequent social or gaming presence. Rich source for behavioral, linguistic, and timeline clues.';
    } else {
      quadrant = 'peripheral';
      quadrantTitle = 'Peripheral / Low Impact';
      description = 'Low sensitivity profile with infrequent usage. Secondary forensic utility.';
    }

    // Priority score: weighted combination (60% sensitivity, 40% activity)
    const priorityScore = Math.round(sensitivity * 0.6 + activity * 0.4);

    return {
      id: r.platformId,
      platformName: r.platformName,
      category: r.category,
      url: r.url,
      sensitivity,
      activity,
      quadrant,
      quadrantTitle,
      description,
      priorityScore,
      responseTimeMs: r.responseTimeMs,
      statusCode: r.statusCode,
    };
  });
}

/** Accounts per quadrant, and in total. */
export function countQuadrants(accounts: RiskMatrixAccount[]): Record<QuadrantFilter, number> {
  return {
    all: accounts.length,
    critical: accounts.filter((a) => a.quadrant === 'critical').length,
    latent: accounts.filter((a) => a.quadrant === 'latent').length,
    surface: accounts.filter((a) => a.quadrant === 'surface').length,
    peripheral: accounts.filter((a) => a.quadrant === 'peripheral').length,
  };
}

/** Accounts in the active quadrant whose name, category or URL contains the search. */
export function filterRiskAccounts(accounts: RiskMatrixAccount[], activeQuadrantFilter: QuadrantFilter, searchQuery: string): RiskMatrixAccount[] {
  return accounts.filter((acc) => {
    if (activeQuadrantFilter !== 'all' && acc.quadrant !== activeQuadrantFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        acc.platformName.toLowerCase().includes(q) ||
        acc.category.toLowerCase().includes(q) ||
        acc.url.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

/** SVG size for a container width: at least 320 wide, height 64% of the width within 460..640. */
export function matrixDimensions(containerClientWidth: number): { width: number; height: number } {
  const clientWidth = containerClientWidth || 700;
  const width = Math.max(320, clientWidth);
  const height = Math.max(460, Math.min(640, Math.round(width * 0.64)));
  return { width, height };
}
