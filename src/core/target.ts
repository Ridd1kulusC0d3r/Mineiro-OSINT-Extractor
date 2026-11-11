// Pure helpers that make the search field forgiving: normalise what the analyst typed or pasted
// and, when it is clearly something else, suggest the right input instead of scanning garbage.

export type TargetMode = 'username' | 'email';
export type TargetIssue = 'looks_like_email' | 'has_spaces' | 'profile_url' | 'invalid_email';

export interface TargetAnalysis {
  /** value that is safe to scan: trimmed, `@` prefix removed in username mode */
  clean: string;
  issue?: TargetIssue;
  /** a replacement the UI can offer with one click */
  suggestion?: string;
  /** detector id when the suggestion was read from a profile URL */
  platformId?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface ProfilePattern {
  id: string;
  urlPattern: string;
}

/** Turns "https://github.com/{username}" into a regex that captures the handle of a pasted profile URL. */
function compile(patterns: ProfilePattern[]): Array<{ id: string; re: RegExp }> {
  const out: Array<{ id: string; re: RegExp }> = [];
  for (const { id, urlPattern } of patterns) {
    if (!urlPattern.includes('{username}') || urlPattern.includes('{email}')) continue;
    if ((urlPattern.match(/\{username\}/g) || []).length !== 1) continue;
    const [head, tail] = urlPattern.split('{username}');
    const source = `^${escapeRegex(head)}([^/?#&\\s]+)${escapeRegex(tail)}/?(?:[?#].*)?$`;
    out.push({ id, re: new RegExp(source, 'i') });
  }
  return out;
}

const cache = new WeakMap<ProfilePattern[], Array<{ id: string; re: RegExp }>>();

export function extractHandleFromProfileUrl(
  url: string,
  patterns: ProfilePattern[]
): { handle: string; platformId: string } | null {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  let compiled = cache.get(patterns);
  if (!compiled) {
    compiled = compile(patterns);
    cache.set(patterns, compiled);
  }
  for (const { id, re } of compiled) {
    const match = trimmed.match(re);
    if (match) {
      try {
        return { handle: decodeURIComponent(match[1]).replace(/^@/, ''), platformId: id };
      } catch {
        return { handle: match[1].replace(/^@/, ''), platformId: id };
      }
    }
  }
  return null;
}

export function analyzeTarget(raw: string, mode: TargetMode, patterns: ProfilePattern[] = []): TargetAnalysis {
  const trimmed = raw.trim();
  if (!trimmed) return { clean: '' };

  if (mode === 'email') {
    return EMAIL.test(trimmed) ? { clean: trimmed.toLowerCase() } : { clean: trimmed, issue: 'invalid_email' };
  }

  const fromUrl = extractHandleFromProfileUrl(trimmed, patterns);
  if (fromUrl) return { clean: trimmed, issue: 'profile_url', suggestion: fromUrl.handle, platformId: fromUrl.platformId };

  if (EMAIL.test(trimmed)) return { clean: trimmed, issue: 'looks_like_email', suggestion: trimmed.toLowerCase() };

  const noAt = trimmed.replace(/^@+/, '');
  if (/\s/.test(noAt)) return { clean: noAt, issue: 'has_spaces', suggestion: noAt.replace(/\s+/g, '') };

  return { clean: noAt };
}
