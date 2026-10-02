// Pure network-safety helpers shared by the server guard and the test suite.

/** True when an IPv4/IPv6 literal is not safe to probe (private, loopback, link-local, metadata...). */
export function isBlockedAddress(address: string): boolean {
  const ip = address.trim().toLowerCase().replace(/^\[|\]$/g, '');

  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedAddress(mapped[1]);

  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if ([a, b, Number(v4[3]), Number(v4[4])].some((n) => n > 255)) return true;
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT
      (a === 169 && b === 254) ||           // link-local + cloud metadata
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||             // IETF protocol assignments / TEST-NET-1
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224                              // multicast, reserved, broadcast
    );
  }

  if (ip.includes(':')) {
    return (
      ip === '::' || ip === '::1' ||
      ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb') || // fe80::/10
      ip.startsWith('fc') || ip.startsWith('fd') ||  // ULA fc00::/7
      ip.startsWith('ff') ||                         // multicast
      ip.startsWith('64:ff9b:') ||                   // NAT64
      ip.startsWith('2001:db8')                      // documentation
    );
  }

  return true; // not a recognizable IP literal: treat as unsafe
}

const PLACEHOLDER = /\{(username|email)\}/g;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds the probe URL for a detector from its pattern. The server never trusts a client-supplied URL. */
export function buildDetectorUrl(urlPattern: string, target: string): string {
  const encoded = encodeURIComponent(target.trim());
  return urlPattern.replace(PLACEHOLDER, encoded);
}

/**
 * Checks that `url` is exactly what `urlPattern` can produce. Placeholders in the host
 * may not contain `/ ? # @`, so a crafted username cannot redirect the probe to another host.
 */
export function matchesDetectorPattern(url: string, urlPattern: string): boolean {
  const schemeEnd = urlPattern.indexOf('://') + 3;
  const hostEnd = urlPattern.indexOf('/', schemeEnd);
  const hostPart = hostEnd === -1 ? urlPattern.slice(schemeEnd) : urlPattern.slice(schemeEnd, hostEnd);
  const rest = hostEnd === -1 ? '' : urlPattern.slice(hostEnd);

  const toRegex = (segment: string, hostSegment: boolean) =>
    segment
      .split(PLACEHOLDER)
      .map((piece, index) =>
        index % 2 === 1 ? (hostSegment ? '[^/?#@\\s]+' : '[^\\s]*') : escapeRegex(piece)
      )
      .join('');

  const source = `^${escapeRegex(urlPattern.slice(0, schemeEnd))}${toRegex(hostPart, true)}${toRegex(rest, false)}$`;
  return new RegExp(source, 'i').test(url);
}

/** Generates a username that is overwhelmingly unlikely to exist, for baseline (control) probes. */
export function randomControlUsername(length = 18): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = 'zq';
  for (let i = 0; i < length; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
