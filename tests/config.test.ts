import { describe, expect, it } from 'vitest';
import { listenHost, listenPort } from '../server/config';

describe('listen address (defect 14)', () => {
  it('defaults to loopback, not 0.0.0.0', () => {
    expect(listenHost({})).toBe('127.0.0.1');
    expect(listenHost({ HOST: '' })).toBe('127.0.0.1');
    expect(listenHost({ HOST: '  ' })).toBe('127.0.0.1');
  });

  it('lets HOST override it (containers set 0.0.0.0)', () => {
    expect(listenHost({ HOST: '0.0.0.0' })).toBe('0.0.0.0');
    expect(listenHost({ HOST: '::' })).toBe('::');
  });

  it('keeps PORT 3000 by default', () => {
    expect(listenPort({})).toBe(3000);
    expect(listenPort({ PORT: '3400' })).toBe(3400);
  });
});
