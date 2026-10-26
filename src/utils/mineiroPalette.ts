/**
 * Mineiro Username Intelligence — identity system aligned with LLmInjection:
 * warm paper/ink neutrals plus one rust signal (#F0885A). Status is still
 * communicated by labels, iconography, borders and patterns, not hue.
 */

export const MINEIRO_PALETTE = {
  black: '#131210',
  ink: '#131210',
  ink2: '#1B1915',
  panel: '#221F1A',
  line: '#37332B',
  lineStrong: '#4A453A',
  muted: '#908B7D',
  text2: '#B9B4A6',
  text: '#ECE8DD',
  white: '#ECE8DD',
  bone: '#F3F0E8',
  signal: '#F0885A',
  signalInk: '#131210',
  // Compatibility aliases: still monochrome.
  cyan: '#ECE8DD',
  cyanDark: '#B9B4A6',
  rose: '#908B7D',
  text3: '#908B7D',
  aberration: '#ECE8DD',
} as const;

export const MINEIRO_HEX_LIST = [
  '#131210', '#1B1915', '#221F1A', '#27241E', '#37332B', '#4A453A', '#6F6A5E',
  '#908B7D', '#A19C8E', '#B9B4A6', '#D6D1C3', '#ECE8DD', '#F3F0E8', '#F0885A',
] as const;

export const ALLOWED_HEX_SET = new Set<string>(MINEIRO_HEX_LIST.map((h) => h.toUpperCase()));

export function auditHexColors(cssOrCode: string): { valid: boolean; totalHexes: number; invalidHexes: string[] } {
  const matches = cssOrCode.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) || [];
  const invalid: string[] = [];
  for (const raw of matches) {
    let hex = raw.toUpperCase();
    if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    if (!ALLOWED_HEX_SET.has(hex)) invalid.push(raw);
  }
  return { valid: invalid.length === 0, totalHexes: matches.length, invalidHexes: Array.from(new Set(invalid)) };
}

export async function computePaletteFingerprint(colors: string[]): Promise<{ fingerprint: string; sortedHexes: string[] }> {
  const normalized = Array.from(new Set(colors.map((c) => c.trim().toUpperCase()).filter((c) => /^#([0-9A-F]{3}|[0-9A-F]{6})$/.test(c)).map((c) => c.length === 4 ? '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3] : c))).sort();
  const data = new TextEncoder().encode(normalized.join(','));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const fullHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return { fingerprint: `FP-PAL-${fullHash.substring(0, 16).toUpperCase()}`, sortedHexes: normalized };
}
