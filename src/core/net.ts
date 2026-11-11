// Pure network-safety helpers shared by the server guard and the test suite.

/** Parses a dotted-quad IPv4 literal. Leading zeros are refused (some resolvers read them as octal). */
function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^(0|[1-9]\d{0,2})$/.test(part) ? Number(part) : NaN));
  return octets.every((n) => n >= 0 && n <= 255) ? octets : null;
}

/** Parses an IPv6 literal (with `::` and an optional trailing dotted quad) into eight 16-bit groups. */
function parseIPv6(ip: string): number[] | null {
  let text = ip;
  const lastColon = text.lastIndexOf(':');
  if (text.slice(lastColon + 1).includes('.')) {
    const v4 = parseIPv4(text.slice(lastColon + 1));
    if (!v4) return null;
    text = `${text.slice(0, lastColon + 1)}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const groups = (half: string) => (half ? half.split(':') : []);
  const head = groups(halves[0]);
  const tail = halves.length === 2 ? groups(halves[1]) : [];
  if (![...head, ...tail].every((g) => /^[0-9a-f]{1,4}$/.test(g))) return null;
  const missing = 8 - head.length - tail.length;
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null;
  return [...head, ...new Array(missing).fill('0'), ...tail].map((g) => parseInt(g, 16));
}

// IANA IPv4 Special-Purpose Address Registry: every range that is not globally reachable, plus the deprecated
// 6to4 relay anycast. 192.0.0.0/16 is NOT reserved as a whole (Automattic/Gravatar live in 192.0.64.0/18).
function isBlockedIPv4([a, b, c]: number[]): boolean {
  return (
    a === 0 ||                              // 0.0.0.0/8 "this network"
    a === 10 ||                             // 10.0.0.0/8 private
    (a === 100 && b >= 64 && b <= 127) ||   // 100.64.0.0/10 CGNAT
    a === 127 ||                            // 127.0.0.0/8 loopback
    (a === 169 && b === 254) ||             // 169.254.0.0/16 link-local + cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||    // 172.16.0.0/12 private
    (a === 192 && b === 0 && c === 0) ||    // 192.0.0.0/24 IETF protocol assignments
    (a === 192 && b === 0 && c === 2) ||    // 192.0.2.0/24 TEST-NET-1
    (a === 192 && b === 88 && c === 99) ||  // 192.88.99.0/24 deprecated 6to4 relay anycast
    (a === 192 && b === 168) ||             // 192.168.0.0/16 private
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 benchmarking
    (a === 198 && b === 51 && c === 100) || // 198.51.100.0/24 TEST-NET-2
    (a === 203 && b === 0 && c === 113) ||  // 203.0.113.0/24 TEST-NET-3
    a >= 224                                // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved, broadcast
  );
}

// IPv6: only global unicast (2000::/3) is probeable, minus the special-purpose blocks inside it.
// IPv4-mapped addresses are judged by the IPv4 they carry.
function isBlockedIPv6(h: number[]): boolean {
  if (h.slice(0, 5).every((g) => g === 0) && h[5] === 0xffff) {
    return isBlockedIPv4([h[6] >> 8, h[6] & 0xff, h[7] >> 8, h[7] & 0xff]); // ::ffff:0:0/96
  }
  if ((h[0] & 0xe000) !== 0x2000) return true;     // ::/8 (::, ::1, NAT64 64:ff9b::/96), 100::/64, 5f00::/16, ULA fc00::/7, fe80::/10, fec0::/10, ff00::/8
  if (h[0] === 0x2001 && h[1] < 0x200) return true; // 2001::/23 IETF protocol assignments (Teredo 2001::/32, ...)
  if (h[0] === 0x2001 && h[1] === 0xdb8) return true; // 2001:db8::/32 documentation
  if (h[0] === 0x2002) return true;                 // 2002::/16 6to4 (embeds an arbitrary IPv4)
  if (h[0] === 0x3fff && h[1] < 0x1000) return true; // 3fff::/20 documentation
  return false;
}

/** True when an IPv4/IPv6 literal is not safe to probe (private, loopback, link-local, metadata...). */
export function isBlockedAddress(address: string): boolean {
  const ip = address.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');

  if (!ip.includes(':')) {
    const v4 = parseIPv4(ip);
    return v4 ? isBlockedIPv4(v4) : true;
  }
  const v6 = parseIPv6(ip);
  return v6 ? isBlockedIPv6(v6) : true; // not a recognizable IP literal: treat as unsafe
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
