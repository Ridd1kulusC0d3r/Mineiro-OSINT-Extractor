import { describe, expect, it } from 'vitest';
import {
  buildCountryDensityMap,
  buildMappedOrigins,
  filterMatrixRows,
  filterOrigins,
  mailHostFor,
  mapDimensions,
  matchesCountry,
} from '../src/components/WorldThreatMap/worldThreatMap.logic';
import { DEFAULT_MAIL_HOST } from '../src/data/worldMapHosts';
import { email, result } from './helpers/scanFixtures';

describe('world map logic', () => {
  it('matches TopoJSON country names against origin countries, including the US and UK aliases', () => {
    expect(matchesCountry('United States of America', 'United States')).toBe(true);
    expect(matchesCountry('USA', 'United States')).toBe(true);
    expect(matchesCountry('United Kingdom', 'United Kingdom')).toBe(true);
    expect(matchesCountry('Germany', 'Switzerland')).toBe(false);
    expect(matchesCountry('', 'Germany')).toBe(false);
  });

  it('picks the mail host by the first matching domain substring', () => {
    expect(mailHostFor('proton.me').city).toBe('Geneva');
    expect(mailHostFor('googlemail.com').city).toBe('Mountain View, CA');
    expect(mailHostFor('hotmail.com').city).toBe('Redmond, WA');
    expect(mailHostFor('example.org')).toBe(DEFAULT_MAIL_HOST);
  });

  it('maps only found results, plus the MX host when an e-mail domain is known', () => {
    const results = [
      result({ platformId: 'github', category: 'developer' }),
      result({ platformId: 'steam', category: 'gaming', status: 'not_found' }),
    ];
    const plain = buildMappedOrigins(results, null);
    expect(plain.map((o) => o.platformId)).toEqual(['github']);
    expect(plain[0]).toMatchObject({ country: 'United States', jurisdiction: 'Five Eyes', status: 'found' });
    expect(plain[0].threatDensityWeight).toBeGreaterThan(0);

    const withMail = buildMappedOrigins(results, email());
    expect(withMail).toHaveLength(2);
    expect(withMail[1]).toMatchObject({
      id: 'email-mx-origin', platformName: 'MX: proton.me', city: 'Geneva', jurisdiction: 'Swiss Sanctuary',
      subpoenaExposure: 'Low (Sanctuary)', resolvedHost: 'mail.protonmail.ch', isp: 'Proton AG Encrypted Vault Backbone',
    });
  });

  it('is deterministic for the same input', () => {
    const results = [result({ platformId: 'instagram' }), result({ platformId: 'tiktok' })];
    expect(buildMappedOrigins(results, null)).toEqual(buildMappedOrigins(results, null));
  });

  it('filters by jurisdiction and physical risk, and searches the matrix', () => {
    const origins = buildMappedOrigins([
      result({ platformId: 'github', category: 'developer' }),
      result({ platformId: 'tiktok' }),
    ], email({ domain: 'gmail.com', email: 'a@gmail.com' }));
    expect(filterOrigins(origins, 'all', false)).toHaveLength(3);
    expect(filterOrigins(origins, 'APAC', false).map((o) => o.platformId)).toEqual(['tiktok']);
    expect(filterOrigins(origins, 'all', true).every((o) => o.physicalRisk === 'high')).toBe(true);
    expect(filterMatrixRows(origins, '   ')).toBe(origins);
    expect(filterMatrixRows(origins, 'GITHUB').map((o) => o.platformId)).toEqual(['github']);
    expect(filterMatrixRows(origins, 'mountain view').map((o) => o.platformId)).toEqual(['email_mx']);
  });

  it('sums density weights per country', () => {
    const origins = buildMappedOrigins([result({ platformId: 'github' }), result({ platformId: 'gitlab' })], null);
    const map = buildCountryDensityMap(origins);
    expect(map['United States'].count).toBe(2);
    expect(map['United States'].totalDensity).toBe(origins[0].threatDensityWeight + origins[1].threatDensityWeight);
  });

  it('sizes the map from the container width within its bounds', () => {
    expect(mapDimensions(0)).toEqual({ width: 320, height: 380 });
    expect(mapDimensions(800)).toEqual({ width: 800, height: 416 });
    expect(mapDimensions(1130)).toEqual({ width: 1130, height: 540 });
  });
});
