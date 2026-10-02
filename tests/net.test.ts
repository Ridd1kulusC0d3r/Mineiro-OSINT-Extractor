import { describe, expect, it } from 'vitest';
import { buildDetectorUrl, isBlockedAddress, matchesDetectorPattern } from '../src/core/net';

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
    '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1', 'not-an-ip',
  ])('blocks %s', (ip) => expect(isBlockedAddress(ip)).toBe(true));

  it.each(['8.8.8.8', '1.1.1.1', '172.32.0.1', '2606:4700:4700::1111'])('allows %s', (ip) =>
    expect(isBlockedAddress(ip)).toBe(false)
  );
});

describe('matchesDetectorPattern', () => {
  const path = 'https://github.com/{username}';
  const sub = 'https://{username}.tumblr.com';

  it('accepts URLs the pattern can produce', () => {
    expect(matchesDetectorPattern(buildDetectorUrl(path, 'pascho'), path)).toBe(true);
    expect(matchesDetectorPattern(buildDetectorUrl(sub, 'pascho'), sub)).toBe(true);
  });

  it('rejects other hosts and SSRF payloads', () => {
    expect(matchesDetectorPattern('http://169.254.169.254/latest/meta-data', path)).toBe(false);
    expect(matchesDetectorPattern('https://evil.com/pascho', path)).toBe(false);
    expect(matchesDetectorPattern('https://github.com.evil.com/x', path)).toBe(false);
    expect(matchesDetectorPattern('https://evil.com#.tumblr.com', sub)).toBe(false);
    expect(matchesDetectorPattern('https://user@evil.com/.tumblr.com', sub)).toBe(false);
  });

  it('encodes the handle so it cannot escape the path/host', () => {
    expect(buildDetectorUrl(sub, 'a/b#c')).toBe('https://a%2Fb%23c.tumblr.com');
  });
});
