// Declarative detectors: data (JSON) describing how to read a response, instead of per-site code.

export type Matcher =
  | { type: 'status'; codes: number[] }
  | { type: 'body_contains'; values: string[] }
  | { type: 'body_regex'; pattern: string; flags?: string }
  | { type: 'final_path_regex'; pattern: string };

export interface DeclarativeDetector {
  id: string;
  /** every `present` matcher must match for presence */
  present: Matcher[];
  /** any `absent` matcher matching means absence (takes precedence) */
  absent: Matcher[];
  canary?: { present: string; absent?: string };
  lastVerified: string;
  source: string; // where the rule comes from (URL of docs, own observation...)
  /** 'honest' identifies Mineiro instead of imitating a browser; some sites block the browser-like default */
  userAgent?: 'default' | 'honest';
}

export interface MatchContext {
  status: number;
  finalUrl: string;
  body: string;
}

export interface MatchVerdict {
  verdict: 'present' | 'absent' | 'inconclusive';
  signals: string[];
}

function matches(matcher: Matcher, ctx: MatchContext): boolean {
  switch (matcher.type) {
    case 'status':
      return matcher.codes.includes(ctx.status);
    case 'body_contains': {
      const lower = ctx.body.toLowerCase();
      return matcher.values.some((v) => lower.includes(v.toLowerCase()));
    }
    case 'body_regex':
      return new RegExp(matcher.pattern, matcher.flags ?? 'i').test(ctx.body);
    case 'final_path_regex': {
      try { return new RegExp(matcher.pattern, 'i').test(new URL(ctx.finalUrl).pathname); } catch { return false; }
    }
  }
}

export function evaluateMatchers(detector: DeclarativeDetector, ctx: MatchContext): MatchVerdict {
  const signals: string[] = [];

  const absentIdx = detector.absent.findIndex((m) => matches(m, ctx));
  if (absentIdx !== -1) {
    signals.push(`rule_absent:${detector.absent[absentIdx].type}`);
    return { verdict: 'absent', signals };
  }

  if (detector.present.length && detector.present.every((m) => matches(m, ctx))) {
    signals.push(...detector.present.map((m) => `rule_present:${m.type}`));
    return { verdict: 'present', signals };
  }

  signals.push('rule_inconclusive');
  return { verdict: 'inconclusive', signals };
}

/** Structural validation used by the loader and the CI script. Returns a list of problems. */
export function validateDeclarativeDetector(value: any): string[] {
  const errors: string[] = [];
  const label = value?.id ?? '(no id)';
  if (!value || typeof value !== 'object') return ['detector must be an object'];
  if (typeof value.id !== 'string' || !value.id) errors.push(`${label}: id required`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.lastVerified ?? '')) errors.push(`${label}: lastVerified must be YYYY-MM-DD`);
  if (typeof value.source !== 'string' || !value.source) errors.push(`${label}: source required (provenance)`);
  if (value.userAgent !== undefined && !['default', 'honest'].includes(value.userAgent)) errors.push(`${label}: userAgent must be "default" or "honest"`);
  for (const key of ['present', 'absent'] as const) {
    if (!Array.isArray(value[key])) { errors.push(`${label}: ${key} must be an array`); continue; }
    for (const matcher of value[key]) {
      if (!['status', 'body_contains', 'body_regex', 'final_path_regex'].includes(matcher?.type)) {
        errors.push(`${label}: unknown matcher type ${matcher?.type}`);
      } else if (matcher.type === 'status' && !Array.isArray(matcher.codes)) errors.push(`${label}: status matcher needs codes[]`);
      else if (matcher.type === 'body_contains' && !Array.isArray(matcher.values)) errors.push(`${label}: body_contains needs values[]`);
      else if ((matcher.type === 'body_regex' || matcher.type === 'final_path_regex')) {
        try { new RegExp(matcher.pattern, matcher.flags ?? 'i'); } catch { errors.push(`${label}: invalid regex ${matcher.pattern}`); }
      }
    }
  }
  if (Array.isArray(value.present) && Array.isArray(value.absent) && !value.present.length && !value.absent.length) {
    errors.push(`${label}: needs at least one matcher`);
  }
  return errors;
}
