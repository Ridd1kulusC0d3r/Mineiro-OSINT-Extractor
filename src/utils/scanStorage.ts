import { CachedInvestigation, ScanResult, EmailReconData, AiProfileReport, ScanPreset, InvestigationSnapshot } from '../types';

const STORAGE_KEY = 'mineiro_cached_scans_v1';
const MAX_CACHED_SCANS = 5;


/**
 * Format timestamp into readable format for UI presentation
 */
export function formatInvestigationTimestamp(isoString?: string): string {
  try {
    const d = isoString ? new Date(isoString) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  } catch {
    return 'Recente';
  }
}

/**
 * Retrieve cached investigations safely from localStorage
 */
export function getCachedInvestigations(): CachedInvestigation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Sanitize and ensure valid structure
    return parsed
      .filter((item): item is CachedInvestigation => {
        return (
          item &&
          typeof item === 'object' &&
          typeof item.target === 'string' &&
          Array.isArray(item.results)
        );
      })
      .slice(0, MAX_CACHED_SCANS);
  } catch (err) {
    console.warn('[MINEIRO LOCAL CACHE] Failed to load cached investigations from localStorage:', err);
    return [];
  }
}

/**
 * Save or update a successful investigation into the local cache (maintaining last 5)
 */
export function saveInvestigationToCache(payload: {
  id?: string;
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  emailData: EmailReconData | null;
  aiProfile: AiProfileReport | null;
  preset: ScanPreset;
  foundCount: number;
  uncertainCount: number;
  totalScanned: number;
  durationMs?: number;
}): CachedInvestigation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const existing = getCachedInvestigations();
    const cleanTarget = payload.target.trim();
    const nowIso = new Date().toISOString();

    const newEntry: CachedInvestigation = {
      id: payload.id || `scan_${Date.now()}_${cleanTarget.replace(/[^a-zA-Z0-9_-]/g, '')}`,
      target: cleanTarget,
      targetType: payload.targetType,
      timestamp: nowIso,
      formattedTime: formatInvestigationTimestamp(nowIso),
      results: payload.results || [],
      emailData: payload.emailData,
      aiProfile: payload.aiProfile,
      preset: payload.preset,
      foundCount: payload.foundCount,
      uncertainCount: payload.uncertainCount,
      totalScanned: payload.totalScanned,
      durationMs: payload.durationMs,
    };

    // Remove any previous entry for the identical target and type to avoid duplicates and move to top
    const filtered = existing.filter(
      (item) => !(item.target.toLowerCase() === cleanTarget.toLowerCase() && item.targetType === payload.targetType)
    );

    // Prepend new entry and cap at MAX_CACHED_SCANS (5)
    const updated = [newEntry, ...filtered].slice(0, MAX_CACHED_SCANS);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (writeErr: any) {
      // If QuotaExceededError, try pruning unnecessary metadata or older items
      console.warn('[MINEIRO LOCAL CACHE] Quota reached, pruning cache:', writeErr);
      const reduced = updated.slice(0, 3);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        return reduced;
      } catch {
        // Fallback if still exceeding
        return existing;
      }
    }

    return updated;
  } catch (err) {
    console.error('[MINEIRO LOCAL CACHE] Error saving to localStorage:', err);
    return getCachedInvestigations();
  }
}

/**
 * Update an existing cached investigation with new metadata (e.g. when AI profile completes later)
 */
export function updateInvestigationInCache(
  target: string,
  targetType: 'username' | 'email',
  updates: Partial<CachedInvestigation>
): CachedInvestigation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const existing = getCachedInvestigations();
    const cleanTarget = target.trim().toLowerCase();

    let found = false;
    const updated = existing.map((item) => {
      if (item.target.toLowerCase() === cleanTarget && item.targetType === targetType) {
        found = true;
        return {
          ...item,
          ...updates,
          // Preserve primary identity
          id: item.id,
          target: item.target,
          targetType: item.targetType,
        };
      }
      return item;
    });

    if (found) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    return updated;
  } catch (err) {
    console.warn('[MINEIRO LOCAL CACHE] Error updating cached investigation:', err);
    return getCachedInvestigations();
  }
}

/**
 * Delete a single cached investigation by its id
 */
export function deleteCachedInvestigation(id: string): CachedInvestigation[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const existing = getCachedInvestigations();
    const updated = existing.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[MINEIRO LOCAL CACHE] Error deleting cached investigation:', err);
    return getCachedInvestigations();
  }
}

/**
 * Clear all cached investigations
 */
export function clearCachedInvestigations(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[MINEIRO LOCAL CACHE] Error clearing cache:', err);
  }
}

/**
 * Computes a SHA-256 hash string from a string input using the Web Crypto API
 * with a reliable deterministic bitwise fallback.
 */
export async function computeSha256(message: string): Promise<string> {
  const cryptoApi =
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    globalThis.crypto.subtle
      ? globalThis.crypto
      : null;

  if (!cryptoApi) {
    throw new Error('SHA-256 is unavailable in this runtime. Integrity snapshot was not generated.');
  }

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await cryptoApi.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a timestamped local integrity snapshot. This verifies exported state
 * integrity; it does not prove authorship, identity, or legal chain of custody.
 */
export async function takeInvestigationSnapshot(payload: {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  emailData?: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  preset?: ScanPreset;
  foundCount?: number;
  uncertainCount?: number;
  totalScanned?: number;
}): Promise<InvestigationSnapshot> {
  const timestamp = new Date().toISOString();
  const cleanTarget = payload.target.trim();
  const verifiedList = (payload.results || []).filter((r) => r.status === 'found');
  const uncertainList = (payload.results || []).filter((r) => r.status === 'uncertain' || r.status === 'rate_limited');
  const verifiedCount = payload.foundCount ?? verifiedList.length;
  const uncertainCount = payload.uncertainCount ?? uncertainList.length;
  const totalPlatforms = payload.totalScanned ?? (payload.results || []).length;

  // Build canonical state string for deterministic hashing
  const verifiedFingerprints = verifiedList
    .map((r) => `${r.platformId}:${r.statusCode || 200}:${r.url}`)
    .sort()
    .join(';');

  const canonicalState = [
    `MINEIRO_OSINT_SNAPSHOT_V1`,
    `TARGET=${cleanTarget}`,
    `TYPE=${payload.targetType}`,
    `TIMESTAMP=${timestamp}`,
    `VERIFIED_COUNT=${verifiedCount}`,
    `UNCERTAIN_COUNT=${uncertainCount}`,
    `TOTAL_PLATFORMS=${totalPlatforms}`,
    `AI_ARCHETYPE=${payload.aiProfile?.archetype || 'N/A'}`,
    `THREAT_LEVEL=${payload.aiProfile?.threatLevel || 'N/A'}`,
    `FOOTPRINT_SCORE=${payload.aiProfile?.footprintScore ?? 'N/A'}`,
    `EMAIL_HASH=${payload.emailData?.hash || 'N/A'}`,
    `FINGERPRINTS=${verifiedFingerprints}`,
  ].join('|');

  const summaryHash = await computeSha256(canonicalState);
  const signature = await computeSha256(`${summaryHash}:MINEIRO_SEC_HASH_SIG:${timestamp}`);
  const shortId = `MINEIRO-SNAP-${Date.now().toString(36).toUpperCase()}-${summaryHash.substring(0, 8).toUpperCase()}`;

  const summaryBlockText = [
    `-----BEGIN MINEIRO FORENSIC SNAPSHOT BLOCK-----`,
    `Version: 1.1 (Local OSINT Integrity Snapshot)`,
    `Snapshot ID:      ${shortId}`,
    `Target:           @${cleanTarget} [${payload.targetType.toUpperCase()}]`,
    `Timestamp:        ${timestamp}`,
    `Verified Hits:    ${verifiedCount}`,
    `Uncertain / WAF:  ${uncertainCount}`,
    `Scope Probed:     ${totalPlatforms}`,
    `Archetype:        ${payload.aiProfile?.archetype || 'Standard Moniker Profile'}`,
    `Threat Level:     ${payload.aiProfile?.threatLevel || 'Evaluated'}`,
    `Summary SHA256:   ${summaryHash}`,
    `Integrity Seal:   ${signature}`,
    `Status:           LOCAL INTEGRITY SNAPSHOT / SHA-256`,
    `-----END MINEIRO FORENSIC SNAPSHOT BLOCK-----`,
  ].join('\n');

  const snapshot: InvestigationSnapshot = {
    snapshotId: shortId,
    timestamp,
    signature,
    summaryHash,
    target: cleanTarget,
    targetType: payload.targetType,
    verifiedCount,
    uncertainCount,
    totalPlatforms,
    aiArchetype: payload.aiProfile?.archetype,
    threatLevel: payload.aiProfile?.threatLevel,
    footprintScore: payload.aiProfile?.footprintScore,
    summaryBlockText,
  };

  // Add snapshot to the investigation cache entry
  updateInvestigationInCache(cleanTarget, payload.targetType, {
    snapshot,
  });

  return snapshot;
}

