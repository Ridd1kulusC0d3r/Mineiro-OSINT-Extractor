import React, { useState } from 'react';
import {
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  Compass,
  Terminal,
  RefreshCw,
  Cpu,
  Fingerprint,
  AlertTriangle,
  Key,
  Activity,
  CheckCircle2,
  Clock,
  Globe,
  Languages,
  Crosshair,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Radio,
  FileWarning,
  Layers,
  Tag,
  Wrench,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { AiProfileReport, ScanResult, EmailReconData } from '../types';
import { DossierTimeline } from './DossierTimeline';
import { useToast } from './Toast';
import { generateMarkdownReport } from '../utils/reportGenerator';

interface AiProfileCardProps {
  report: AiProfileReport | null;
  target: string;
  foundResults: ScanResult[];
  isLoading: boolean;
  onRequestProfile: () => void;
  onOpenGeminiConfig?: () => void;
  hasPersonalKey?: boolean;
  emailData?: EmailReconData | null;
  onOpenExport?: () => void;
}

export function AiProfileCard({
  report,
  target,
  foundResults,
  isLoading,
  onRequestProfile,
  onOpenGeminiConfig,
  hasPersonalKey,
  emailData,
  onOpenExport,
}: AiProfileCardProps) {
  const { showToast } = useToast();
  const [copiedDossier, setCopiedDossier] = useState(false);

  const handleCopyDossier = () => {
    if (!report) return;
    const md = generateMarkdownReport({
      target,
      targetType: 'username',
      results: foundResults,
      aiProfile: report,
      emailData,
    });
    navigator.clipboard.writeText(md);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
    showToast({
      title: 'Dossier Copied to Clipboard',
      message: `Full AI intelligence dossier and temporal timeline for @${target} copied to clipboard.`,
      type: 'copy',
    });
  };
  if (isLoading) {
    return (
      <div className="border border-neutral-800 bg-neutral-950 p-8 text-center space-y-4 font-mono">
        <div className="w-12 h-12 border-2 border-white border-t-transparent animate-spin mx-auto" />
        <div className="space-y-1">
          <p className="text-white font-bold text-sm tracking-wider">
            SYNTHESIZING DIGITAL ATTACK SURFACE & AI PROFILE...
          </p>
          <p className="text-xs text-neutral-500">
            Analyzing {foundResults.length} discovered platform indicators with Gemini AI...
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="border border-neutral-800 bg-neutral-950 p-8 text-center space-y-4 font-mono">
        <div className="w-14 h-14 mx-auto border border-neutral-700 bg-black flex items-center justify-center text-white">
          <BrainCircuit className="w-7 h-7 text-white" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-bold text-white tracking-wider uppercase">
            AI Profiling Engine Idle
          </h3>
          <p className="text-xs text-neutral-400">
            {foundResults.length > 0
              ? `${foundResults.length} accounts found. Generate an automated behavioral, technical, and threat surface analysis.`
              : 'Execute a scan above to discover online presence and construct an intelligence profile.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            id="generate-ai-profile-btn"
            type="button"
            onClick={onRequestProfile}
            disabled={!target}
            className="px-5 py-2.5 bg-white text-black font-mono font-bold text-xs uppercase hover:bg-neutral-200 border border-white tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            Generate Intelligence Dossier
          </button>
          {onOpenGeminiConfig && (
            <button
              type="button"
              onClick={onOpenGeminiConfig}
              className={`px-4 py-2.5 font-mono text-xs uppercase border transition-all inline-flex items-center gap-2 ${
                hasPersonalKey
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-neutral-700 bg-black text-neutral-300 hover:text-white hover:border-neutral-500'
              }`}
            >
              <Key className="w-4 h-4" />
              {hasPersonalKey ? 'Personal Key Active' : 'Configure Personal Gemini'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const threatColor =
    report.threatLevel === 'Critical'
      ? 'border-white bg-white text-black font-bold'
      : report.threatLevel === 'Elevated'
      ? 'border-neutral-400 text-white bg-neutral-900 font-bold'
      : 'border-neutral-700 text-neutral-300';

  return (
    <div className="border border-neutral-700 bg-neutral-950 p-6 space-y-6 font-mono">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 uppercase">TARGET PROFILE:</span>
            <span className="text-base font-bold text-white tracking-wider">@{report.target}</span>
            <span className="text-[10px] px-2 py-0.5 border border-neutral-800 bg-black text-neutral-400">
              {report.modelUsed || 'Gemini 3.8 Flash'}
            </span>
          </div>
          <div className="text-xs text-neutral-400 mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[11px] text-neutral-500 uppercase">Archetype:</span>
              <strong className="text-white bg-black border border-neutral-800 px-2 py-0.5 text-xs">
                {report.archetype}
              </strong>
            </div>
            {report.technicalFootprint && (
              <span
                className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-mono ${
                  report.technicalFootprint.isTechProfessional
                    ? 'border border-white bg-neutral-900 text-white font-bold'
                    : 'border border-neutral-700 bg-neutral-950 text-neutral-400'
                }`}
              >
                {report.technicalFootprint.isTechProfessional ? 'Tech Professional' : 'Verified Non-Tech User'}
              </span>
            )}
            {report.industry && (
              <span className="text-[10px] px-2 py-0.5 border border-neutral-800 bg-black text-neutral-300">
                Industry: {report.industry}
              </span>
            )}
          </div>
          {report.archetypeDescription && (
            <p className="text-[11px] text-neutral-400 font-sans mt-1.5 leading-relaxed pl-5 border-l-2 border-neutral-700">
              {report.archetypeDescription}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Full Dossier to Clipboard */}
          <button
            id="copy-dossier-header-btn"
            type="button"
            onClick={handleCopyDossier}
            className="px-2.5 py-1.5 border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 hover:border-neutral-500 transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold"
            title="Copy Full Intelligence Dossier Markdown to Clipboard"
          >
            {copiedDossier ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-300" />
                <span>COPY DOSSIER</span>
              </>
            )}
          </button>

          {/* Export Full Dossier Modal Trigger */}
          {onOpenExport && (
            <button
              id="export-dossier-header-btn"
              type="button"
              onClick={onOpenExport}
              className="px-2.5 py-1.5 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 hover:border-neutral-500 transition-colors flex items-center gap-1.5 text-xs uppercase tracking-wider"
              title="Open Full OSINT Export Modal"
            >
              <Download className="w-3.5 h-3.5 text-neutral-300" />
              <span>EXPORT</span>
            </button>
          )}

          <div className={`px-3 py-1.5 border text-xs uppercase tracking-wider ${threatColor}`}>
            EXPOSURE: {report.threatLevel}
          </div>
          <button
            id="regenerate-profile-btn"
            onClick={onRequestProfile}
            className="p-2 border border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
            title="Re-run AI Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fallback Notice if Temporary AI Spike Occurred */}
      {report.fallbackNotice && (
        <div className="p-3.5 border border-neutral-800 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-neutral-300">
            <AlertTriangle className="w-4 h-4 text-white shrink-0" />
            <span>{report.fallbackNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenGeminiConfig && !hasPersonalKey && (
              <button
                type="button"
                onClick={onOpenGeminiConfig}
                className="px-3 py-1.5 border border-neutral-700 bg-neutral-900 text-white font-bold uppercase text-[11px] hover:border-white transition-colors tracking-wider inline-flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                Connect Personal Key
              </button>
            )}
            <button
              type="button"
              onClick={onRequestProfile}
              className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[11px] hover:bg-neutral-200 transition-colors tracking-wider inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* Surface Score & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border border-neutral-800 bg-black flex flex-col justify-between">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
            Footprint Score
          </span>
          <div className="my-2">
            <span className="text-3xl font-extrabold text-white">{report.footprintScore}</span>
            <span className="text-xs text-neutral-500"> / 100</span>
          </div>
          <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
            <div
              className="bg-white h-full"
              style={{ width: `${report.footprintScore}%` }}
            />
          </div>
        </div>

        <div className="p-4 border border-neutral-800 bg-black md:col-span-3 space-y-2">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            Executive Intelligence Summary
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            {report.summary}
          </p>
        </div>
      </div>

      {/* Multi-Pass Behavioral Calibration: Industry, Interests, and Technical Footprint */}
      {(report.industry || report.interests?.length || report.technicalFootprint) && (
        <div className="border border-neutral-800 bg-black p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Pass Behavioral Calibration (Weighted Archetype Synthesis)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-500 font-mono uppercase">
                Entities Evaluated Prior to Archetype Mapping
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Industry Entity */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider">
                  <Briefcase className="w-3 h-3 text-neutral-400" />
                  <span>Entity 1: Industry Sector</span>
                </div>
                <div className="text-xs font-bold text-white tracking-wide">
                  {report.industry || 'Domain Specific'}
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 font-sans leading-relaxed pt-2 border-t border-neutral-900">
                Identified through cross-platform activity clustering and domain frequency analysis.
              </div>
            </div>

            {/* 2. Interests Entity */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider">
                <Tag className="w-3 h-3 text-neutral-400" />
                <span>Entity 2: Interests & Affinities</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(report.interests && report.interests.length > 0 ? report.interests : ['General Media', 'Social Discourse']).map((interest, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-300 font-sans"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Technical Footprint Entity */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider">
                    <Wrench className="w-3 h-3 text-neutral-400" />
                    <span>Entity 3: Technical Footprint</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-bold ${
                      report.technicalFootprint?.isTechProfessional
                        ? 'bg-white text-black'
                        : 'border border-neutral-700 text-neutral-400 bg-black'
                    }`}
                  >
                    Level: {report.technicalFootprint?.level || 'None'}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-neutral-200">
                  {report.technicalFootprint?.isTechProfessional ? (
                    <span className="text-white font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white inline" />
                      Corroborated Tech Professional
                    </span>
                  ) : (
                    <span className="text-neutral-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 inline" />
                      Guarded Non-Tech User (Strict Non-Dev)
                    </span>
                  )}
                </div>
              </div>

              {report.technicalFootprint?.evidence && (
                <p className="text-[10px] text-neutral-400 font-sans leading-relaxed pt-1.5 border-t border-neutral-900">
                  {report.technicalFootprint.evidence}
                </p>
              )}

              {report.technicalFootprint?.primaryTools && report.technicalFootprint.primaryTools.length > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1">
                  {report.technicalFootprint.primaryTools.map((tool, idx) => (
                    <span key={idx} className="text-[9px] px-1.5 py-0.5 border border-neutral-800 text-neutral-400">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Threat Actor & Occupation Cross-Referencing Security Heuristics Panel */}
      {report.threatActorAnalysis && (
        <div className="border border-neutral-800 bg-black p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Security-Focused Heuristics & Threat Actor Profiling
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2.5 py-0.5 uppercase tracking-wider font-mono ${
                  report.threatActorAnalysis.isThreatActorSuspect
                    ? 'bg-white text-black font-extrabold'
                    : report.threatActorAnalysis.threatActorCategory.includes('AUTHORIZED')
                    ? 'border border-white bg-neutral-900 text-white font-bold'
                    : 'border border-neutral-700 bg-neutral-950 text-neutral-300'
                }`}
              >
                {report.threatActorAnalysis.threatActorCategory.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Primary Assessment & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Verdict */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                Threat Actor Classification Verdict
              </div>
              <div className="text-xs font-bold text-white uppercase tracking-wide">
                {report.threatActorAnalysis.verdictTitle}
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                {report.threatActorAnalysis.verdictSummary}
              </p>
            </div>

            {/* Threat Actor Score */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
                <span>Threat Actor Suspicion Score</span>
                <span className="text-white font-bold font-mono">
                  {report.threatActorAnalysis.threatActorScore} / 100
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {report.threatActorAnalysis.threatActorScore}%
              </div>
              <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
                <div
                  className="bg-white h-full"
                  style={{ width: `${report.threatActorAnalysis.threatActorScore}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                {report.threatActorAnalysis.threatActorScore >= 60
                  ? 'High probability of illicit underground, offensive weaponization, or credential trade activity.'
                  : report.threatActorAnalysis.threatActorScore >= 25
                  ? 'Moderate indicators; ethical research, dual-purpose tools, or defensive administration.'
                  : 'Minimal to zero offensive or illicit platform footprint detected.'}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider">
                <span>Classification Confidence</span>
                <span className="text-white font-bold font-mono">
                  {report.threatActorAnalysis.confidenceScore} / 100
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {report.threatActorAnalysis.confidenceScore}%
              </div>
              <div className="w-full bg-neutral-900 h-1.5 overflow-hidden">
                <div
                  className="bg-neutral-400 h-full"
                  style={{ width: `${report.threatActorAnalysis.confidenceScore}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-sans">
                Calculated from verified platform corroboration, handle stability, and cross-site signal density.
              </p>
            </div>
          </div>

          {/* Occupation Cross-Referencing Matrix */}
          <div className="p-4 border border-neutral-800 bg-neutral-950 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-900 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Occupation vs. Platform Behavior Cross-Referencing
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-mono ${
                  report.threatActorAnalysis.occupationCrossReference.consistencyVerdict === 'HIGH_RISK_DISCREPANCY'
                    ? 'bg-white text-black font-extrabold'
                    : report.threatActorAnalysis.occupationCrossReference.consistencyVerdict === 'SUSPICIOUS_ANOMALY'
                    ? 'border border-neutral-400 bg-black text-white font-bold'
                    : 'border border-neutral-800 bg-neutral-900 text-neutral-300'
                }`}
              >
                Verdict: {report.threatActorAnalysis.occupationCrossReference.consistencyVerdict.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                  Inferred Real-World Occupation:
                </span>
                <div className="text-white font-bold text-xs bg-black border border-neutral-800 p-2">
                  {report.threatActorAnalysis.occupationCrossReference.inferredOccupation}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase block font-mono">
                  Observed Platform Activity Pattern:
                </span>
                <div className="text-neutral-300 text-xs bg-black border border-neutral-800 p-2">
                  {report.threatActorAnalysis.occupationCrossReference.platformBehaviorPattern}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-neutral-500 uppercase block font-mono mb-1">
                Forensic Cross-Referencing Analysis:
              </span>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed pl-3 border-l-2 border-neutral-700">
                {report.threatActorAnalysis.occupationCrossReference.analysis}
              </p>
            </div>
          </div>

          {/* Observed TTPs & MITRE ATT&CK Mapping */}
          {((report.threatActorAnalysis.observedTTPs && report.threatActorAnalysis.observedTTPs.length > 0) ||
            (report.threatActorAnalysis.mitreTactics && report.threatActorAnalysis.mitreTactics.length > 0)) && (
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-neutral-400" />
                Observed TTPs & Behavioral Indicators
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.threatActorAnalysis.observedTTPs?.map((ttp, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 border border-neutral-800 bg-black text-neutral-200 text-[11px] font-mono"
                  >
                    {ttp}
                  </span>
                ))}
                {report.threatActorAnalysis.mitreTactics?.map((tactic, idx) => (
                  <span
                    key={`mitre-${idx}`}
                    className="px-2 py-0.5 border border-neutral-700 bg-neutral-900 text-white text-[11px] font-mono font-bold"
                  >
                    MITRE: {tactic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Indicator Matches & Forensic Evidence */}
          {report.threatActorAnalysis.indicatorMatches && report.threatActorAnalysis.indicatorMatches.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-neutral-400" />
                Matched Indicators & Threat Surface Discrepancies
              </div>
              <div className="space-y-2">
                {report.threatActorAnalysis.indicatorMatches.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-neutral-800 bg-neutral-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 uppercase font-mono font-bold ${
                            match.severity === 'critical'
                              ? 'bg-white text-black'
                              : match.severity === 'high'
                              ? 'border border-neutral-400 text-white bg-black'
                              : 'border border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {match.severity}
                        </span>
                        <span className="text-white font-bold font-mono text-[11px]">
                          {match.indicator}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 font-sans">{match.evidence}</p>
                    </div>
                    <span className="text-[10px] text-neutral-500 uppercase font-mono shrink-0">
                      [{match.category}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 border border-neutral-800 bg-neutral-950 text-[11px] text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>
                Zero illicit darknet/underground forum registrations, credential broker listings, or offensive weaponization indicators identified. Footprint aligns with standard public digital surface.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Deep Behavioral & OPSEC Analysis */}
      {report.behavioralSignals && (
        <div className="border border-neutral-800 bg-black p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Behavioral Matrix & OPSEC Evaluation
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 uppercase">
              Psychographic, Timezone & Language Signals
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* OPSEC Hygiene */}
            <div className="p-2.5 border border-neutral-800 bg-neutral-950 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase block">OPSEC Hygiene</span>
              <span className="text-xs font-bold text-white uppercase">
                {report.behavioralSignals.opsecHygiene}
              </span>
            </div>

            {/* Social Exposure Risk */}
            <div className="p-2.5 border border-neutral-800 bg-neutral-950 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase block">Social Exposure</span>
              <span className="text-xs font-bold text-white uppercase">
                {report.behavioralSignals.socialExposureRisk}
              </span>
            </div>

            {/* Anonymity Effort */}
            <div className="p-2.5 border border-neutral-800 bg-neutral-950 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase block">Anonymity Effort</span>
              <span className="text-xs font-bold text-white uppercase">
                {report.behavioralSignals.anonymityEffort}
              </span>
            </div>

            {/* Handle Persistence */}
            <div className="p-2.5 border border-neutral-800 bg-neutral-950 space-y-1 col-span-2 sm:col-span-1 lg:col-span-2">
              <span className="text-[10px] text-neutral-500 uppercase block">Handle Persistence</span>
              <span className="text-xs font-bold text-white truncate block" title={report.behavioralSignals.handlePersistencePattern}>
                {report.behavioralSignals.handlePersistencePattern}
              </span>
            </div>

            {/* Account Era */}
            <div className="p-2.5 border border-neutral-800 bg-neutral-950 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase block">Account Era</span>
              <span className="text-xs font-bold text-white truncate block">
                {report.behavioralSignals.accountCreationEra || 'Established'}
              </span>
            </div>
          </div>

          {/* Timezone and Language Specific Forensic Signal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Timezone Signals Card */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2.5">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  Timezone & Diurnal Activity Signals
                </span>
                {report.behavioralSignals.timezone && (
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-white font-mono">
                    {report.behavioralSignals.timezone}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 font-sans">
                <p className="text-xs text-neutral-200">
                  <strong className="text-white font-mono text-[11px]">Peak Activity Window:</strong>{' '}
                  {report.behavioralSignals.activeTimezoneWindow}
                </p>
                {report.behavioralSignals.timezoneSignals && report.behavioralSignals.timezoneSignals.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">
                      Platform Temporal Evidence:
                    </span>
                    <ul className="space-y-1">
                      {report.behavioralSignals.timezoneSignals.map((sig, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-1.5">
                          <span className="text-neutral-500 select-none font-mono">▸</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Language Signals Card */}
            <div className="p-3.5 border border-neutral-800 bg-neutral-950 space-y-2.5">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-1.5">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-neutral-400" />
                  Linguistic & Dialect Profile
                </span>
                {report.behavioralSignals.primaryLanguage && (
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-white font-mono">
                    {report.behavioralSignals.primaryLanguage}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 font-sans">
                <p className="text-xs text-neutral-200">
                  <strong className="text-white font-mono text-[11px]">Linguistic Footprint:</strong>{' '}
                  {report.behavioralSignals.language || report.behavioralSignals.primaryLanguage}
                </p>
                <p className="text-xs text-neutral-300">
                  <strong className="text-white font-mono text-[11px]">Discourse Style:</strong>{' '}
                  {report.behavioralSignals.linguisticStyle}
                </p>
                {report.behavioralSignals.languageSignals && report.behavioralSignals.languageSignals.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono block">
                      Platform Linguistic Clues:
                    </span>
                    <ul className="space-y-1">
                      {report.behavioralSignals.languageSignals.map((sig, idx) => (
                        <li key={idx} className="text-xs text-neutral-300 flex items-start gap-1.5">
                          <span className="text-neutral-500 select-none font-mono">▸</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Account Creation & Activity Timeline Component */}
      <DossierTimeline
        foundResults={foundResults}
        target={target}
        aiProfile={report}
        emailData={emailData}
      />

      {/* Threat Vulnerabilities & Defensive Recommendations */}
      {(report.threatVulnerabilities || report.recommendedDefensiveActions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {report.threatVulnerabilities && (
            <div className="p-4 border border-neutral-800 bg-black space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] border-b border-neutral-800 pb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-300" />
                Identified Threat Vulnerabilities
              </div>
              <ul className="space-y-1.5 pt-1">
                {report.threatVulnerabilities.map((v, i) => (
                  <li key={i} className="text-neutral-300 font-sans text-xs flex items-start gap-2">
                    <span className="text-neutral-500 select-none">•</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommendedDefensiveActions && (
            <div className="p-4 border border-neutral-800 bg-black space-y-2.5">
              <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px] border-b border-neutral-800 pb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                Defensive Hardening Recommendations
              </div>
              <ul className="space-y-1.5 pt-1">
                {report.recommendedDefensiveActions.map((act, i) => (
                  <li key={i} className="text-neutral-300 font-sans text-xs flex items-start gap-2">
                    <span className="text-neutral-500 select-none">→</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Attributes Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Technical Skills */}
        <div className="p-4 border border-neutral-800 bg-black space-y-2">
          <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
            Technical Fingerprint
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.technicalSkills?.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 border border-neutral-800 bg-neutral-950 text-neutral-300 text-[11px]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Inferred Geo/Language */}
        <div className="p-4 border border-neutral-800 bg-black space-y-2">
          <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
            Inferred Locations & Timezone
          </div>
          <div className="space-y-1 text-neutral-300 text-[11px]">
            {report.inferredLocations?.map((loc, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-white inline-block" />
                {loc}
              </div>
            ))}
          </div>
        </div>

        {/* Identity Correlation */}
        <div className="p-4 border border-neutral-800 bg-black space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
            Identity Correlation
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
            {report.identityCorrelation}
          </p>
        </div>
      </div>

      {/* Investigation Pivots */}
      {report.investigationPivots && report.investigationPivots.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="text-xs text-white uppercase font-bold tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" />
            Recommended Investigation Pivots (Next Hops)
          </div>
          <div className="space-y-2">
            {report.investigationPivots.map((pivot, i) => (
              <div
                key={i}
                className="p-3 border border-neutral-800 bg-black space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-xs">{pivot.hop}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 border border-neutral-800 text-neutral-400">
                      {pivot.type}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 font-sans">{pivot.explanation}</p>
                {pivot.recommendedAction && (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-300 bg-neutral-950 p-1.5 border border-neutral-900">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <code className="select-all text-neutral-200">{pivot.recommendedAction}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
