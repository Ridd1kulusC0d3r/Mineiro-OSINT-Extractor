// Columns of the heat map: labels, descriptions and units (presentation only).

export const DIMENSIONS: Array<{
  id: 'presenceDensity' | 'profileCompleteness' | 'responseSpeedScore' | 'exposureThreatScore' | 'linkageCorrelation' | 'compositeIntensity';
  name: string;
  short: string;
  description: string;
  unit: string;
}> = [
  {
    id: 'presenceDensity',
    name: 'Digital Presence',
    short: 'PRESENCE',
    description: 'Density of confirmed active accounts relative to sector total.',
    unit: '%',
  },
  {
    id: 'profileCompleteness',
    name: 'Profile Completeness',
    short: 'COMPLETENESS',
    description: 'Index of extracted metadata (bio, avatars, public repos, tags).',
    unit: '%',
  },
  {
    id: 'responseSpeedScore',
    name: 'Network Activity',
    short: 'RESPONSE',
    description: 'Responsiveness and probe latency measured on platform servers.',
    unit: 'pts',
  },
  {
    id: 'linkageCorrelation',
    name: 'Alias Correlation',
    short: 'CORRELATION',
    description: 'Probability of cross-identity reuse by the same entity.',
    unit: '%',
  },
  {
    id: 'exposureThreatScore',
    name: 'OpSec Exposure Risk',
    short: 'OPSEC RISK',
    description: 'Sensitivity of exposed data (source code, wallets, infrastructure, keys).',
    unit: '%',
  },
  {
    id: 'compositeIntensity',
    name: 'Relative Intensity',
    short: 'INTENSITY',
    description: 'Consolidated concentration score of the sector digital footprint.',
    unit: '%',
  },
];
