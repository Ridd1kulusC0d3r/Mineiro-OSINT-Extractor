// Extract follow-up leads (pivots) from public profile text and plan them within a request budget.

export type PivotType = 'email' | 'domain' | 'handle' | 'url';

export interface Pivot {
  type: PivotType;
  value: string;
  origin: string; // where the lead was seen (platform id, URL...)
  depth: number;
}

// Hosts that are platforms rather than personal leads.
const GENERIC_DOMAINS = new Set([
  'github.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'youtu.be',
  'google.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'w3.org', 'schema.org', 'gravatar.com',
  'wikipedia.org', 'reddit.com', 'tiktok.com', 't.me', 'discord.gg', 'bit.ly',
]);

const EMAIL = /[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}/gi;
const URL_RE = /https?:\/\/[^\s"'<>)]{4,300}/gi;
const HANDLE = /(?<![\w@.])@([a-z0-9_.]{3,30})\b/gi;

function hostOf(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

export function extractPivots(text: string, origin: string, depth = 1): Pivot[] {
  const out = new Map<string, Pivot>();
  const add = (type: PivotType, value: string) => {
    const key = `${type}:${value}`;
    if (!out.has(key)) out.set(key, { type, value, origin, depth });
  };

  for (const match of text.matchAll(EMAIL)) add('email', match[0].toLowerCase());

  for (const match of text.matchAll(URL_RE)) {
    const url = match[0].replace(/[.,;]+$/, '');
    const host = hostOf(url);
    if (!host) continue;
    if (GENERIC_DOMAINS.has(host)) add('url', url);
    else add('domain', host);
  }

  for (const match of text.matchAll(HANDLE)) {
    if (!match[1].includes('.') || !/\.(com|org|net|io)$/.test(match[1])) add('handle', match[1].toLowerCase());
  }

  return [...out.values()];
}

export interface PivotPlan {
  accepted: Pivot[];
  skipped: Array<Pivot & { reason: 'seen' | 'depth' | 'budget' }>;
}

/** Keeps pivots within depth and request budget; already-seen values are never re-queued. */
export function planPivots(
  candidates: Pivot[],
  options: { maxDepth: number; budget: number; seen?: Set<string> }
): PivotPlan {
  const seen = options.seen ?? new Set<string>();
  const accepted: Pivot[] = [];
  const skipped: PivotPlan['skipped'] = [];
  // Emails and handles are the strongest leads; shallow pivots first.
  const rank: Record<PivotType, number> = { email: 0, handle: 1, domain: 2, url: 3 };

  for (const pivot of [...candidates].sort((a, b) => a.depth - b.depth || rank[a.type] - rank[b.type])) {
    const key = `${pivot.type}:${pivot.value}`;
    if (seen.has(key)) { skipped.push({ ...pivot, reason: 'seen' }); continue; }
    if (pivot.depth > options.maxDepth) { skipped.push({ ...pivot, reason: 'depth' }); continue; }
    if (accepted.length >= options.budget) { skipped.push({ ...pivot, reason: 'budget' }); continue; }
    seen.add(key);
    accepted.push(pivot);
  }
  return { accepted, skipped };
}
