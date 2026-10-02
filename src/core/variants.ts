// Username permutations with a similarity score, for candidate generation (never for identity claims).

export interface UsernameVariant {
  value: string;
  kind: 'separator' | 'leet' | 'suffix' | 'prefix' | 'translit' | 'case' | 'reverse-digits';
  similarity: number; // Jaro-Winkler vs the original, 0-100
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatch = new Array(a.length).fill(false);
  const bMatch = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = Math.max(0, i - range); j <= Math.min(b.length - 1, i + range); j++) {
      if (!bMatch[j] && a[i] === b[j]) { aMatch[i] = bMatch[j] = true; matches++; break; }
    }
  }
  if (!matches) return 0;
  let transpositions = 0;
  for (let i = 0, k = 0; i < a.length; i++) {
    if (!aMatch[i]) continue;
    while (!bMatch[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
  let prefix = 0;
  while (prefix < Math.min(4, a.length, b.length) && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

const LEET: Record<string, string> = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7' };
const SEPARATORS = ['_', '.', '-', ''];
const SUFFIXES = ['1', '01', '123', '_', '_dev', '_oficial', 'official', 'br', '_br', '2024', '2025', '2026'];
const PREFIXES = ['the', 'real', 'its', 'oficial', 'ig_'];

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function generateUsernameVariants(handle: string, max = 40): UsernameVariant[] {
  const base = handle.trim().replace(/^@/, '');
  if (base.length < 2 || base.length > 40) return [];

  const found = new Map<string, UsernameVariant['kind']>();
  const add = (value: string, kind: UsernameVariant['kind']) => {
    const v = value.trim();
    if (v && v !== base && /^[\p{L}\p{N}._-]{2,40}$/u.test(v) && !found.has(v)) found.set(v, kind);
  };

  const lower = base.toLowerCase();
  add(lower, 'case');
  add(stripAccents(base), 'translit');

  const parts = lower.split(/[._-]+/).filter(Boolean);
  if (parts.length > 1) for (const sep of SEPARATORS) add(parts.join(sep), 'separator');
  else {
    // Split camelCase / letter-digit boundaries to propose separator variants.
    const split = base.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2').toLowerCase().split(' ');
    if (split.length > 1) for (const sep of SEPARATORS) add(split.join(sep), 'separator');
  }

  for (const suffix of SUFFIXES) add(lower + suffix, 'suffix');
  for (const prefix of PREFIXES) add(prefix + lower, 'prefix');

  const leet = [...lower].map((ch) => LEET[ch] ?? ch).join('');
  add(leet, 'leet');
  for (let i = 0; i < lower.length; i++) {
    if (LEET[lower[i]]) add(lower.slice(0, i) + LEET[lower[i]] + lower.slice(i + 1), 'leet');
  }

  const trailing = lower.match(/^(.*?)(\d+)$/);
  if (trailing && trailing[1]) add(trailing[1], 'reverse-digits');

  return [...found.entries()]
    .map(([value, kind]) => ({ value, kind, similarity: Math.round(jaroWinkler(lower, value.toLowerCase()) * 100) }))
    .sort((a, b) => b.similarity - a.similarity || a.value.localeCompare(b.value))
    .slice(0, max);
}
