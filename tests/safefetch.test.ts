import http from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assertProbeableUrl, BlockedTargetError, safeFetch } from '../server/security/safeFetch';

let server: http.Server;
let port = 0;

beforeAll(async () => {
  server = http.createServer((req, res) => { res.end('internal secret'); });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as any).port;
});
afterAll(() => server.close());

describe('safeFetch', () => {
  it('rejects loopback literals and internal hostnames before connecting', () => {
    for (const url of [`http://127.0.0.1:${port}/`, 'http://localhost/', 'http://169.254.169.254/', 'http://[::1]/', 'ftp://example.com/', 'https://u:p@example.com/', 'http://example.com:8080/']) {
      expect(() => assertProbeableUrl(url), url).toThrow(BlockedTargetError);
    }
  });

  it('accepts ordinary public hostnames and public IP literals', () => {
    expect(assertProbeableUrl('https://x.com/pascho').hostname).toBe('x.com');
    expect(assertProbeableUrl('https://8.8.8.8/').hostname).toBe('8.8.8.8');
    expect(assertProbeableUrl('https://192.0.80.36/').hostname).toBe('192.0.80.36'); // Gravatar range (defect 1)
  });

  it('rejects IPv4-mapped IPv6 literals, which the URL parser rewrites to hex', () => {
    for (const url of ['http://[::ffff:127.0.0.1]/', 'http://[::ffff:169.254.169.254]/', 'http://[::ffff:7f00:1]/', 'http://[64:ff9b::a9fe:a9fe]/']) {
      expect(() => assertProbeableUrl(url), url).toThrow(BlockedTargetError);
    }
  });

  it('blocks a hostname that resolves to a private address (DNS-level guard)', async () => {
    // localtest.me and nip.io style names resolve to 127.0.0.1; "localhost" is resolved by the OS.
    await expect(safeFetch('http://localhost.localdomain/')).rejects.toThrow();
  });
});
