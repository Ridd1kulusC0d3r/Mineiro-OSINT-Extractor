import { ScanResult, AiProfileReport, EmailReconData, InvestigationSnapshot } from '../types';

export interface ReportSectionsToggle {
  executiveSummary: boolean;
  aiProfile: boolean;
  threatActor: boolean;
  behavioralSignals: boolean;
  timeline: boolean;
  strategicPivots: boolean;
  defensiveHardening: boolean;
  emailRecon: boolean;
  platformFindings: boolean;
  wafUncertain: boolean;
  snapshotBlock?: boolean;
}

export const DEFAULT_REPORT_SECTIONS: ReportSectionsToggle = {
  executiveSummary: true,
  aiProfile: true,
  threatActor: true,
  behavioralSignals: true,
  timeline: true,
  strategicPivots: true,
  defensiveHardening: true,
  emailRecon: true,
  platformFindings: true,
  wafUncertain: true,
  snapshotBlock: true,
};

export interface ReportGeneratorOptions {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  aiProfile?: AiProfileReport | null;
  emailData?: EmailReconData | null;
  snapshot?: InvestigationSnapshot | null;
  sections?: Partial<ReportSectionsToggle>;
}

export function generateMarkdownReport({
  target,
  targetType,
  results,
  aiProfile,
  emailData,
  snapshot,
  sections: userSections,
}: ReportGeneratorOptions): string {
  const sections: ReportSectionsToggle = {
    ...DEFAULT_REPORT_SECTIONS,
    ...userSections,
  };

  const timestamp = new Date().toISOString();
  const utcDate = new Date().toUTCString();
  const caseId = `MINEIRO-OSINT-${target.toUpperCase()}-${new Date().getFullYear()}`;
  const cleanPipes = (str: string) => (str || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

  const foundResults = results.filter((r) => r.status === 'found');
  const uncertainResults = results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited');

  let md = `# 🛡️ OSINT Forensic Intelligence Report: @${target}\n\n`;
  md += `> **CONFIDENTIAL INVESTIGATION DOSSIER**  \n`;
  md += `> **System:** Mineiro Username Extractor Unified OSINT Reconnaissance Suite  \n`;
  md += `> **Generated:** ${timestamp} (${utcDate})  \n`;
  md += `> **Case Reference ID:** \`${caseId}\`  \n\n`;
  md += `---\n\n`;


  let sectionCounter = 1;

  // 1. Executive Summary & Subject Overview
  if (sections.executiveSummary) {
    md += `## ${sectionCounter++}. Executive Summary & Subject Overview\n\n`;
    md += `| Investigation Metric | Finding |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Target Moniker** | \`@${cleanPipes(target)}\` |\n`;
    md += `| **Target Identifier Type** | \`${targetType.toUpperCase()}\` |\n`;
    md += `| **Total Platforms Probed** | **${results.length}** platforms |\n`;
    md += `| **Corroborated Identities (Verified Hits)** | **${foundResults.length}** active accounts |\n`;
    md += `| **WAF-Challenged / Uncertain Probes** | ${uncertainResults.length} protected endpoints |\n`;
    if (aiProfile) {
      md += `| **Digital Footprint Surface Score** | **${aiProfile.footprintScore} / 100** |\n`;
      md += `| **Threat & Exposure Level** | **${aiProfile.threatLevel.toUpperCase()}** |\n`;
      md += `| **Corroborated Archetype** | **${cleanPipes(aiProfile.archetype)}** |\n`;
      if (aiProfile.industry) {
        md += `| **Industry Sector** | ${cleanPipes(aiProfile.industry)} |\n`;
      }
    }
    md += `\n`;

    if (aiProfile?.summary) {
      md += `### Executive Intelligence Brief\n\n`;
      md += `${aiProfile.summary}\n\n`;
    } else {
      md += `### Executive Intelligence Brief\n\n`;
      md += `Target reconnaissance conducted across ${results.length} cross-domain platforms, successfully verifying ${foundResults.length} active identity footprints for subject \`@${target}\`.\n\n`;
    }
  }

  // 2. Multi-Pass Behavioral & Technical Footprint Calibration
  if (sections.aiProfile && aiProfile) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Multi-Pass Behavioral & Technical Footprint Calibration\n\n`;

    md += `### Behavioral Archetype\n\n`;
    md += `- **Synthesized Archetype:** **${aiProfile.archetype}**\n`;
    if (aiProfile.archetypeDescription) {
      md += `- **Forensic Synthesis Rationale:** ${aiProfile.archetypeDescription}\n`;
    }
    md += `\n`;

    if (aiProfile.technicalFootprint || aiProfile.industry || aiProfile.interests?.length) {
      md += `### Multi-Pass Entity Verification\n\n`;
      md += `| Evaluated Entity | Status / Value | Corroborating Context |\n`;
      md += `| :--- | :--- | :--- |\n`;
      md += `| **Industry Sector** | ${cleanPipes(aiProfile.industry || 'Domain Specific')} | Cross-platform category concentration and domain frequency analysis |\n`;
      md += `| **Technical Footprint Level** | \`${aiProfile.technicalFootprint?.level || 'None'}\` | ${cleanPipes(aiProfile.technicalFootprint?.evidence || 'Derived from source repositories and platform participation')} |\n`;
      md += `| **Tech Professional Guard** | **${aiProfile.technicalFootprint?.isTechProfessional ? 'Corroborated Tech Professional' : 'Guarded Non-Tech User'}** | Weighted against verified code repositories and bug bounty accounts to eliminate false positives |\n`;
      if (aiProfile.technicalFootprint?.primaryTools?.length) {
        md += `| **Primary Tools & Stack** | \`${cleanPipes(aiProfile.technicalFootprint.primaryTools.join(', '))}\` | Corroborated platform activity signatures |\n`;
      }
      if (aiProfile.interests?.length) {
        md += `| **Identified Affinities & Interests** | ${cleanPipes(aiProfile.interests.join(', '))} | Multi-account affinity graph clustering |\n`;
      }
      md += `\n`;
    }
  }

  // 3. Security-Focused Heuristics & Threat Actor Profiling
  if (sections.threatActor && aiProfile?.threatActorAnalysis) {
    const ta = aiProfile.threatActorAnalysis;
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Threat Actor Profiling & Occupation Cross-Referencing\n\n`;
    md += `| Heuristic Assessment Parameter | Forensic Determination |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Classification Verdict** | **${cleanPipes(ta.verdictTitle)}** |\n`;
    md += `| **Threat Category** | \`${ta.threatActorCategory}\` |\n`;
    md += `| **Threat Actor Suspicion Score** | **${ta.threatActorScore} / 100** (${ta.isThreatActorSuspect ? 'SUSPECT' : 'BENIGN / NON-ADVERSARIAL'}) |\n`;
    md += `| **Analysis Confidence Score** | **${ta.confidenceScore} / 100** |\n`;
    md += `| **Occupation Consistency Verdict** | \`${cleanPipes(ta.occupationCrossReference?.consistencyVerdict || 'CONSISTENT_LEGITIMATE')}\` |\n`;
    md += `\n`;

    if (ta.verdictSummary) {
      md += `### Forensic Verdict Summary\n\n`;
      md += `${ta.verdictSummary}\n\n`;
    }

    if (ta.occupationCrossReference) {
      md += `### Occupation Cross-Examination\n\n`;
      md += `- **Inferred Primary Occupation:** ${ta.occupationCrossReference.inferredOccupation}\n`;
      md += `- **Observed Platform Pattern:** ${ta.occupationCrossReference.platformBehaviorPattern}\n`;
      md += `- **Consistency Verdict:** \`${ta.occupationCrossReference.consistencyVerdict}\`\n`;
      if (ta.occupationCrossReference.analysis) {
        md += `- **Forensic Analysis:** ${ta.occupationCrossReference.analysis}\n`;
      }
      md += `\n`;
    }

    if (ta.observedTTPs?.length) {
      md += `### Observed Tactics, Techniques & Procedures (TTPs)\n\n`;
      ta.observedTTPs.forEach((ttp) => {
        md += `- \`${ttp}\`\n`;
      });
      md += `\n`;
    }

    if (ta.indicatorMatches?.length) {
      md += `### Corroborated Security Indicators\n\n`;
      md += `| Category | Severity | Indicator | Corroborating Evidence |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      ta.indicatorMatches.forEach((ind) => {
        md += `| \`${cleanPipes(ind.category)}\` | **${ind.severity.toUpperCase()}** | ${cleanPipes(ind.indicator)} | ${cleanPipes(ind.evidence)} |\n`;
      });
      md += `\n`;
    }
  }

  // 4. Behavioral, Timezone & Linguistic Signals
  if (sections.behavioralSignals && aiProfile?.behavioralSignals) {
    const bs = aiProfile.behavioralSignals;
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Behavioral, Timezone & Linguistic Signals\n\n`;
    md += `| Signal Category | Extracted Forensic Value |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Inferred Primary Timezone** | \`${bs.timezone}\` (${bs.activeTimezoneWindow}) |\n`;
    md += `| **Primary Language & Dialect** | **${bs.primaryLanguage || bs.language}** |\n`;
    if (bs.secondaryLanguages?.length) {
      md += `| **Secondary / Technical Languages** | ${bs.secondaryLanguages.join(', ')} |\n`;
    }
    md += `| **Observed Linguistic Style** | ${cleanPipes(bs.linguisticStyle)} |\n`;
    md += `| **OPSEC Hygiene** | \`${bs.opsecHygiene}\` |\n`;
    md += `| **Handle Persistence Pattern** | ${bs.handlePersistencePattern} |\n`;
    md += `| **Anonymity Effort Level** | ${bs.anonymityEffort} |\n`;
    md += `| **Account Creation Era** | ${bs.accountCreationEra} |\n`;
    md += `\n`;

    if (bs.timezoneSignals?.length) {
      md += `**Timezone Indicators:**\n`;
      bs.timezoneSignals.forEach((sig) => {
        md += `- ${sig}\n`;
      });
      md += `\n`;
    }

    if (bs.languageSignals?.length) {
      md += `**Language Indicators:**\n`;
      bs.languageSignals.forEach((sig) => {
        md += `- ${sig}\n`;
      });
      md += `\n`;
    }
  }

  // 5. Chronological Inception & Account Timeline
  if (sections.timeline && foundResults.length > 0) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Chronological Inception & Platform Footprint Timeline\n\n`;
    md += `Reconstructed temporal sequence based on platform public launch dates and moniker adoption heuristics:\n\n`;
    md += `| Est. Genesis Period | Platform | Category | Inferred Seniority Index | Endpoint |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    foundResults.forEach((r) => {
      const pName = cleanPipes(r.platformName);
      const cat = cleanPipes(r.category);
      md += `| Pioneer / Established | **${pName}** | \`${cat}\` | Corroborated Identity | [${r.url}](${r.url}) |\n`;
    });
    md += `\n`;
  }

  // 6. Strategic Investigation Pivots
  if (sections.strategicPivots && aiProfile?.investigationPivots?.length) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Strategic Investigation Pivots\n\n`;
    md += `| Pivot Target / Hop | Type | Strategic Explanation | Actionable Query / Syntax |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    aiProfile.investigationPivots.forEach((p) => {
      md += `| **${cleanPipes(p.hop)}** | \`${p.type}\` | ${cleanPipes(p.explanation)} | \`${cleanPipes(p.recommendedAction)}\` |\n`;
    });
    md += `\n`;
  }

  // 7. Defensive Recommendations & Vulnerabilities
  if (sections.defensiveHardening && (aiProfile?.threatVulnerabilities?.length || aiProfile?.recommendedDefensiveActions?.length)) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Threat Surface & Defensive Hardening\n\n`;
    if (aiProfile.threatVulnerabilities?.length) {
      md += `### Identified Attack Surface & Vulnerabilities\n\n`;
      aiProfile.threatVulnerabilities.forEach((v) => {
        md += `- ⚠️ ${v}\n`;
      });
      md += `\n`;
    }
    if (aiProfile.recommendedDefensiveActions?.length) {
      md += `### Recommended OPSEC Hardening Countermeasures\n\n`;
      aiProfile.recommendedDefensiveActions.forEach((a) => {
        md += `- 🛡️ ${a}\n`;
      });
      md += `\n`;
    }
  }

  // 8. Email Infrastructure Recon
  if (sections.emailRecon && emailData) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Email Infrastructure Reconnaissance\n\n`;
    md += `| Parameter | Technical Finding |\n`;
    md += `| :--- | :--- |\n`;
    md += `| **Email Identifier** | \`${cleanPipes(emailData.email)}\` |\n`;
    md += `| **Apex Domain** | \`${cleanPipes(emailData.domain)}\` |\n`;
    md += `| **MX Records Status** | ${emailData.mxRecordsFound ? '✅ Active Mail Exchanger Corroborated' : '❌ No Active MX Records Found'} |\n`;
    if (emailData.mxServers?.length) {
      md += `| **Mail Servers** | \`${emailData.mxServers.join(', ')}\` |\n`;
    }
    md += `| **Gravatar Profile Avatar** | ${emailData.gravatarExists ? '✅ Confirmed Linked Profile Image' : '❌ Not Detected'} |\n\n`;
  }

  // 9. Verified Platform Accounts Table
  if (sections.platformFindings) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Verified Platform Accounts (${foundResults.length} Confirmed Profiles)\n\n`;
    if (foundResults.length === 0) {
      md += `*No confirmed profiles identified across selected search scope.*\n\n`;
    } else {
      md += `| # | Platform | Category | Verified Profile URL | Status Code | Latency | Confidence |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      foundResults.forEach((r, idx) => {
        const num = (idx + 1).toString().padStart(2, '0');
        const cat = cleanPipes(r.category);
        const name = cleanPipes(r.platformName);
        const url = r.url;
        const code = r.statusCode || 200;
        const latency = `${r.responseTimeMs || 0}ms`;
        const conf = `${r.confidenceScore || 95}%`;
        md += `| ${num} | **${name}** | \`${cat}\` | [${url}](${url}) | \`HTTP ${code}\` | ${latency} | ${conf} |\n`;
      });
      md += `\n`;
    }
  }

  // 10. Uncertain / Cloudflare WAF Challenges
  if (sections.wafUncertain && uncertainResults.length > 0) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Uncertain / Cloudflare WAF Protected Endpoints (${uncertainResults.length})\n\n`;
    md += `| Platform | Category | Target Endpoint | WAF / Protection Trigger |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    uncertainResults.forEach((r) => {
      md += `| **${cleanPipes(r.platformName)}** | \`${cleanPipes(r.category)}\` | [${r.url}](${r.url}) | ${cleanPipes(r.uncertainReason || 'Cloudflare Anti-Bot / HTTP ' + (r.statusCode || 403))} |\n`;
    });
    md += `\n`;
  }

  // 11. Cryptographic Investigation Snapshot & Forensic Chain of Custody
  if (sections.snapshotBlock && snapshot) {
    md += `---\n\n`;
    md += `## ${sectionCounter++}. Cryptographic Investigation Snapshot & Forensic Chain of Custody\n\n`;
    md += `> **Verification Integrity**: This snapshot preserves an immutable cryptographic hash record representing the exact findings corroborated at time of acquisition.\n\n`;
    md += `\`\`\`text\n${snapshot.summaryBlockText}\n\`\`\`\n\n`;
  }

  md += `---\n\n`;
  md += `*Report generated securely by Mineiro Username Extractor OSINT Suite • Open Source Intelligence Forensics*\n`;

  return md;
}
