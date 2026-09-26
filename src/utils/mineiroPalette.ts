/**
 * Mineiro Username Extractor — monochrome identity system.
 * Black, white and neutral grays only. Status is communicated by labels,
 * iconography, borders and patterns instead of semantic color.
 */

export const MINEIRO_PALETTE = {
  black: '#000000',
  ink: '#050505',
  ink2: '#0A0A0A',
  panel: '#111111',
  line: '#2A2A2A',
  lineStrong: '#4A4A4A',
  muted: '#737373',
  text2: '#A3A3A3',
  text: '#F5F5F5',
  white: '#FFFFFF',
  bone: '#FAFAFA',
  // Compatibility aliases: still monochrome.
  cyan: '#FFFFFF',
  cyanDark: '#A3A3A3',
  rose: '#737373',
  text3: '#737373',
  aberration: '#FFFFFF',
} as const;

export const MINEIRO_HEX_LIST = [
  '#000000', '#050505', '#0A0A0A', '#111111', '#2A2A2A', '#4A4A4A',
  '#737373', '#A3A3A3', '#F5F5F5', '#FAFAFA', '#FFFFFF',
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
