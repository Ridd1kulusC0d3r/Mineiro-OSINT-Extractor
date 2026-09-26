import { PLATFORMS_DATABASE, EVIDENCE_CHECKS } from '../data/platforms';
import { RegistryBreakdownItem, RegistryDetector, RegistryStats } from './types';

export const MINEIRO_REGISTRY: RegistryDetector[] = PLATFORMS_DATABASE.map((platform) => ({
  id: platform.id,
  name: platform.name,
  category: platform.category,
  siteType: platform.siteType || platform.category,
  urlPattern: platform.urlPattern,
  checkMethod: platform.checkMethod,
  detectorReliability: platform.detectorReliability ?? 60,
  reliabilityTier: platform.reliabilityTier ?? 'experimental',
  provenanceStatus: platform.provenanceStatus ?? 'legacy-audit-required',
  licenseStatus: platform.licenseStatus ?? 'project-legacy-unverified',
  optionalEvidenceChecks: platform.optionalEvidenceChecks ?? [],
  lastVerified: platform.lastVerified,
}));

function breakdown(values: string[]): RegistryBreakdownItem[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const total = Math.max(1, values.length);
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      count,
      percent: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function getRegistryStats(): RegistryStats {
  const total = MINEIRO_REGISTRY.length;
  const reliabilitySum = MINEIRO_REGISTRY.reduce(
    (sum, detector) => sum + detector.detectorReliability,
    0
  );

  return {
    totalDetectors: total,
    logicalEvidenceChecks: total * EVIDENCE_CHECKS.length,
    evidenceChecksPerDetector: EVIDENCE_CHECKS.length,
    byCategory: breakdown(MINEIRO_REGISTRY.map((d) => d.category)),
    bySiteType: breakdown(MINEIRO_REGISTRY.map((d) => d.siteType)),
    byReliabilityTier: breakdown(MINEIRO_REGISTRY.map((d) => d.reliabilityTier)),
    byProvenance: breakdown(MINEIRO_REGISTRY.map((d) => d.provenanceStatus)),
    averageReliability: total ? Math.round(reliabilitySum / total) : 0,
    verifiedDetectors: MINEIRO_REGISTRY.filter((d) => d.provenanceStatus === 'verified').length,
    auditRequiredDetectors: MINEIRO_REGISTRY.filter(
      (d) => d.provenanceStatus === 'legacy-audit-required'
    ).length,
  };
}

export function getRegistryDetector(id: string): RegistryDetector | undefined {
  return MINEIRO_REGISTRY.find((detector) => detector.id === id);
}
