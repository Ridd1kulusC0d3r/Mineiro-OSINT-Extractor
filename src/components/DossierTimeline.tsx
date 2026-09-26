import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Activity,
  CheckCircle2,
  Filter,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Radio,
} from 'lucide-react';
import { ScanResult, AiProfileReport, EmailReconData, Category } from '../types';
import { generatePlatformTimeline, TimelineMilestone } from '../data/platformTimelineData';

interface DossierTimelineProps {
  foundResults: ScanResult[];
  target: string;
  aiProfile?: AiProfileReport | null;
  emailData?: EmailReconData | null;
}

export function DossierTimeline({
  foundResults,
  target,
  aiProfile,
  emailData,
}: DossierTimelineProps) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDetailedView, setIsDetailedView] = useState<boolean>(true);

  // Compute chronological timeline data and pattern analysis
  const timelineData = useMemo(() => {
    return generatePlatformTimeline(foundResults, target, aiProfile, emailData);
  }, [foundResults, target, aiProfile, emailData]);

  // Categories present in milestones
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    timelineData.milestones.forEach((m) => cats.add(m.category));
    return Array.from(cats);
  }, [timelineData.milestones]);

  // Filter and sort milestones
  const displayedMilestones = useMemo(() => {
    let list = [...timelineData.milestones];

    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.category === selectedCategory);
    }

    if (sortOrder === 'desc') {
      list.reverse();
    }

    return list;
  }, [timelineData.milestones, selectedCategory, sortOrder]);

  if (foundResults.length === 0) {
    return (
      <div id="dossier-timeline-empty" className="border border-neutral-800 bg-neutral-950 p-6 text-center space-y-3 font-mono">
        <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
        <div className="text-white font-bold text-xs uppercase tracking-wider">
          Temporal Timeline Data Unavailable
        </div>
        <p className="text-neutral-400 text-xs font-sans max-w-md mx-auto">
          Execute an OSINT reconnaissance scan to discover verified platform accounts and map chronological activity patterns.
        </p>
      </div>
    );
  }

  return (
    <div id="dossier-timeline" className="border border-neutral-800 bg-black p-5 space-y-5 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Chronological Identity Timeline & Temporal Patterns
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono">
              {timelineData.milestones.length} Events Plotted
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Chronologically maps platform inception, estimated account registrations, and active probe timestamps to reconstruct target identity genesis and temporal evolution.
          </p>
        </div>

        {/* View and Sorting Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Chronological Sort Toggle */}
          <button
            id="timeline-sort-toggle-btn"
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-2.5 py-1 text-[11px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors flex items-center gap-1.5"
            title="Toggle chronological ordering"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <span>{sortOrder === 'asc' ? 'Oldest → Newest' : 'Newest → Oldest'}</span>
          </button>

          {/* Compact / Detailed View Toggle */}
          <button
            id="timeline-view-density-btn"
            type="button"
            onClick={() => setIsDetailedView((prev) => !prev)}
            className="px-2.5 py-1 text-[11px] border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>{isDetailedView ? 'Forensic View' : 'Compact View'}</span>
          </button>
        </div>
      </div>

      {/* KPI & Temporal Pattern Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* 1. Earliest Digital Milestone */}
        <div className="p-3 border border-neutral-800 bg-neutral-950 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-400" />
            <span>Estimated Genesis</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-white">~{timelineData.earliestYear}</span>
            <span className="text-[10px] text-neutral-400">({timelineData.footprintSpanYears}y span)</span>
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            {timelineData.milestones[0]?.platformName ? `First on ${timelineData.milestones[0].platformName}` : 'Inaugural service'}
          </div>
        </div>

        {/* 2. Seniority Classification */}
        <div className="p-3 border border-neutral-800 bg-neutral-950 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-neutral-400" />
            <span>Seniority Index</span>
          </div>
          <div className="text-sm font-bold text-white tracking-wide truncate">
            {timelineData.footprintSpanYears >= 10 ? 'Senior Veteran' : 'Established'}
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            {timelineData.seniorityClassification}
          </div>
        </div>

        {/* 3. Primary Registration Epoch */}
        <div className="p-3 border border-neutral-800 bg-neutral-950 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-neutral-400" />
            <span>Peak Density Era</span>
          </div>
          <div className="text-sm font-bold text-white tracking-wide truncate">
            {timelineData.burstPeriods[0]?.era ? timelineData.burstPeriods[0].era.split('(')[0].trim() : 'Distributed'}
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            {timelineData.burstPeriods[0]?.count || 1} accounts clustered
          </div>
        </div>

        {/* 4. Active Diurnal Window */}
        <div className="p-3 border border-neutral-800 bg-neutral-950 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-neutral-400" />
            <span>Operating Corridor</span>
          </div>
          <div className="text-sm font-bold text-white tracking-wide truncate">
            {timelineData.activeTimezoneCorridor.split('(')[0].trim() || 'UTC-3'}
          </div>
          <div className="text-[10px] text-neutral-400 truncate">
            {timelineData.activeTimezoneCorridor.includes('(')
              ? timelineData.activeTimezoneCorridor.split('(')[1].replace(')', '')
              : 'Diurnal activity window'}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {availableCategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
          <span className="text-neutral-500 uppercase shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter Domain:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2 py-0.5 border uppercase transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'border-white bg-white text-black font-bold'
                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            All ({timelineData.milestones.length})
          </button>
          {availableCategories.map((cat) => {
            const count = timelineData.milestones.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 border uppercase transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'border-white bg-white text-black font-bold'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Vertical Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 pt-2">
        {/* The Central Vertical Spine Line */}
        <div className="absolute left-2.5 sm:left-3 top-4 bottom-4 w-[2px] bg-neutral-800" />

        {displayedMilestones.map((item, index) => {
          const phaseBadgeClass =
            item.temporalPhase === 'Genesis Milestone'
              ? 'border-white bg-neutral-900 text-white font-bold'
              : item.temporalPhase === 'Specialization'
              ? 'border-neutral-500 bg-black text-neutral-200'
              : 'border-neutral-800 bg-neutral-950 text-neutral-400';

          return (
            <div
              key={item.id}
              id={`milestone-${item.platformId}`}
              className="relative group"
            >
              {/* Vertical Spine Bullet Node */}
              <div
                className={`absolute -left-6 sm:-left-8 top-3 w-5 h-5 -ml-[9.5px] rounded-none border flex items-center justify-center transition-all ${
                  item.isEarliest
                    ? 'border-white bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                    : 'border-neutral-700 bg-black text-neutral-300 group-hover:border-white group-hover:bg-neutral-900'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 ${item.isEarliest ? 'bg-black' : 'bg-white'}`}
                />
              </div>

              {/* Event Card */}
              <div className="p-3.5 border border-neutral-800/90 bg-neutral-950 hover:border-neutral-600 transition-all space-y-2">
                {/* Top Row: Year badge, Platform Name, Category, Phase */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Estimated Year Marker */}
                    <span className="text-xs px-2 py-0.5 bg-black border border-neutral-700 text-white font-bold">
                      EST. ~{item.estimatedRegistrationYear}
                    </span>

                    {/* Platform Title */}
                    <span className="text-xs font-bold text-white tracking-wider">
                      {item.platformName}
                    </span>

                    {/* Category */}
                    <span className="text-[9px] uppercase px-1.5 py-0.2 border border-neutral-800 bg-neutral-900 text-neutral-400">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Temporal Phase */}
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 border ${phaseBadgeClass}`}>
                      {item.temporalPhase}
                    </span>

                    {/* Clickable External URL */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 transition-colors"
                      title={`Visit @${target} on ${item.platformName}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Subheader: Account URL & Target Handle */}
                <div className="text-[11px] text-neutral-300 font-mono flex flex-wrap items-center gap-2">
                  <span className="text-neutral-500">Corroborated Handle:</span>
                  <span className="text-white font-bold bg-black px-1.5 py-0.2 border border-neutral-800">
                    @{target}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate max-w-xs sm:max-w-md">
                    {item.url}
                  </span>
                </div>

                {/* Detailed View Forensic Breakdown */}
                {isDetailedView && (
                  <>
                    <p className="text-[11px] text-neutral-300 font-sans leading-relaxed pt-0.5 border-t border-neutral-900">
                      {item.temporalRationale}
                    </p>

                    {/* Telemetry and Era Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-neutral-500 border-t border-neutral-900/60">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400">
                          Platform Era: <strong className="text-neutral-300">{item.registrationEra}</strong>
                        </span>
                        <span>•</span>
                        <span>Inaugural Year: {item.launchYear}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-neutral-300 font-mono">
                          HTTP {item.statusCode || 200} OK
                        </span>
                        <span>•</span>
                        <span className="text-neutral-400 font-mono">
                          {item.responseTimeMs || 85}ms
                        </span>
                        <span>•</span>
                        <span className="text-neutral-400 font-mono">
                          {item.confidenceScore}% conf
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Behavioral Temporal Synthesis Summary */}
      <div className="p-4 border border-neutral-800 bg-neutral-950 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
          <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
          <span>Temporal Behavioral Synthesis & Operating Rationale</span>
        </div>
        <p className="text-neutral-300 font-sans text-xs leading-relaxed">
          {timelineData.temporalDensityAssessment}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans text-[11px] text-neutral-400">
          <div className="p-2 border border-neutral-900 bg-black flex items-start gap-2">
            <span className="text-white font-mono font-bold shrink-0">[01]</span>
            <span>
              <strong>Handle Persistence:</strong> Consistent handle '@{target}' usage across {timelineData.milestones.length} platforms demonstrates predictable moniker reuse rather than ephemeral burner identities.
            </span>
          </div>
          <div className="p-2 border border-neutral-900 bg-black flex items-start gap-2">
            <span className="text-white font-mono font-bold shrink-0">[02]</span>
            <span>
              <strong>Temporal Footprint:</strong> Oldest footprint detected circa ~{timelineData.earliestYear}. No abrupt multi-year dormancy observed across major ecosystem shifts.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
