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

  // Both sides of every range boundary (IANA special-purpose registries). Left: blocked, right: allowed.
  it.each([
    ['0.255.255.255', '1.0.0.0'],
    ['10.0.0.0', '9.255.255.255'], ['10.255.255.255', '11.0.0.0'],
    ['100.64.0.0', '100.63.255.255'], ['100.127.255.255', '100.128.0.0'],
    ['127.0.0.0', '126.255.255.255'], ['127.255.255.255', '128.0.0.0'],
    ['169.254.0.0', '169.253.255.255'], ['169.254.255.255', '169.255.0.0'],
    ['172.16.0.0', '172.15.255.255'], ['172.31.255.255', '172.32.0.0'],
    ['192.0.0.0', '191.255.255.255'], ['192.0.0.255', '192.0.1.0'],
    ['192.0.2.0', '192.0.1.255'], ['192.0.2.255', '192.0.3.0'],
    ['192.88.99.0', '192.88.98.255'], ['192.88.99.255', '192.88.100.0'],
    ['192.168.0.0', '192.167.255.255'], ['192.168.255.255', '192.169.0.0'],
    ['198.18.0.0', '198.17.255.255'], ['198.19.255.255', '198.20.0.0'],
    ['198.51.100.0', '198.51.99.255'], ['198.51.100.255', '198.51.101.0'],
    ['203.0.113.0', '203.0.112.255'], ['203.0.113.255', '203.0.114.0'],
    ['224.0.0.0', '223.255.255.255'],
  ])('IPv4 boundary: blocks %s, allows %s', (blocked, allowed) => {
    expect(isBlockedAddress(blocked)).toBe(true);
    expect(isBlockedAddress(allowed)).toBe(false);
  });

  it('no longer blocks the rest of 192.0.0.0/16 (defect 1: Gravatar is 192.0.80.x)', () => {
    for (const ip of ['192.0.1.1', '192.0.3.1', '192.0.64.1', '192.0.80.36', '192.0.255.255', '::ffff:192.0.80.36']) {
      expect(isBlockedAddress(ip), ip).toBe(false);
    }
  });

  it.each([
    '239.255.255.255', '240.0.0.0', '255.255.255.255',
    '256.1.1.1', '1.2.3', '1.2.3.4.5', '010.0.0.1', '1.2.3.-1', '',
  ])('blocks reserved, broadcast and malformed IPv4 %s', (ip) => expect(isBlockedAddress(ip)).toBe(true));

  it.each([
    ['::ffff:127.0.0.1', '::ffff:8.8.8.8'],
    ['::ffff:7f00:1', '::ffff:808:808'],        // WHATWG URL serializes mapped addresses in hex
    ['[::ffff:a00:1]', '[::ffff:101:101]'],
    ['::ffff:c000:201', '::ffff:c000:301'],     // 192.0.2.1 vs 192.0.3.1
    ['1fff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '2000::1'],
    ['4000::1', '3fff:1000::1'],
    ['3fff:fff:ffff::1', '3ffe:ffff::1'],       // 3fff::/20 documentation
    ['2001::1', '2000:ffff::1'],                // Teredo, inside 2001::/23
    ['2001:1ff:ffff::1', '2001:200::1'],        // end of 2001::/23
    ['2001:db8::1', '2001:db7:ffff::1'], ['2001:db8:ffff::1', '2001:db9::1'],
    ['2002::1', '2003::1'], ['2002:ffff::1', '2001:4860:4860::8888'],
  ])('IPv6 boundary: blocks %s, allows %s', (blocked, allowed) => {
    expect(isBlockedAddress(blocked)).toBe(true);
    expect(isBlockedAddress(allowed)).toBe(false);
  });

  it.each([
    '::', '::1', '::7f00:1', '::ffff:0:7f00:1', '64:ff9b::7f00:1', '64:ff9b:1::1', '100::1', '5f00::1',
    'fc00::1', 'fdff:ffff::1', 'fe80::1', 'fe80::1%eth0', 'febf::1', 'fec0::1', 'ff02::1',
    '1:2:3:4:5:6:7:8:9', '1::2::3', 'gggg::1', '::ffff:1.2.3', '1:2:3:4:5:6:7::8:9',
  ])('blocks special-purpose and malformed IPv6 %s', (ip) => expect(isBlockedAddress(ip)).toBe(true));

  it('accepts full and compressed forms of the same public IPv6 address', () => {
    expect(isBlockedAddress('2606:4700:4700:0:0:0:0:1111')).toBe(false);
    expect(isBlockedAddress('[2606:4700:4700::1111]')).toBe(false);
    expect(isBlockedAddress('1:2:3:4:5:6:7::')).toBe(true); // 0001::/16 is outside 2000::/3
  });
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
