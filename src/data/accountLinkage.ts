import type { AccountLinkageNode, AccountLinkageReport, ScanResult, EmailReconData } from '../types';

/**
 * Normalized Levenshtein similarity. This measures string similarity only.
 * It is never treated as identity evidence.
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  if (a === b) return 100;
  if (!a.length || !b.length) return 0;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
    }
  }

  const distance = matrix[b.length][a.length];
  return Math.max(0, Math.min(100, Math.round((1 - distance / Math.max(a.length, b.length)) * 100)));
}

export function extractCanonicalStem(target: string): string {
  const username = target.includes('@') ? target.split('@')[0] : target;
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/^(real[._-]?|the[._-]?|iam[._-]?|its[._-]?)/, '')
    .replace(/([._-](dev|sec|ops|tech|official|br))$/, '')
    .replace(/[._-]+/g, '');

  return normalized.length >= 3 ? normalized : username.trim().toLowerCase();
}

function candidate(
  base: string,
  label: string,
  mutationType: AccountLinkageNode['mutationType'],
  reason: string
): AccountLinkageNode | null {
  const normalized = label.trim();
  if (!normalized || normalized.toLowerCase() === base.toLowerCase()) return null;

  const similarityScore = calculateStringSimilarity(base, normalized);
  return {
    id: `candidate-${mutationType}-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    label: normalized,
    category: 'permutation',
    mutationType,
    similarityScore,
    reason,
    hypothesis: 'Candidate username variant only. A pivot scan or independent public cross-link is required before treating it as related evidence.',
    status: 'unverified',
    pivotHandle: normalized,
  };
}

/**
 * Generates conservative username-linkage candidates.
 *
 * The output intentionally does NOT invent probable email addresses, relatives,
 * peers, birth years, locations, or private identity relationships.
 */
export function generateAccountLinkageDossier(
  target: string,
  results: ScanResult[] = [],
  emailData: EmailReconData | null = null
): AccountLinkageReport {
  const cleanTarget = target.trim();
  const baseUsername = cleanTarget.includes('@') ? cleanTarget.split('@')[0] : cleanTarget;
  const canonicalStem = extractCanonicalStem(baseUsername);

  const variants = new Map<string, AccountLinkageNode>();
  const add = (node: AccountLinkageNode | null) => {
    if (!node) return;
    const key = node.label.toLowerCase();
    if (!variants.has(key)) variants.set(key, node);
  };

  // Separator normalization and substitution.
  if (/[._-]/.test(baseUsername)) {
    add(candidate(baseUsername, baseUsername.replace(/[._-]+/g, ''), 'separator', 'Punctuation removed.'));
    add(candidate(baseUsername, baseUsername.replace(/[._-]+/g, '_'), 'separator', 'Separator normalized to underscore.'));
    add(candidate(baseUsername, baseUsername.replace(/[._-]+/g, '.'), 'separator', 'Separator normalized to dot.'));
    add(candidate(baseUsername, baseUsername.replace(/[._-]+/g, '-'), 'separator', 'Separator normalized to hyphen.'));
  } else if (baseUsername.length >= 6) {
    const split = Math.max(2, Math.floor(baseUsername.length / 2));
    add(candidate(baseUsername, `${baseUsername.slice(0, split)}_${baseUsername.slice(split)}`, 'separator', 'Single underscore separator candidate.'));
    add(candidate(baseUsername, `${baseUsername.slice(0, split)}.${baseUsername.slice(split)}`, 'separator', 'Single dot separator candidate.'));
  }

  // Common, non-sensitive namespace affixes.
  for (const suffix of ['dev', 'sec', 'ops', 'tech']) {
    add(candidate(baseUsername, `${canonicalStem}_${suffix}`, 'suffix', `Functional suffix candidate: _${suffix}.`));
  }
  for (const prefix of ['the_', 'real_']) {
    add(candidate(baseUsername, `${prefix}${canonicalStem}`, 'prefix', `Common namespace prefix candidate: ${prefix}.`));
  }

  // Minimal leetspeak substitutions. These remain candidates, never evidence.
  const substitutions: Array<[RegExp, string]> = [
    [/a/gi, '4'],
    [/e/gi, '3'],
    [/i/gi, '1'],
    [/o/gi, '0'],
  ];
  for (const [pattern, replacement] of substitutions) {
    const transformed = baseUsername.replace(pattern, replacement);
    add(candidate(baseUsername, transformed, 'leetspeak', 'Single-character leetspeak substitution candidate.'));
  }

  // If the searched target itself was an email, preserve only that observed email.
  // We do not manufacture mailbox candidates.
  const emailCorrelations: AccountLinkageNode[] = [];
  if (cleanTarget.includes('@')) {
    emailCorrelations.push({
      id: 'observed-input-email',
      label: cleanTarget,
      category: 'email_variant',
      mutationType: 'email_alias',
      similarityScore: 100,
      reason: 'Email address was provided directly as the investigation target.',
      hypothesis: 'Observed input, not inferred.',
      status: emailData?.isValidSyntax ? 'confirmed' : 'unverified',
      pivotHandle: cleanTarget,
    });
  }

  const foundCount = results.filter((r) => r.status === 'found').length;
  const categoryCount = new Set(results.filter((r) => r.status === 'found').map((r) => r.category)).size;

  const behavioralHypotheses = [
    `The canonical normalized stem is "${canonicalStem}". String normalization is a discovery aid, not identity evidence.`,
    `${foundCount} public presence signal(s) were observed across ${categoryCount} service category/categories for the exact searched identifier.`,
    'Candidate variants should be tested individually and promoted only when public evidence independently supports the relationship.',
  ];

  const permutations = [...variants.values()]
    .filter((item) => item.similarityScore >= 55)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 24);

  return {
    target: cleanTarget,
    canonicalStem,
    permutations,
    emailCorrelations,
    familyPeerCorrelations: [],
    behavioralHypotheses,
    totalMutationsEvaluated: permutations.length + emailCorrelations.length,
  };
}
