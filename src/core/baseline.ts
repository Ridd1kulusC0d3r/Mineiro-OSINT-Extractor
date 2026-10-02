// Differential baseline: compare a target page with a control page for a username that cannot exist.
// A site that answers 200 with a "profile not found" shell is indistinguishable from the control,
// which removes most soft-404 false positives without per-site rules.

export interface PageFingerprint {
  status: number;
  finalHost: string;
  finalPathShape: string; // path with the probed handle replaced by `:u`
  length: number;
  title: string;
  tagBigrams: number[]; // sorted unique hashes of consecutive tag pairs (DOM skeleton)
  textHash: number;
}

export interface BaselineVerdict {
  /** 'same' = target looks like the control (absence), 'different' = target is distinguishable, 'unknown' = control unusable */
  relation: 'same' | 'different' | 'unknown';
  similarity: number; // 0..1
  signals: string[];
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function stripHandle(text: string, handles: string[]): string {
  let out = text.toLowerCase();
  for (const handle of handles) {
    const h = handle.trim().toLowerCase();
    if (h) out = out.split(h).join('\u0000').split(encodeURIComponent(h)).join('\u0000');
  }
  return out;
}

export function fingerprintPage(input: {
  status: number;
  finalUrl: string;
  body: string;
  handle: string;
}): PageFingerprint {
  const { status, finalUrl, body, handle } = input;
  let finalHost = '';
  let pathShape = '';
  try {
    const url = new URL(finalUrl);
    finalHost = url.hostname;
    pathShape = stripHandle(decodeURIComponent(url.pathname), [handle]).replace(/\u0000/g, ':u');
  } catch { /* keep empty */ }

  const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = stripHandle(titleMatch ? titleMatch[1] : '', [handle]).replace(/\s+/g, ' ').trim();

  const tags = (body.match(/<\/?[a-z][a-z0-9-]*/gi) || []).slice(0, 600).map((t) => t.toLowerCase());
  const bigrams = new Set<number>();
  for (let i = 0; i < tags.length - 1; i++) bigrams.add(fnv1a(`${tags[i]}>${tags[i + 1]}`));

  const text = stripHandle(body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' '), [handle])
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000);

  return {
    status,
    finalHost,
    finalPathShape: pathShape,
    length: body.length,
    title,
    tagBigrams: [...bigrams].sort((a, b) => a - b),
    textHash: fnv1a(text),
  };
}

function jaccard(a: number[], b: number[]): number {
  if (!a.length && !b.length) return 1;
  const setB = new Set(b);
  let inter = 0;
  for (const value of a) if (setB.has(value)) inter++;
  const union = a.length + b.length - inter;
  return union ? inter / union : 1;
}

/** Control probes that were blocked or errored carry no information about the site's "absent" template. */
function controlUsable(control: PageFingerprint): boolean {
  return ![0, 401, 403, 407, 408, 429, 500, 502, 503, 504].includes(control.status);
}

export function compareToBaseline(target: PageFingerprint, control: PageFingerprint | null): BaselineVerdict {
  if (!control || !controlUsable(control)) {
    return { relation: 'unknown', similarity: 0, signals: ['baseline_unavailable'] };
  }

  const signals: string[] = [];

  if (target.status !== control.status) {
    signals.push(`baseline_status_differs:${target.status}_vs_${control.status}`);
    return { relation: 'different', similarity: 0, signals };
  }

  if (target.finalHost !== control.finalHost || target.finalPathShape !== control.finalPathShape) {
    signals.push('baseline_redirect_shape_differs');
    return { relation: 'different', similarity: 0.2, signals };
  }

  const structural = jaccard(target.tagBigrams, control.tagBigrams);
  const lengthRatio = Math.min(target.length, control.length) / Math.max(1, Math.max(target.length, control.length));
  const sameTitle = target.title === control.title;
  const sameText = target.textHash === control.textHash;

  const similarity = Math.round(
    (structural * 0.5 + lengthRatio * 0.2 + (sameTitle ? 0.15 : 0) + (sameText ? 0.15 : 0)) * 100
  ) / 100;

  if (sameText || (sameTitle && structural >= 0.85) || (structural >= 0.93 && lengthRatio >= 0.9)) {
    signals.push('baseline_identical_to_absent_profile');
    return { relation: 'same', similarity, signals };
  }

  signals.push('baseline_distinct_from_absent_profile');
  return { relation: 'different', similarity, signals };
}
