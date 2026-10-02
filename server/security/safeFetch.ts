import dns from 'node:dns';
import net from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';
import { isBlockedAddress } from '../../src/core/net';

export class BlockedTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockedTargetError';
  }
}

const ALLOWED_PORTS = new Set(['', '80', '443']);

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void;

/** DNS lookup that rejects private addresses at connect time, which also defeats DNS rebinding. */
function guardedLookup(hostname: string, options: any, callback: LookupCallback) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = addresses as unknown as dns.LookupAddress[];
    if (!list.length || list.some((entry) => isBlockedAddress(entry.address))) {
      return callback(new BlockedTargetError(`Blocked non-public address for ${hostname}`) as NodeJS.ErrnoException);
    }
    if (options?.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
}

const dispatcher = new Agent({
  connect: { lookup: guardedLookup as any },
  connections: 8,
  pipelining: 0,
});

export function assertProbeableUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BlockedTargetError('Invalid URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new BlockedTargetError('Only http(s) is allowed');
  if (url.username || url.password) throw new BlockedTargetError('Credentials in URL are not allowed');
  if (!ALLOWED_PORTS.has(url.port)) throw new BlockedTargetError('Port not allowed');
  const bare = url.hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(bare) && isBlockedAddress(bare)) throw new BlockedTargetError('Non-public address literal');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.internal')) {
    throw new BlockedTargetError('Internal hostname');
  }
  return url;
}

export interface SafeFetchOptions {
  method?: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  signal?: AbortSignal;
  maxRedirects?: number;
}

export interface SafeFetchResult {
  response: Awaited<ReturnType<typeof undiciFetch>>;
  finalUrl: string;
  redirects: string[];
}

/** fetch() with manual redirect handling: every hop is re-validated and re-resolved through the guarded lookup. */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const redirects: string[] = [];
  let current = assertProbeableUrl(rawUrl).href;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const response = await undiciFetch(current, {
      method: options.method || 'GET',
      headers: options.headers,
      signal: options.signal,
      redirect: 'manual',
      dispatcher,
    });

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      try { await response.body?.cancel(); } catch {}
      current = assertProbeableUrl(new URL(location, current).href).href;
      redirects.push(current);
      continue;
    }
    return { response, finalUrl: current, redirects };
  }
  throw new BlockedTargetError('Too many redirects');
}
