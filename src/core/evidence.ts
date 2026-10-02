// Evidence engine: pure functions (no I/O except reading a Response body), shared by server and tests.

export const EVIDENCE_CHECK_IDS = [
  'status_expected',
  'absence_status',
  'redirect_consistency',
  'username_final_url',
  'username_body',
  'canonical_match',
  'soft_404',
  'edge_protection',
] as const;

export async function readBodyPreview(response: { headers: { get(n: string): string | null }; body: any }, maxBytes = 192 * 1024): Promise<string> {
  const type = response.headers.get('content-type') || '';
  if (!/text|html|json|xml/i.test(type) || !response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxBytes - total;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
      if (total >= maxBytes) break;
    }
  } finally {
    try { await reader.cancel(); } catch {}
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

export function evaluateEvidence(input: {
  requestedUrl: string;
  finalUrl: string;
  username?: string;
  statusCode: number;
  expectedStatus: number;
  errorStatus: number;
  body: string;
  edgeProtected: boolean;
}) {
  const { requestedUrl, finalUrl, username = '', statusCode, expectedStatus, errorStatus, body, edgeProtected } = input;
  const bodyLower = body.toLowerCase();
  const usernameLower = username.trim().toLowerCase();
  const finalLower = finalUrl.toLowerCase();
  const requested = new URL(requestedUrl);
  const final = new URL(finalUrl);

  const soft404Hints = [
    'page not found', 'user not found', 'profile not found',
    'does not exist', "doesn't exist", 'no such user', '>404<'
  ];
  const soft404 = soft404Hints.some((hint) => bodyLower.includes(hint));

  const canonicalMatch = (() => {
    const match = body.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i)
      || body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i);
    if (!match) return false;
    try {
      const canonical = new URL(match[1], finalUrl);
      return canonical.hostname === final.hostname
        && (!usernameLower || canonical.href.toLowerCase().includes(encodeURIComponent(usernameLower)));
    } catch {
      return false;
    }
  })();

  const checks = [
    { id: 'status_expected', pass: statusCode === expectedStatus, signal: `http_status:${statusCode}` },
    { id: 'absence_status', pass: statusCode === errorStatus || statusCode === 404, signal: statusCode === errorStatus || statusCode === 404 ? 'explicit_absence_status' : 'absence_status_not_observed' },
    { id: 'redirect_consistency', pass: requested.hostname === final.hostname || final.hostname.endsWith(`.${requested.hostname}`) || requested.hostname.endsWith(`.${final.hostname}`), signal: requested.href === final.href ? 'no_redirect' : `final_host:${final.hostname}` },
    { id: 'username_final_url', pass: Boolean(usernameLower && finalLower.includes(encodeURIComponent(usernameLower))), signal: usernameLower && finalLower.includes(encodeURIComponent(usernameLower)) ? 'username_in_final_url' : 'username_not_in_final_url' },
    { id: 'username_body', pass: Boolean(usernameLower && bodyLower.includes(usernameLower)), signal: usernameLower && bodyLower.includes(usernameLower) ? 'username_token_in_body' : 'username_token_not_observed' },
    { id: 'canonical_match', pass: canonicalMatch, signal: canonicalMatch ? 'canonical_consistent' : 'canonical_not_confirmed' },
    { id: 'soft_404', pass: !soft404, signal: soft404 ? 'soft_404_hint_detected' : 'no_soft_404_hint' },
    { id: 'edge_protection', pass: !edgeProtected, signal: edgeProtected ? 'edge_protection_detected' : 'no_edge_protection_signal' },
  ];

  return {
    checks,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
    signals: checks.map((c) => c.signal),
    soft404,
  };
}

