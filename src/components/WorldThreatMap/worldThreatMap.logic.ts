// Pure computation of the world map: no React, no DOM. Tested in tests/worldThreatMap.logic.test.ts.
import type { EmailReconData, ScanResult } from '../../types';
import {
  calculateThreatDensityWeight,
  resolvePlatformGeo,
  type MappedOrigin,
  type ThreatDensityCluster,
} from '../../data/geoPlatforms';
import { DEFAULT_MAIL_HOST, MAIL_HOST_PROFILES, type MailHostProfile } from '../../data/worldMapHosts';

export type CountryDensityMap = Record<string, { count: number; totalDensity: number }>;

export function matchesCountry(featureName: string, originCountry: string): boolean {
  if (!featureName || !originCountry) return false;
  const f = featureName.toLowerCase();
  const o = originCountry.toLowerCase();
  if (f === o) return true;
  if (o.includes('united states') && (f.includes('united states') || f === 'usa')) return true;
  if (o.includes('united kingdom') && (f.includes('united kingdom') || f === 'uk' || f.includes('great britain'))) return true;
  return f.includes(o) || o.includes(f);
}

/** Mail host drawn for a domain: the first matching profile of MAIL_HOST_PROFILES, else DEFAULT_MAIL_HOST. */
export function mailHostFor(domain: string): MailHostProfile {
  const hit = MAIL_HOST_PROFILES.find(({ match }) => match.some((m) => domain.includes(m)));
  return hit ? hit.profile : DEFAULT_MAIL_HOST;
}

/** Found results (and the e-mail's MX host, when the domain is known) as map origins. */
export function buildMappedOrigins(results: ScanResult[], emailData: EmailReconData | null): MappedOrigin[] {
  const found = results.filter((r) => r.status === 'found');
  const mapped: MappedOrigin[] = [];

  found.forEach((r) => {
    const geo = resolvePlatformGeo(r.platformId, r.platformName, r.category);
    const densityWeight = calculateThreatDensityWeight(geo.threatScore, geo.physicalRisk, geo.jurisdiction);

    mapped.push({
      id: r.id,
      platformId: r.platformId,
      platformName: r.platformName,
      category: r.category,
      url: r.url,
      coordinates: geo.coordinates,
      city: geo.city,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      jurisdiction: geo.jurisdiction,
      threatScore: geo.threatScore,
      cloudProvider: geo.cloudProvider,
      subpoenaExposure: geo.subpoenaExposure,
      physicalRisk: geo.physicalRisk,
      threatNotes: geo.threatNotes,
      status: r.status,
      confidenceScore: r.confidenceScore,
      serverIp: geo.serverIp || '104.26.12.89',
      asn: geo.asn || 'AS13335 CLOUDFLARENET',
      isp: geo.isp || 'Global Edge Network',
      resolvedHost: geo.resolvedHost || `${r.platformId}.edge-origin.net`,
      threatDensityWeight: densityWeight
    });
  });

  // If email reconnaissance detected an active MX domain, map the mailhost infrastructure
  if (emailData && emailData.domain) {
    const {
      coordinates: mxCoords,
      city: mxCity,
      country: mxCountry,
      jurisdiction: mxJurisdiction,
      cloud: mxCloud,
      ip: mxIp,
      asn: mxAsn,
      host: mxHost,
    } = mailHostFor(emailData.domain);

    mapped.push({
      id: 'email-mx-origin',
      platformId: 'email_mx',
      platformName: `MX: ${emailData.domain}`,
      category: 'security',
      url: `mailto:${emailData.email}`,
      coordinates: mxCoords,
      city: mxCity,
      country: mxCountry,
      countryCode: 'US',
      region: 'North America',
      jurisdiction: mxJurisdiction,
      threatScore: 82,
      cloudProvider: mxCloud,
      subpoenaExposure: mxJurisdiction === 'Swiss Sanctuary' ? 'Low (Sanctuary)' : 'High (MLAT)',
      physicalRisk: 'low',
      threatNotes: `Authoritative Mail eXchanger for domain ${emailData.domain}. Active MX servers receive unencrypted SMTP handshake signals.`,
      status: 'found',
      confidenceScore: 99.8,
      serverIp: mxIp,
      asn: mxAsn,
      isp: `${mxCloud} Backbone`,
      resolvedHost: mxHost,
      threatDensityWeight: 88
    });
  }

  return mapped;
}

/** Origins left by the jurisdiction tab and the "GPS risk" toggle. */
export function filterOrigins(origins: MappedOrigin[], jurisdiction: string, onlyPhysicalRisk: boolean): MappedOrigin[] {
  return origins.filter((origin) => {
    if (jurisdiction !== 'all' && origin.jurisdiction !== jurisdiction) {
      return false;
    }
    if (onlyPhysicalRisk && origin.physicalRisk !== 'high') {
      return false;
    }
    return true;
  });
}

/** Origins per country name, with the sum of their density weights. */
export function buildCountryDensityMap(origins: MappedOrigin[]): CountryDensityMap {
  const map: Record<string, { count: number; totalDensity: number }> = {};
  origins.forEach((o) => {
    map[o.country] = map[o.country] || { count: 0, totalDensity: 0 };
    map[o.country].count += 1;
    map[o.country].totalDensity += o.threatDensityWeight;
  });
  return map;
}

/** Correlation-matrix rows matching the search box (platform, URL, IP, ASN, city, country or host). */
export function filterMatrixRows(origins: MappedOrigin[], search: string): MappedOrigin[] {
  if (!search.trim()) return origins;
  const q = search.toLowerCase();
  return origins.filter(
    (o) =>
      o.platformName.toLowerCase().includes(q) ||
      o.url.toLowerCase().includes(q) ||
      o.serverIp.toLowerCase().includes(q) ||
      o.asn.toLowerCase().includes(q) ||
      o.city.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q) ||
      o.resolvedHost.toLowerCase().includes(q)
  );
}

/** SVG size for a container width: at least 320 wide, height 52% of the width within 380..540. */
export function mapDimensions(clientWidth: number): { width: number; height: number } {
  const width = Math.max(320, clientWidth);
  const height = Math.max(380, Math.min(540, Math.round(width * 0.52)));
  return { width, height };
}
