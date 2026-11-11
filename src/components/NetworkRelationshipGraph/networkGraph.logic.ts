// Pure computation of the force graph: node metrics, radii, nodes and links. No React, no DOM.
// Tested in tests/networkGraph.logic.test.ts.
import type * as d3 from 'd3';
import type { AiProfileReport, EmailReconData, ScanResult } from '../../types';
import type { generateAccountLinkageDossier } from '../../data/accountLinkage';
import { CATEGORY_COLORS, PALETTE } from '../../theme/palette';

export type SizingMode = 'completeness' | 'density' | 'uniform';
export type GraphFilterMode = 'all' | 'found_only' | 'clusters' | 'linkages';

// Graph node definition with AI-extracted profile completeness & activity density
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'target' | 'category' | 'platform' | 'linkage' | 'email';
  category?: string;
  status?: string;
  url?: string;
  confidence?: number;
  similarity?: number;
  radius: number;
  color: string;
  details?: string;
  profileCompleteness: number; // 0 - 100%
  activityDensity: number;     // 0 - 100%
  densityFactors: string[];
}

// Graph link definition
export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  type: 'hub' | 'membership' | 'correlation' | 'email' | 'metadata-cluster';
}

export interface GraphAiMetrics {
  targetCompleteness: number;
  targetDensity: number;
  targetFactors: string[];
  categoryMetrics: Record<string, { completeness: number; density: number; factors: string[] }>;
  aiPivotPlatforms: Set<string>;
}

/** Completeness and activity density of the target and of each category, from the results and the AI profile. */
export function computeAiMetrics(
  results: ScanResult[],
  aiProfile: AiProfileReport | null | undefined,
  emailData: EmailReconData | null,
): GraphAiMetrics {
  const foundResults = results.filter((r) => r.status === 'found');
  const foundCount = foundResults.length;
  const scannedCount = Math.max(1, results.filter((r) => r.status !== 'pending').length);

  // AI Investigation pivot lookup
  const aiPivotPlatforms = new Set<string>();
  if (aiProfile?.investigationPivots) {
    aiProfile.investigationPivots.forEach((p) => {
      aiPivotPlatforms.add((p.hop || '').toLowerCase());
      aiPivotPlatforms.add((p.recommendedAction || '').toLowerCase());
    });
  }

  // 1. Root Target Node Metrics
  let targetCompleteness = 0;
  let targetDensity = 0;
  const targetFactors: string[] = [];

  if (aiProfile) {
    const footprint = aiProfile.footprintScore || 50;
    const skillsCount = aiProfile.technicalSkills?.length || 0;
    const locationsCount = aiProfile.inferredLocations?.length || 0;
    const pivotsCount = aiProfile.investigationPivots?.length || 0;
    const interestsCount = aiProfile.potentialInterests?.length || 0;

    targetCompleteness = Math.min(
      100,
      Math.round(
        footprint * 0.35 +
        Math.min(skillsCount * 4, 18) +
        (aiProfile.behavioralSignals ? 18 : 0) +
        (locationsCount > 0 ? 10 : 0) +
        Math.min(pivotsCount * 3, 10) +
        Math.min(interestsCount * 2, 9)
      )
    );

    targetDensity = Math.min(
      100,
      Math.round(
        Math.min(foundCount * 5, 40) +
        (aiProfile.threatLevel === 'Critical' ? 35 : aiProfile.threatLevel === 'Elevated' ? 25 : aiProfile.threatLevel === 'Moderate' ? 15 : 8) +
        (aiProfile.behavioralSignals?.socialExposureRisk === 'Severe' ? 25 : aiProfile.behavioralSignals?.socialExposureRisk === 'Elevated' ? 15 : 5)
      )
    );

    targetFactors.push(`AI Archetype: ${aiProfile.archetype}`);
    targetFactors.push(`Exposure Threat: ${aiProfile.threatLevel} (Footprint ${aiProfile.footprintScore}/100)`);
    if (skillsCount > 0) targetFactors.push(`${skillsCount} technical skills identified`);
    if (aiProfile.behavioralSignals?.opsecHygiene) {
      targetFactors.push(`OpSec Hygiene: ${aiProfile.behavioralSignals.opsecHygiene}`);
    }
    if (locationsCount > 0) {
      targetFactors.push(`Inferred Locale: ${aiProfile.inferredLocations.join(', ')}`);
    }
  } else {
    targetCompleteness = Math.min(85, Math.round(20 + foundCount * 6));
    targetDensity = Math.min(85, Math.round((foundCount / scannedCount) * 120 + 15));
    targetFactors.push(`${foundCount} confirmed digital presences discovered`);
    targetFactors.push(`${scannedCount} probes scanned`);
  }

  // 2. Category Cluster Metrics
  const categoryMetrics: Record<string, { completeness: number; density: number; factors: string[] }> = {};
  const categoriesPresent = new Set<string>();
  results.forEach((r) => categoriesPresent.add(r.category));
  if (emailData) categoriesPresent.add('email');

  categoriesPresent.forEach((cat) => {
    const catFound = foundResults.filter((r) => r.category === cat);
    const catTotal = results.filter((r) => r.category === cat);
    const factors: string[] = [];

    let isAiAligned = false;
    let alignmentReason = '';

    if (aiProfile) {
      const arch = (aiProfile.archetype || '').toLowerCase();
      const skills = (aiProfile.technicalSkills || []).join(' ').toLowerCase();
      const interests = (aiProfile.potentialInterests || []).join(' ').toLowerCase();

      if (cat === 'developer') {
        if (arch.includes('developer') || arch.includes('architect') || arch.includes('engineer') || skills.length > 0) {
          isAiAligned = true;
          alignmentReason = 'Gemini Archetype: Software Architecture & Code Repos';
        }
      } else if (cat === 'security') {
        if (arch.includes('security') || arch.includes('bounty') || arch.includes('offensive') || aiProfile.threatLevel === 'Critical' || aiProfile.threatLevel === 'Elevated') {
          isAiAligned = true;
          alignmentReason = 'Gemini Threat Evaluation: High Security & OpSec Footprint';
        }
      } else if (cat === 'social') {
        if (aiProfile.behavioralSignals?.socialExposureRisk === 'Elevated' || aiProfile.behavioralSignals?.socialExposureRisk === 'Severe') {
          isAiAligned = true;
          alignmentReason = 'AI Behavioral Signal: Elevated Public Social Exposure';
        }
      } else if (cat === 'crypto') {
        if (interests.includes('crypto') || interests.includes('blockchain') || interests.includes('web3') || arch.includes('crypto')) {
          isAiAligned = true;
          alignmentReason = 'AI Detected Interests: Web3 / Distributed Ledger Assets';
        }
      } else if (cat === 'gaming') {
        if (interests.includes('game') || interests.includes('esports') || interests.includes('steam')) {
          isAiAligned = true;
          alignmentReason = 'AI Profile: Digital Gaming Ecosystems';
        }
      }
    }

    const hitRatio = catFound.length / Math.max(1, foundCount);
    const density = Math.min(
      100,
      Math.round(hitRatio * 50 + (catFound.length > 0 ? 25 : 0) + (isAiAligned ? 25 : 0))
    );

    const completeness = Math.min(
      100,
      Math.round(catFound.length * 15 + (isAiAligned ? 30 : 15) + (catTotal.length > 0 ? 10 : 0))
    );

    if (catFound.length > 0) factors.push(`${catFound.length} confirmed platform accounts`);
    if (isAiAligned) factors.push(alignmentReason);
    factors.push(`${catTotal.length} category surfaces monitored`);

    categoryMetrics[cat] = { completeness, density, factors };
  });

  if (emailData) {
    categoryMetrics['email'] = {
      completeness: emailData.isValidSyntax ? 85 : 40,
      density: emailData.isCommonProvider ? 60 : 80,
      factors: [
        `Target Domain: ${emailData.domain}`,
        emailData.isDisposable ? 'Disposable email vendor' : 'Primary corporate/standard mail provider'
      ]
    };
  }

  return {
    targetCompleteness,
    targetDensity,
    targetFactors,
    categoryMetrics,
    aiPivotPlatforms
  };
}

/** Node radius for the sizing mode: fixed radii in 'uniform', else scaled by completeness or density. */
export function nodeRadius(
  sizingMode: SizingMode,
  type: 'target' | 'category' | 'platform' | 'linkage' | 'email',
  status: string | undefined,
  completeness: number,
  density: number,
  similarity: number | undefined
): number {
  if (sizingMode === 'uniform') {
    if (type === 'target') return 22;
    if (type === 'category') return 14;
    if (type === 'platform') return status === 'found' ? 9 : 6;
    return 8;
  }

  const metric = sizingMode === 'completeness' ? completeness : density;
  const ratio = Math.max(0, Math.min(1, metric / 100));

  if (type === 'target') {
    // Radius scale: 22px to 38px
    return Math.round(22 + ratio * 16);
  }
  if (type === 'category') {
    // Radius scale: 13px to 25px
    return Math.round(13 + ratio * 12);
  }
  if (type === 'platform') {
    if (status === 'found') {
      // Radius scale: 8px to 17px
      return Math.round(8 + ratio * 9);
    }
    if (status === 'uncertain' || status === 'rate_limited') {
      return 6.5;
    }
    return 5;
  }
  // Linkage / Email nodes
  const sim = (similarity || 50) / 100;
  return Math.round(6 + sim * 5);
}

export interface BuildGraphInput {
  results: ScanResult[];
  target: string;
  emailData: EmailReconData | null;
  filterMode: GraphFilterMode;
  linkageReport: ReturnType<typeof generateAccountLinkageDossier>;
  aiMetrics: GraphAiMetrics;
  sizingMode: SizingMode;
}

/** Nodes (target, category hubs, platforms, permutations, e-mail correlations) and links for the filter. */
export function buildGraph({
  results, target, emailData, filterMode, linkageReport, aiMetrics, sizingMode,
}: BuildGraphInput): { nodes: GraphNode[]; links: GraphLink[] } {
  const rawNodes: GraphNode[] = [];
  const rawLinks: GraphLink[] = [];

  const calculateRadius = (
    type: GraphNode['type'],
    status: string | undefined,
    completeness: number,
    density: number,
    similarity: number | undefined,
  ) => nodeRadius(sizingMode, type, status, completeness, density, similarity);

  // 1. Central Target Node
  const targetNodeRadius = calculateRadius(
    'target',
    undefined,
    aiMetrics.targetCompleteness,
    aiMetrics.targetDensity,
    100
  );

  const targetNode: GraphNode = {
    id: `target-${target}`,
    label: `@${target}`,
    type: 'target',
    radius: targetNodeRadius,
    color: PALETTE.ink,
    confidence: 100,
    details: 'Primary Investigation Target Core',
    profileCompleteness: aiMetrics.targetCompleteness,
    activityDensity: aiMetrics.targetDensity,
    densityFactors: aiMetrics.targetFactors
  };
  rawNodes.push(targetNode);

  // 2. Category Hub Nodes
  const categoriesPresent = new Set<string>();
  results.forEach((r) => categoriesPresent.add(r.category));
  if (emailData) categoriesPresent.add('email');

  categoriesPresent.forEach((cat) => {
    const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
    const metric = aiMetrics.categoryMetrics[cat] || { completeness: 40, density: 40, factors: [] };
    const hubRadius = calculateRadius(
      'category',
      undefined,
      metric.completeness,
      metric.density,
      undefined
    );

    rawNodes.push({
      id: `hub-${cat}`,
      label: cat.toUpperCase(),
      type: 'category',
      category: cat,
      radius: hubRadius,
      color: catColor,
      details: `${cat.toUpperCase()} Cluster • ${metric.completeness}% Completeness / ${metric.density}% Density`,
      profileCompleteness: metric.completeness,
      activityDensity: metric.density,
      densityFactors: metric.factors
    });

    // Link category hub to central target
    rawLinks.push({
      source: targetNode.id,
      target: `hub-${cat}`,
      value: 3,
      type: 'hub',
    });
  });

  // 3. Platform Nodes
  results.forEach((res) => {
    if (filterMode === 'found_only' && res.status !== 'found') return;
    if (filterMode === 'clusters' && res.status !== 'found') return;

    const isFound = res.status === 'found';
    const isUncertain = res.status === 'uncertain' || res.status === 'rate_limited';

    if (!isFound && !isUncertain && filterMode !== 'all') return;

    const catMetric = aiMetrics.categoryMetrics[res.category] || { completeness: 30, density: 30 };
    const pNameLower = res.platformName.toLowerCase();
    const isAiPivot = aiMetrics.aiPivotPlatforms.has(pNameLower) || aiMetrics.aiPivotPlatforms.has(res.id.toLowerCase());

    const platformFactors: string[] = [];
    let platformCompleteness = 10;
    let platformDensity = 10;

    if (isFound) {
      platformCompleteness = Math.min(100, Math.round(55 + (res.confidenceScore || 90) * 0.3 + (isAiPivot ? 15 : 0)));
      platformDensity = Math.min(100, Math.round(45 + catMetric.density * 0.35 + (isAiPivot ? 20 : 0)));
      platformFactors.push(`Live HTTP hit confirmed (${res.confidenceScore || 95}% confidence)`);
      if (isAiPivot) platformFactors.push('Flagged by Gemini as high-value investigation pivot point');
      if (catMetric.density >= 60) platformFactors.push(`High cluster activity density in ${res.category}`);
    } else if (isUncertain) {
      platformCompleteness = 35;
      platformDensity = 25;
      platformFactors.push('Uncertain / WAF-protected response requires manual auditing');
    } else {
      platformFactors.push('Absence confirmed (HTTP 404 / inactive handle)');
    }

    const pColor = isFound
      ? PALETTE.signal
      : isUncertain
      ? PALETTE.ink2
      : PALETTE.ink3;

    const pRadius = calculateRadius(
      'platform',
      res.status,
      platformCompleteness,
      platformDensity,
      res.confidenceScore
    );

    const pNode: GraphNode = {
      id: `platform-${res.id}`,
      label: res.platformName,
      type: 'platform',
      category: res.category,
      status: res.status,
      url: res.url,
      confidence: res.confidenceScore || (isFound ? 95 : 50),
      radius: pRadius,
      color: pColor,
      details: `${res.platformName} (${res.category}) - ${res.status.toUpperCase()}`,
      profileCompleteness: platformCompleteness,
      activityDensity: platformDensity,
      densityFactors: platformFactors
    };
    rawNodes.push(pNode);

    // Link platform to its category hub
    rawLinks.push({
      source: `hub-${res.category}`,
      target: pNode.id,
      value: isFound ? 2 : 1,
      type: 'membership',
    });
  });

  // 3b. Direct Cross-Account Metadata Cluster Links
  // Connect verified platforms within the same metadata category / shared username cluster
  const verifiedByCluster: Record<string, GraphNode[]> = {};
  rawNodes.filter(n => n.type === 'platform' && n.status === 'found').forEach(pNode => {
    const clusterKey = pNode.category || 'general';
    if (!verifiedByCluster[clusterKey]) verifiedByCluster[clusterKey] = [];
    verifiedByCluster[clusterKey].push(pNode);
  });

  Object.entries(verifiedByCluster).forEach(([_clusterKey, clusterNodes]) => {
    if (clusterNodes.length > 1) {
      for (let i = 0; i < clusterNodes.length; i++) {
        for (let j = i + 1; j < Math.min(i + 3, clusterNodes.length); j++) {
          rawLinks.push({
            source: clusterNodes[i].id,
            target: clusterNodes[j].id,
            value: 1.2,
            type: 'metadata-cluster',
          });
        }
      }
    }
  });

  // 4. Linkage Theory Nodes (Account Permutations & Similarities)
  if (filterMode === 'all' || filterMode === 'linkages') {
    linkageReport.permutations.slice(0, 6).forEach((perm) => {
      const permRadius = calculateRadius('linkage', undefined, perm.similarityScore, perm.similarityScore, perm.similarityScore);
      const permNode: GraphNode = {
        id: `perm-${perm.id}`,
        label: perm.label,
        type: 'linkage',
        similarity: perm.similarityScore,
        radius: permRadius,
        color: PALETTE.ink, // Mineiro Username Intelligence Neutral Light
        details: `Permutation: ${perm.reason} [${perm.similarityScore}% similarity]`,
        profileCompleteness: perm.similarityScore,
        activityDensity: Math.round(perm.similarityScore * 0.8),
        densityFactors: [perm.reason, `Mutation: ${perm.mutationType}`]
      };
      rawNodes.push(permNode);

      rawLinks.push({
        source: targetNode.id,
        target: permNode.id,
        value: 1.5,
        type: 'correlation',
      });
    });

    // Email linkage nodes
    linkageReport.emailCorrelations.slice(0, 3).forEach((ec) => {
      const emailRadius = calculateRadius('email', undefined, ec.similarityScore, ec.similarityScore, ec.similarityScore);
      const emailNode: GraphNode = {
        id: `email-${ec.id}`,
        label: ec.label,
        type: 'email',
        similarity: ec.similarityScore,
        radius: emailRadius,
        color: PALETTE.ink, // Mineiro Username Intelligence Cyan Signal
        details: `Email Correlation: ${ec.reason}`,
        profileCompleteness: ec.similarityScore,
        activityDensity: Math.round(ec.similarityScore * 0.85),
        densityFactors: [ec.reason, 'Correlation from MX/Syntax patterns']
      };
      rawNodes.push(emailNode);

      rawLinks.push({
        source: targetNode.id,
        target: emailNode.id,
        value: 1.5,
        type: 'email',
      });
    });
  }

  return { nodes: rawNodes, links: rawLinks };
}
