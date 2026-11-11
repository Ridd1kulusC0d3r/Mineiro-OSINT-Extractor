import type { MappedOrigin } from './geoPlatforms';

/*
 * Fixed tables of the legacy world map (src/components/WorldThreatMap). Nothing here is resolved or measured at
 * scan time: the vantage point is a fixed city and the mail hosts are picked by a substring of the e-mail domain.
 */

/** Vantage point the map draws its arcs from (Central European / Atlantic Cyber Hub). Not where the probes run. */
export const RECON_VANTAGE: { name: string; coordinates: [number, number]; city: string; country: string } = {
  name: 'OSINT Recon Probe [Primary Node]',
  coordinates: [8.682, 50.110], // Frankfurt, Germany
  city: 'Frankfurt am Main',
  country: 'Germany'
};

/** Mail exchanger drawn for an e-mail domain. */
export interface MailHostProfile {
  coordinates: [number, number];
  city: string;
  country: string;
  jurisdiction: MappedOrigin['jurisdiction'];
  cloud: string;
  ip: string;
  asn: string;
  host: string;
}

/** Drawn when no profile below matches the domain (Washington DC fallback). */
export const DEFAULT_MAIL_HOST: MailHostProfile = {
  coordinates: [-77.036, 38.907],
  city: 'Ashburn, VA',
  country: 'United States',
  jurisdiction: 'Five Eyes',
  cloud: 'Global Mail Routing Node',
  ip: '142.250.190.26',
  asn: 'AS15169 GOOGLE',
  host: `aspmx.l.google.com`,
};

/** First profile whose `match` substring occurs in the domain wins; order matters. */
export const MAIL_HOST_PROFILES: Array<{ match: string[]; profile: MailHostProfile }> = [
  {
    match: ['proton'],
    profile: {
      coordinates: [6.143, 46.204],
      city: 'Geneva',
      country: 'Switzerland',
      jurisdiction: 'Swiss Sanctuary',
      cloud: 'Proton AG Encrypted Vault',
      ip: '185.70.41.130',
      asn: 'AS62371 PROTON-AS',
      host: 'mail.protonmail.ch',
    },
  },
  {
    match: ['gmail', 'google'],
    profile: {
      coordinates: [-122.084, 37.422],
      city: 'Mountain View, CA',
      country: 'United States',
      jurisdiction: 'Five Eyes',
      cloud: 'Google Cloud MX Anycast',
      ip: '142.250.190.26',
      asn: 'AS15169 GOOGLE',
      host: 'aspmx.l.google.com',
    },
  },
  {
    match: ['outlook', 'hotmail'],
    profile: {
      coordinates: [-122.121, 47.674],
      city: 'Redmond, WA',
      country: 'United States',
      jurisdiction: 'Five Eyes',
      cloud: 'Microsoft Exchange Online',
      ip: '40.92.0.0',
      asn: 'AS8075 MICROSOFT',
      host: 'mail.protection.outlook.com',
    },
  },
];
