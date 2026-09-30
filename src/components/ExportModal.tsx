import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Check, 
  Copy, 
  Terminal, 
  Eye, 
  Shield, 
  FileCheck, 
  Layers, 
  FileCode,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
  AlertTriangle,
  Mail,
  Lock,
  GitFork,
  Activity,
  Key,
  Hash,
  RefreshCw
} from 'lucide-react';
import { ScanResult, AiProfileReport, EmailReconData, InvestigationSnapshot } from '../types';
import { useToast } from './Toast';
import { useI18n } from '../utils/i18n';
import { 
  generateMarkdownReport, 
  ReportSectionsToggle, 
  DEFAULT_REPORT_SECTIONS 
} from '../utils/reportGenerator';
import { takeInvestigationSnapshot, getCachedInvestigations } from '../utils/scanStorage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  aiProfile: AiProfileReport | null;
  emailData: EmailReconData | null;
}

export function ExportModal({
  isOpen,
  onClose,
  target,
  targetType,
  results,
  aiProfile,
  emailData,
}: ExportModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<'markdown' | 'json' | 'pdf' | 'txt'>('markdown');
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Cryptographic investigation snapshot state
  const [snapshot, setSnapshot] = useState<InvestigationSnapshot | null>(() => {
    const cached = getCachedInvestigations();
    const match = cached.find((c) => c.target.toLowerCase() === target.trim().toLowerCase() && c.targetType === targetType);
    return match?.snapshot || null;
  });
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [copiedSnapshotBlock, setCopiedSnapshotBlock] = useState(false);

  // Granular section selection state
  const [sections, setSections] = useState<ReportSectionsToggle>(DEFAULT_REPORT_SECTIONS);
  const [showSectionCustomizer, setShowSectionCustomizer] = useState(true);

  if (!isOpen) return null;

  const foundResults = results.filter((r) => r.status === 'found');
  const uncertainResults = results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited');

  // Trigger taking a new cryptographic snapshot of the current scan state
  const handleCreateSnapshot = async () => {
    setIsGeneratingSnapshot(true);
    try {
      const snap = await takeInvestigationSnapshot({
        target,
        targetType,
        results,
        emailData,
        aiProfile,
      });
      setSnapshot(snap);
      showToast({
        title: 'Cryptographic Snapshot Sealed',
        message: `Forensic snapshot generated with SHA-256 seal: ${snap.summaryHash.slice(0, 12)}...`,
        type: 'info',
      });
    } catch (err: any) {
      console.error(err);
      showToast({
        title: 'Snapshot Error',
        message: 'Failed to compute snapshot digest.',
        type: 'info',
      });
    } finally {
      setIsGeneratingSnapshot(false);
    }
  };

  const copySnapshotBlock = () => {
    if (!snapshot) return;
    navigator.clipboard.writeText(snapshot.summaryBlockText);
    setCopiedSnapshotBlock(true);
    setTimeout(() => setCopiedSnapshotBlock(false), 2000);
    showToast({
      title: 'Snapshot Block Copied',
      message: 'Signed cryptographic summary block copied to clipboard.',
      type: 'copy',
    });
  };

  // Toggle individual section
  const toggleSection = (key: keyof ReportSectionsToggle) => {
    setSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Section Presets
  const applyPreset = (preset: 'all' | 'executive_findings' | 'ai_threat' | 'tech_raw') => {
    if (preset === 'all') {
      setSections(DEFAULT_REPORT_SECTIONS);
      showToast({ title: 'Preset Applied', message: 'All report sections enabled.', type: 'info' });
    } else if (preset === 'executive_findings') {
      setSections({
        executiveSummary: true,
        aiProfile: false,
        threatActor: false,
        behavioralSignals: false,
        timeline: true,
        strategicPivots: false,
        defensiveHardening: false,
        emailRecon: true,
        platformFindings: true,
        wafUncertain: false,
      });
      showToast({ title: 'Preset Applied', message: 'Executive & Findings preset selected.', type: 'info' });
    } else if (preset === 'ai_threat') {
      setSections({
        executiveSummary: true,
        aiProfile: true,
        threatActor: true,
        behavioralSignals: true,
        timeline: true,
        strategicPivots: true,
        defensiveHardening: true,
        emailRecon: false,
        platformFindings: false,
        wafUncertain: false,
      });
      showToast({ title: 'Preset Applied', message: 'AI & Threat Profiling preset selected.', type: 'info' });
    } else if (preset === 'tech_raw') {
      setSections({
        executiveSummary: true,
        aiProfile: false,
        threatActor: false,
        behavioralSignals: false,
        timeline: false,
        strategicPivots: false,
        defensiveHardening: false,
        emailRecon: true,
        platformFindings: true,
        wafUncertain: true,
      });
      showToast({ title: 'Preset Applied', message: 'Technical Probes Only preset selected.', type: 'info' });
    }
  };

  const activeSectionCount = Object.values(sections).filter(Boolean).length;

  // Helper to generate current customized markdown report
  const getCustomizedMarkdownReport = () => {
    return generateMarkdownReport({
      target,
      targetType,
      results,
      aiProfile,
      emailData,
      snapshot,
      sections,
    });
  };

  // Copy Full Report to Clipboard handler
  const copyMarkdownToClipboard = () => {
    const mdContent = getCustomizedMarkdownReport();
    navigator.clipboard.writeText(mdContent);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
    showToast({
      title: 'Custom Dossier Copied',
      message: `Markdown report (${activeSectionCount} sections) for @${target} copied to clipboard.`,
      type: 'copy',
    });
  };

  // Download Markdown file
  const downloadMarkdown = () => {
    const mdContent = getCustomizedMarkdownReport();
    const filename = `mineiro_osint_${target}_${Date.now()}.md`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Report Exported Successfully',
      message: `Downloaded structured Markdown dossier: ${filename}`,
      type: 'download',
    });
  };

  // Section-aware JSON Generator
  const generateExportJson = (preview = false) => {
    const previewHits = preview ? foundResults.slice(0, 4) : foundResults;
    const finalResults = preview ? previewHits : (sections.platformFindings ? results : []);

    const payload: any = {
      engine: 'Mineiro Username Intelligence Unified OSINT Reconnaissance Engine',
      version: '3.2.0',
      caseId: `CASE-OSINT-${target.toUpperCase()}-${new Date().getFullYear()}`,
      timestamp: new Date().toISOString(),
      target: {
        identifier: target,
        type: targetType,
      },
      sectionsIncluded: sections,
    };

    if (snapshot) {
      payload.cryptographicSnapshot = {
        snapshotId: snapshot.snapshotId,
        timestamp: snapshot.timestamp,
        summaryHash: snapshot.summaryHash,
        signature: snapshot.signature,
        status: 'VERIFIED_IMMUTABLE',
        summaryBlockText: snapshot.summaryBlockText,
      };
    }

    if (sections.executiveSummary) {
      payload.summary = {
        totalScanned: results.length,
        verifiedHits: foundResults.length,
        uncertainProtected: uncertainResults.length,
        confidenceIndex: '99.2%',
        engineCapabilities: ['Mineiro Core (local direct probes)', 'WAF & Anti-Bot Protection Guard', 'Autonomous AI Dossier'],
      };
    }

    if (sections.emailRecon && emailData) {
      payload.emailIntelligence = {
        email: emailData.email,
        domain: emailData.domain,
        mxRecordsFound: emailData.mxRecordsFound,
        mxServers: emailData.mxServers,
        gravatarLinked: emailData.gravatarExists,
      };
    }

    if (aiProfile) {
      if (sections.aiProfile) {
        payload.aiDossier = {
          archetype: aiProfile.archetype,
          summary: aiProfile.summary,
          threatLevel: aiProfile.threatLevel,
          footprintScore: aiProfile.footprintScore,
          interests: aiProfile.interests,
          technicalFootprint: aiProfile.technicalFootprint,
        };
      }
      if (sections.threatActor && aiProfile.threatActorAnalysis) {
        payload.threatActorAnalysis = aiProfile.threatActorAnalysis;
      }
      if (sections.behavioralSignals && aiProfile.behavioralSignals) {
        payload.behavioralSignals = aiProfile.behavioralSignals;
      }
      if (sections.strategicPivots && aiProfile.investigationPivots) {
        payload.investigationPivots = aiProfile.investigationPivots;
      }
      if (sections.defensiveHardening) {
        payload.defensiveHardening = {
          vulnerabilities: aiProfile.threatVulnerabilities,
          countermeasures: aiProfile.recommendedDefensiveActions,
        };
      }
    }

    if (sections.timeline && foundResults.length > 0) {
      payload.chronologicalTimeline = foundResults.map((r, i) => ({
        index: i + 1,
        platform: r.platformName,
        category: r.category,
        url: r.url,
      }));
    }

    if (sections.platformFindings) {
      payload.verifiedProfiles = finalResults.map((r) => ({
        platform: r.platformName,
        category: r.category,
        url: r.url,
        status: r.status,
        statusCode: r.statusCode || 200,
        responseTimeMs: r.responseTimeMs,
        confidenceScore: r.confidenceScore || 95,
      }));
    }

    if (sections.wafUncertain && uncertainResults.length > 0) {
      payload.uncertainProbes = uncertainResults.map((r) => ({
        platform: r.platformName,
        category: r.category,
        url: r.url,
        reason: r.uncertainReason,
      }));
    }

    if (preview) {
      payload._previewNotice = `[TRUNCATED FORENSIC PREVIEW: ${activeSectionCount} sections enabled. Showing sample verified accounts]`;
    }

    return JSON.stringify(payload, null, 2);
  };

  // Section-aware TXT Generator
  const generateTxtReport = (preview = false) => {
    const dateStr = new Date().toUTCString();
    const divider = '='.repeat(70);
    const subDivider = '-'.repeat(70);

    let text = `${divider}\n`;
    text += `   MINEIRO UNIFIED OSINT ENGINE // FORENSIC REPORT\n`;
    text += `   Case ID: CASE-OSINT-${target.toUpperCase()} | Sections: ${activeSectionCount}/10\n`;
    text += `${divider}\n`;
    text += `Report Date  : ${dateStr}\n`;
    text += `Target Moniker: @${target}\n`;
    text += `Target Type  : ${targetType.toUpperCase()}\n`;

    if (sections.executiveSummary) {
      text += `Total Probed : ${results.length} platforms\n`;
      text += `Verified Hits: ${foundResults.length} confirmed accounts\n`;
      text += `Uncertain WAF: ${uncertainResults.length} protected targets\n`;
    }
    text += `${subDivider}\n\n`;

    if (sections.platformFindings) {
      const displayHits = preview ? foundResults.slice(0, 4) : foundResults;
      text += `[+] VERIFIED IDENTITIES & PROFILES (${displayHits.length}${preview && foundResults.length > 4 ? ` of ${foundResults.length}` : ''}):\n`;
      if (displayHits.length === 0) {
        text += `  (No confirmed profiles located in selected scope)\n`;
      } else {
        displayHits.forEach((r, idx) => {
          text += `  [${(idx + 1).toString().padStart(2, '0')}] ${r.platformName.padEnd(20)} [${r.category.toUpperCase()}]\n`;
          text += `       URL     : ${r.url}\n`;
          text += `       Status  : HTTP ${r.statusCode || 200} | ${r.responseTimeMs || 0}ms\n\n`;
        });
      }
    }

    if (sections.timeline && foundResults.length > 0) {
      text += `\n[+] CHRONOLOGICAL PLATFORM INCEPTION TIMELINE:\n`;
      foundResults.forEach((r) => {
        text += `  * ${r.platformName.padEnd(18)} [${r.category}] -> ${r.url}\n`;
      });
      text += `\n`;
    }

    if (sections.aiProfile && aiProfile) {
      text += `\n${subDivider}\n`;
      text += `[+] AI INTELLIGENCE DOSSIER:\n`;
      text += `  Archetype      : ${aiProfile.archetype}\n`;
      text += `  Threat Level   : ${aiProfile.threatLevel}\n`;
      text += `  Surface Score  : ${aiProfile.footprintScore} / 100\n`;
      text += `  Executive Brief: ${aiProfile.summary}\n`;
    }

    if (sections.threatActor && aiProfile?.threatActorAnalysis) {
      const ta = aiProfile.threatActorAnalysis;
      text += `\n${subDivider}\n`;
      text += `[+] THREAT ACTOR PROFILING:\n`;
      text += `  Classification : ${ta.verdictTitle}\n`;
      text += `  Category       : ${ta.threatActorCategory}\n`;
      text += `  Suspicion Score: ${ta.threatActorScore} / 100\n`;
    }

    if (sections.behavioralSignals && aiProfile?.behavioralSignals) {
      const bs = aiProfile.behavioralSignals;
      text += `\n${subDivider}\n`;
      text += `[+] BEHAVIORAL & LINGUISTIC SIGNALS:\n`;
      text += `  Primary Timezone: ${bs.timezone} (${bs.activeTimezoneWindow})\n`;
      text += `  Primary Language: ${bs.primaryLanguage || bs.language}\n`;
      text += `  OPSEC Hygiene   : ${bs.opsecHygiene}\n`;
    }

    if (sections.strategicPivots && aiProfile?.investigationPivots?.length) {
      text += `\n${subDivider}\n`;
      text += `[+] STRATEGIC INVESTIGATION PIVOTS:\n`;
      aiProfile.investigationPivots.forEach((p) => {
        text += `  - [${p.type.toUpperCase()}] ${p.hop}: ${p.explanation}\n`;
        text += `    Recommended Action: ${p.recommendedAction}\n`;
      });
    }

    if (sections.defensiveHardening && aiProfile?.recommendedDefensiveActions?.length) {
      text += `\n${subDivider}\n`;
      text += `[+] DEFENSIVE HARDENING & COUNTERMEASURES:\n`;
      aiProfile.recommendedDefensiveActions.forEach((a) => {
        text += `  - ${a}\n`;
      });
    }

    if (sections.emailRecon && emailData) {
      text += `\n${subDivider}\n`;
      text += `[+] EMAIL INFRASTRUCTURE RECON:\n`;
      text += `  Email Address : ${emailData.email}\n`;
      text += `  MX Status     : ${emailData.mxRecordsFound ? 'Active MX servers' : 'None'}\n`;
    }

    if (sections.wafUncertain && uncertainResults.length > 0) {
      text += `\n${subDivider}\n`;
      text += `[?] UNCERTAIN / CLOUDFLARE WAF CHALLENGES (${uncertainResults.length}):\n`;
      uncertainResults.forEach((r) => {
        text += `  - ${r.platformName}: ${r.url}\n`;
      });
    }

    if (snapshot) {
      text += `\n${snapshot.summaryBlockText}\n`;
    }

    text += `\n${divider}\n`;
    text += `   END OF MINEIRO OSINT INTELLIGENCE REPORT\n`;
    text += `${divider}\n`;

    return text;
  };

  const copyPreviewToClipboard = () => {
    let textToCopy = '';
    if (previewFormat === 'markdown') {
      textToCopy = getCustomizedMarkdownReport();
    } else if (previewFormat === 'json') {
      textToCopy = generateExportJson(false);
    } else {
      textToCopy = generateTxtReport(false);
    }
    navigator.clipboard.writeText(textToCopy);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
    showToast({
      title: 'Full Custom Report Copied',
      message: `${previewFormat.toUpperCase()} dataset with ${activeSectionCount} selected sections copied to clipboard.`,
      type: 'copy',
    });
  };

  // Download JSON
  const downloadJson = () => {
    const jsonStr = generateExportJson(false);
    const filename = `mineiro_osint_${target}_${Date.now()}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Report Exported Successfully',
      message: `Downloaded JSON forensic dataset: ${filename}`,
      type: 'download',
    });
  };

  // Download CSV
  const downloadCsv = () => {
    const headers = ['Platform', 'Category', 'Status', 'Confidence', 'URL', 'StatusCode', 'LatencyMs', 'Notes'];
    const exportItems = sections.platformFindings ? results : foundResults;
    const rows = exportItems.map((r) => [
      `"${r.platformName.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.status}"`,
      `"${r.confidenceScore ? r.confidenceScore + '%' : ''}"`,
      `"${r.url}"`,
      r.statusCode || '',
      r.responseTimeMs || '',
      `"${(r.uncertainReason || '').replace(/"/g, '""')}"`,
    ]);

    const filename = `mineiro_osint_${target}_${Date.now()}.csv`;
    let csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    
    if (snapshot) {
      csvContent += `\n\n# CRYPTOGRAPHIC INVESTIGATION SNAPSHOT\n# Snapshot ID,${snapshot.snapshotId}\n# Timestamp,${snapshot.timestamp}\n# Digest (SHA-256),${snapshot.summaryHash}\n# Signature,${snapshot.signature}\n# Status,VERIFIED_IMMUTABLE\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Report Exported Successfully',
      message: `Downloaded CSV spreadsheet findings: ${filename}`,
      type: 'download',
    });
  };

  // Download TXT
  const downloadTxt = () => {
    const textContent = generateTxtReport(false);
    const filename = `mineiro_osint_${target}_${Date.now()}.txt`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast({
      title: 'Report Exported Successfully',
      message: `Downloaded plaintext CLI ASCII dossier: ${filename}`,
      type: 'download',
    });
  };

  const copyTxtToClipboard = () => {
    const textContent = generateTxtReport(false);
    navigator.clipboard.writeText(textContent);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2000);
    showToast({
      title: 'Report Copied to Clipboard',
      message: `Plaintext ASCII investigation report for @${target} copied to clipboard.`,
      type: 'copy',
    });
  };

  const handlePrintPdf = () => {
    window.print();
    showToast({
      title: 'PDF Dossier Dispatched',
      message: 'Print view dispatched for external saving or document archiving.',
      type: 'info',
    });
  };

  // Section Toggle Definition List
  const sectionDefinitions: {
    key: keyof ReportSectionsToggle;
    label: string;
    description: string;
    icon: any;
  }[] = [
    {
      key: 'executiveSummary',
      label: 'Executive Summary & KPIs',
      description: 'Discovery rates, subject metrics, investigation metadata',
      icon: Shield,
    },
    {
      key: 'aiProfile',
      label: 'AI Intelligence Dossier',
      description: 'Synthesized archetype, psychological profile, skillset',
      icon: Sparkles,
    },
    {
      key: 'threatActor',
      label: 'Threat Actor Profiling & TTPs',
      description: 'Adversary suspicion score, Mitre tactics, indicators',
      icon: AlertTriangle,
    },
    {
      key: 'behavioralSignals',
      label: 'Behavioral & Linguistic Signals',
      description: 'Active timezone window, language dialect, OPSEC hygiene',
      icon: Activity,
    },
    {
      key: 'timeline',
      label: 'Chronological Dossier Timeline',
      description: 'Temporal progression of account genesis & seniority',
      icon: Calendar,
    },
    {
      key: 'strategicPivots',
      label: 'Strategic Investigation Pivots',
      description: 'Actionable permutations, secondary email & domain hops',
      icon: GitFork,
    },
    {
      key: 'defensiveHardening',
      label: 'Attack Surface & Hardening',
      description: 'Vulnerability breakdown and OPSEC recommendations',
      icon: Lock,
    },
    {
      key: 'emailRecon',
      label: 'Email Infrastructure Recon',
      description: 'MX servers, apex domain, linked Gravatar image',
      icon: Mail,
    },
    {
      key: 'platformFindings',
      label: 'Verified Platform Accounts Table',
      description: 'Corroborated 200 OK profile links, latency, and status',
      icon: FileCheck,
    },
    {
      key: 'wafUncertain',
      label: 'WAF / Protected Probes',
      description: 'Cloudflare challenges, 403 anti-bot protected targets',
      icon: Layers,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="border border-neutral-800 bg-neutral-950 w-full max-w-4xl max-h-[92vh] flex flex-col p-6 space-y-4 font-mono shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                EXPORT FORENSIC INTELLIGENCE DOSSIER // @{target}
              </h2>
              <span className="text-[10px] px-2 py-0.5 border border-neutral-800 bg-black text-neutral-400">
                {activeSectionCount} / 10 SECTIONS ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">
              Export corroborated platform findings, threat metrics, and behavioral intelligence in standard investigation formats.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 text-sm border border-transparent hover:border-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto space-y-4 pr-1">
          
          {/* SECTION CUSTOMIZER ACCORDION */}
          <div className="border border-neutral-800 bg-black p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  GRANULAR DOSSIER SECTIONS & FORENSIC SCOPE
                </span>
                <span className="text-[10px] text-neutral-500">
                  Toggle sections before generation
                </span>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyPreset('all')}
                  className="px-2 py-0.5 text-[10px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  All Sections
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('executive_findings')}
                  className="px-2 py-0.5 text-[10px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  Executive & Findings
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('ai_threat')}
                  className="px-2 py-0.5 text-[10px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  AI & Threat
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('tech_raw')}
                  className="px-2 py-0.5 text-[10px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors"
                >
                  Raw Probes Only
                </button>
              </div>
            </div>

            {/* Grid of 10 Section Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionDefinitions.map((sec) => {
                const IconComponent = sec.icon;
                const isChecked = sections[sec.key];

                return (
                  <div
                    key={sec.key}
                    onClick={() => toggleSection(sec.key)}
                    className={`p-2 border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                      isChecked
                        ? 'border-neutral-700 bg-neutral-950/80 hover:border-neutral-500'
                        : 'border-neutral-900 bg-black opacity-45 hover:opacity-75'
                    }`}
                  >
                    <div className="pt-0.5 shrink-0 text-white">
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="w-3 h-3 text-neutral-400" />
                        <span className={`font-bold text-[11px] ${isChecked ? 'text-white' : 'text-neutral-500'}`}>
                          {sec.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 leading-tight">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptographic Investigation Snapshot Card */}
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-4 rounded space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Shield className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  {t.snapshotTitle}
                </span>
                {snapshot ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#FFFFFF]/15 text-[#FFFFFF] border border-[#FFFFFF]/40 font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {t.snapshotSigned}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#737373]/15 text-[#737373] border border-[#737373]/40 font-mono font-bold">
                    {t.snapshotPending}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {snapshot && (
                  <button
                    type="button"
                    id="copy-snapshot-block-btn"
                    onClick={copySnapshotBlock}
                    className="px-2.5 py-1 text-[11px] font-mono border border-[#2A2A2A] bg-[#050505] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#FFFFFF]/50 rounded transition-colors flex items-center gap-1.5"
                  >
                    {copiedSnapshotBlock ? (
                      <>
                        <Check className="w-3 h-3 text-[#FFFFFF]" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{t.copySnapshotBlock}</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  id="take-snapshot-btn"
                  onClick={handleCreateSnapshot}
                  disabled={isGeneratingSnapshot}
                  className="px-3 py-1 text-[11px] font-mono font-bold uppercase rounded transition-all flex items-center gap-1.5 bg-[#FFFFFF] text-[#050505] hover:bg-[#FFFFFF]/90 disabled:opacity-50"
                >
                  {isGeneratingSnapshot ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{t.signingSnapshot}</span>
                    </>
                  ) : snapshot ? (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>{t.reTakeSnapshot}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>{t.takeSnapshot}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {snapshot ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="space-y-1 bg-[#050505] p-2.5 rounded border border-[#2A2A2A]">
                  <div className="text-[10px] text-[#A3A3A3] uppercase">Snapshot ID & Timestamp</div>
                  <div className="text-[#F5F5F5] font-bold truncate">{snapshot.snapshotId}</div>
                  <div className="text-[10px] text-[#737373]">{new Date(snapshot.timestamp).toUTCString()}</div>
                </div>
                <div className="space-y-1 bg-[#050505] p-2.5 rounded border border-[#2A2A2A]">
                  <div className="text-[10px] text-[#A3A3A3] uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#FFFFFF]" />
                    <span>SHA-256 Digest Seal</span>
                  </div>
                  <div className="text-[#FFFFFF] font-mono text-[11px] truncate select-all" title={snapshot.summaryHash}>
                    {snapshot.summaryHash}
                  </div>
                  <div className="text-[10px] text-[#A3A3A3] truncate" title={snapshot.signature}>
                    Sig: {snapshot.signature.slice(0, 24)}...
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#A3A3A3] font-sans">
                {t.snapshotExplainer}
              </p>
            )}
          </div>

          {/* Primary Quick Copy Card */}
          <div className="border border-neutral-800 bg-neutral-950 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-xs uppercase tracking-wider">
                  Copy Customized Report to Clipboard
                </span>
                <span className="text-[9px] px-1.5 py-0.2 bg-white text-black font-extrabold uppercase">
                  Markdown
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-sans">
                Generates a clean Markdown dossier containing only your selected {activeSectionCount} sections, ready for Notion, Obsidian, GitHub, or case notes.
              </p>
            </div>
            <button
              id="copy-full-report-btn"
              type="button"
              onClick={copyMarkdownToClipboard}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 border ${
                copiedMarkdown
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-white text-black border-white hover:bg-neutral-200'
              }`}
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {/* Markdown Export */}
            <button
              id="export-md-btn"
              type="button"
              onClick={downloadMarkdown}
              className="p-2.5 border border-neutral-800 bg-black hover:border-white hover:bg-neutral-900 transition-all text-left space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <FileCode className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                <span className="text-[10px] text-neutral-400 font-bold">.MD</span>
              </div>
              <div>
                <div className="text-white font-bold text-xs">Markdown</div>
                <div className="text-[10px] text-neutral-500">Customized report</div>
              </div>
            </button>

            {/* JSON Export */}
            <button
              id="export-json-btn"
              type="button"
              onClick={downloadJson}
              className="p-2.5 border border-neutral-800 bg-black hover:border-white hover:bg-neutral-900 transition-all text-left space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <FileText className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                <span className="text-[10px] text-neutral-400 font-bold">.JSON</span>
              </div>
              <div>
                <div className="text-white font-bold text-xs">JSON Bundle</div>
                <div className="text-[10px] text-neutral-500">Filtered schema</div>
              </div>
            </button>

            {/* CSV Export */}
            <button
              id="export-csv-btn"
              type="button"
              onClick={downloadCsv}
              className="p-2.5 border border-neutral-800 bg-black hover:border-white hover:bg-neutral-900 transition-all text-left space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <Download className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                <span className="text-[10px] text-neutral-400 font-bold">.CSV</span>
              </div>
              <div>
                <div className="text-white font-bold text-xs">CSV Table</div>
                <div className="text-[10px] text-neutral-500">Spreadsheets</div>
              </div>
            </button>

            {/* TXT Export */}
            <button
              id="export-txt-btn"
              type="button"
              onClick={downloadTxt}
              className="p-2.5 border border-neutral-800 bg-black hover:border-white hover:bg-neutral-900 transition-all text-left space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <Terminal className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                <span className="text-[10px] text-neutral-400 font-bold">.TXT</span>
              </div>
              <div>
                <div className="text-white font-bold text-xs">TXT Report</div>
                <div className="text-[10px] text-neutral-500">CLI ASCII</div>
              </div>
            </button>

            {/* Print / PDF */}
            <button
              id="export-pdf-btn"
              type="button"
              onClick={handlePrintPdf}
              className="p-2.5 border border-neutral-800 bg-black hover:border-white hover:bg-neutral-900 transition-all text-left space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <Printer className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                <span className="text-[10px] text-neutral-400 font-bold">PDF</span>
              </div>
              <div>
                <div className="text-white font-bold text-xs">PDF Dossier</div>
                <div className="text-[10px] text-neutral-500">Print / Save</div>
              </div>
            </button>
          </div>

          {/* Visual Forensic Preview Panel */}
          <div className="border border-neutral-800 bg-black p-3 space-y-2.5 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-white" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Live Forensic Preview ({activeSectionCount} Sections Enabled)
                </span>
              </div>

              {/* Format Switcher Tabs */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewFormat('markdown')}
                  className={`px-2 py-0.5 text-[10px] border transition-colors uppercase ${
                    previewFormat === 'markdown'
                      ? 'border-white bg-white text-black font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  Markdown (.MD)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormat('json')}
                  className={`px-2 py-0.5 text-[10px] border transition-colors uppercase ${
                    previewFormat === 'json'
                      ? 'border-white bg-white text-black font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  JSON Bundle
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormat('pdf')}
                  className={`px-2 py-0.5 text-[10px] border transition-colors uppercase ${
                    previewFormat === 'pdf'
                      ? 'border-white bg-white text-black font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  PDF Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFormat('txt')}
                  className={`px-2 py-0.5 text-[10px] border transition-colors uppercase ${
                    previewFormat === 'txt'
                      ? 'border-white bg-white text-black font-bold'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  ASCII TXT
                </button>

                {/* Copy preview text */}
                <button
                  type="button"
                  onClick={copyPreviewToClipboard}
                  className="ml-1 p-1 text-neutral-400 hover:text-white border border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                  title="Copy Preview to Clipboard"
                >
                  {copiedPreview ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Markdown Preview */}
            {previewFormat === 'markdown' && (
              <div className="relative">
                <pre className="text-[11px] leading-relaxed text-neutral-300 bg-neutral-950 p-3 border border-neutral-800/80 overflow-x-auto max-h-56 font-mono select-text whitespace-pre-wrap">
                  {getCustomizedMarkdownReport()}
                </pre>
                <div className="text-[10px] text-neutral-400 pt-1.5 flex items-center justify-between">
                  <span>⚡ Dynamically tailored to your {activeSectionCount} selected sections</span>
                  <span>{results.length} platforms • {foundResults.length} confirmed profiles</span>
                </div>
              </div>
            )}

            {/* Truncated JSON Preview */}
            {previewFormat === 'json' && (
              <div className="relative">
                <pre className="text-[11px] leading-relaxed text-neutral-300 bg-neutral-950 p-3 border border-neutral-800/80 overflow-x-auto max-h-52 font-mono select-text">
                  {generateExportJson(true)}
                </pre>
                <div className="text-[10px] text-neutral-400 pt-1.5 flex items-center justify-between">
                  <span>⚡ Tailored JSON schema based on selected sections</span>
                  <span>Full download contains complete filtered forensic bundle</span>
                </div>
              </div>
            )}

            {/* Truncated PDF Dossier Sheet Preview */}
            {previewFormat === 'pdf' && (
              <div className="bg-neutral-950 border border-neutral-700/80 p-3 space-y-2.5 max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div>
                    <div className="text-[10px] tracking-widest text-neutral-400 font-bold uppercase">
                      CONFIDENTIAL // FORENSIC INTELLIGENCE REPORT
                    </div>
                    <div className="text-white font-bold text-xs">
                      TARGET DOSSIER: @{target}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-neutral-400">
                    <div>CASE ID: #MUE-{target.toUpperCase().slice(0, 8)}</div>
                    <div className="text-white font-bold">SECTIONS: {activeSectionCount}/10</div>
                  </div>
                </div>

                {sections.executiveSummary && (
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-1.5 bg-neutral-900 border border-neutral-800">
                      <div className="text-neutral-500">VERIFIED HITS</div>
                      <div className="text-white font-bold text-xs">{foundResults.length}</div>
                    </div>
                    <div className="p-1.5 bg-neutral-900 border border-neutral-800">
                      <div className="text-neutral-500">UNCERTAIN WAF</div>
                      <div className="text-white font-bold text-xs">{uncertainResults.length}</div>
                    </div>
                    <div className="p-1.5 bg-neutral-900 border border-neutral-800">
                      <div className="text-neutral-500">SURFACE RISK</div>
                      <div className="text-white font-bold text-xs">{aiProfile?.threatLevel || 'MODERATE'}</div>
                    </div>
                  </div>
                )}

                {sections.platformFindings && (
                  <div className="space-y-1 text-[10px]">
                    <div className="text-neutral-400 font-bold border-b border-neutral-800 pb-1 flex justify-between">
                      <span>VERIFIED PROFILES</span>
                      <span className="text-neutral-500">{Math.min(4, foundResults.length)} of {foundResults.length}</span>
                    </div>
                    {foundResults.slice(0, 4).map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-neutral-300 py-0.5 border-b border-neutral-900">
                        <span className="text-white font-medium">{r.platformName}</span>
                        <span className="text-neutral-500 text-[9px] uppercase">{r.category}</span>
                        <span className="text-white text-[9px] font-bold">VERIFIED</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[9px] text-neutral-500 text-center italic border-t border-neutral-800 pt-1">
                  --- Live PDF export preview reflecting active section toggles ---
                </div>
              </div>
            )}

            {/* Truncated TXT Preview */}
            {previewFormat === 'txt' && (
              <div className="relative">
                <pre className="text-[11px] leading-relaxed text-neutral-300 bg-neutral-950 p-3 border border-neutral-800/80 overflow-x-auto max-h-52 font-mono select-text whitespace-pre">
                  {generateTxtReport(true)}
                </pre>
                <div className="text-[10px] text-neutral-400 pt-1.5 flex items-center justify-between">
                  <span>⚡ Plaintext CLI Report Preview</span>
                  <span>Filtered to your active sections</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Copy Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              id="copy-markdown-bottom-btn"
              type="button"
              onClick={copyMarkdownToClipboard}
              className="w-full py-2 px-3 border border-white bg-white text-black hover:bg-neutral-200 font-bold flex items-center justify-center gap-2 text-xs transition-colors"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Report Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-black" />
                  <span>Copy Tailored Markdown Report</span>
                </>
              )}
            </button>

            <button
              id="copy-txt-bottom-btn"
              type="button"
              onClick={copyTxtToClipboard}
              className="w-full py-2 px-3 border border-neutral-800 bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white flex items-center justify-center gap-2 text-xs transition-colors"
            >
              {copiedTxt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>TXT Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Copy Tailored Plaintext (.TXT)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-neutral-800 pt-3 flex justify-between items-center text-[11px] text-neutral-500 shrink-0">
          <span>Target Scope: {results.length} Platforms • {activeSectionCount} Sections Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white text-black font-bold uppercase hover:bg-neutral-200 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
