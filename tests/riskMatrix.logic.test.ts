import { describe, expect, it } from 'vitest';
import {
  buildRiskAccounts,
  calculateActivityFrequency,
  calculatePlatformSensitivity,
  countQuadrants,
  filterRiskAccounts,
  hashString,
  matrixDimensions,
} from '../src/components/RiskMatrix2x2/riskMatrix.logic';
import { result } from './helpers/scanFixtures';

describe('risk matrix logic', () => {
  it('hashes strings deterministically and never negative', () => {
    expect(hashString('')).toBe(0);
    expect(hashString('github')).toBe(hashString('github'));
    expect(hashString('a much longer platform name')).toBeGreaterThanOrEqual(0);
  });

  it('places sensitivity in the tier of the category or platform name', () => {
    const tier = (r: ReturnType<typeof result>) => calculatePlatformSensitivity(r);
    expect(tier(result({ platformId: 'coinbase', platformName: 'Coinbase', category: 'crypto' }))).toBeGreaterThanOrEqual(85);
    expect(tier(result({ platformId: 'coinbase', platformName: 'Coinbase', category: 'crypto' }))).toBeLessThanOrEqual(97);
    const dev = tier(result({ platformId: 'gitlab', platformName: 'GitLab', category: 'developer' }));
    expect(dev).toBeGreaterThanOrEqual(65);
    expect(dev).toBeLessThanOrEqual(82);
    const game = tier(result({ platformId: 'steam', platformName: 'Steam', category: 'gaming' }));
    expect(game).toBeGreaterThanOrEqual(20);
    expect(game).toBeLessThanOrEqual(41);
  });

  it('keeps activity within 10..98 and adds 5 for fast responses', () => {
    const slow = result({ platformId: 'lichess', platformName: 'Lichess', category: 'gaming', responseTimeMs: 900 });
    const fast = { ...slow, responseTimeMs: 100 };
    const a = calculateActivityFrequency(slow, 0);
    expect(a).toBeGreaterThanOrEqual(10);
    expect(a).toBeLessThanOrEqual(98);
    expect(calculateActivityFrequency(fast, 0)).toBe(Math.min(98, a + 5));
  });

  it('builds one account per found result, in the quadrant of its scores', () => {
    const accounts = buildRiskAccounts([
      result({ platformId: 'instagram', platformName: 'Instagram', category: 'social' }),
      result({ platformId: 'steam', platformName: 'Steam Community', category: 'gaming' }),
      result({ platformId: 'x', platformName: 'X', status: 'not_found' }),
    ]);
    expect(accounts.map((a) => a.id)).toEqual(['instagram', 'steam']);
    for (const a of accounts) {
      const expected = a.sensitivity >= 50 ? (a.activity >= 50 ? 'critical' : 'latent') : (a.activity >= 50 ? 'surface' : 'peripheral');
      expect(a.quadrant).toBe(expected);
      expect(a.priorityScore).toBe(Math.round(a.sensitivity * 0.6 + a.activity * 0.4));
    }
    const counts = countQuadrants(accounts);
    expect(counts.all).toBe(2);
    expect(counts.critical + counts.latent + counts.surface + counts.peripheral).toBe(2);
  });

  it('filters by quadrant and search', () => {
    const accounts = buildRiskAccounts([
      result({ platformId: 'instagram', platformName: 'Instagram', category: 'social' }),
      result({ platformId: 'steam', platformName: 'Steam Community', category: 'gaming' }),
    ]);
    expect(filterRiskAccounts(accounts, 'all', '')).toHaveLength(2);
    expect(filterRiskAccounts(accounts, 'all', 'GAMING').map((a) => a.id)).toEqual(['steam']);
    const q = accounts[0].quadrant;
    expect(filterRiskAccounts(accounts, q, '').every((a) => a.quadrant === q)).toBe(true);
  });

  it('sizes the SVG from the container width', () => {
    expect(matrixDimensions(0)).toEqual({ width: 700, height: 460 });
    expect(matrixDimensions(746)).toEqual({ width: 746, height: 477 });
    expect(matrixDimensions(2000)).toEqual({ width: 2000, height: 640 });
  });
});
