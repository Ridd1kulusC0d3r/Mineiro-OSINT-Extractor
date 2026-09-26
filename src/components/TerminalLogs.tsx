import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  Trash2,
  Search,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Filter,
} from 'lucide-react';
import { ScanLog } from '../types';
import { useI18n } from '../utils/i18n';

export type LogLevelFilter = 'all' | 'info' | 'success' | 'warn' | 'error';

interface TerminalLogsProps {
  logs: ScanLog[];
  onClearLogs: () => void;
  isScanning: boolean;
}

export function TerminalLogs({ logs, onClearLogs, isScanning }: TerminalLogsProps) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedLevel, setSelectedLevel] = useState<LogLevelFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  // Compute log count per level
  const counts = useMemo(() => {
    let info = 0;
    let success = 0;
    let warn = 0;
    let error = 0;

    for (const log of logs) {
      if (log.level === 'info') info++;
      else if (log.level === 'success') success++;
      else if (log.level === 'warn') warn++;
      else if (log.level === 'error') error++;
    }

    return {
      all: logs.length,
      info,
      success,
      warn,
      error,
    };
  }, [logs]);

  // Filter logs based on level and search query
  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }
      if (query) {
        const msgMatch = log.message.toLowerCase().includes(query);
        const targetMatch = log.target ? log.target.toLowerCase().includes(query) : false;
        return msgMatch || targetMatch;
      }
      return true;
    });
  }, [logs, selectedLevel, searchQuery]);

  // Auto-scroll on new logs if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const copyLogs = () => {
    const textToCopy = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}]${l.target ? ` [${l.target}]` : ''} ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetFilters = () => {
    setSelectedLevel('all');
    setSearchQuery('');
  };

  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#050505] font-mono text-xs flex flex-col h-[580px] overflow-hidden shadow-lg relative">
      {/* Terminal Titlebar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-[#2A2A2A] bg-[#0A0A0A] gap-2 z-10">
        <div className="flex items-center gap-2 text-[#A3A3A3]">
          <TerminalIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="text-[#F5F5F5] font-bold tracking-wider text-xs">
            {t.consoleTitle}
          </span>
          {isScanning ? (
            <span className="px-1.5 py-0.5 text-[9px] bg-[#FFFFFF] text-[#050505] font-bold rounded animate-pulse">
              {t.consoleLive}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 text-[9px] border border-[#2A2A2A] text-[#737373] uppercase rounded">
              {t.consoleIdle}
            </span>
          )}
          <span className="text-[#737373] text-[10px] hidden sm:inline">
            ({filteredLogs.length}{filteredLogs.length !== logs.length ? ` of ${logs.length}` : ''} {t.consoleEvents})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Auto-scroll toggle */}
          <button
            type="button"
            id="terminal-autoscroll-toggle-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-7 px-2.5 text-[10px] rounded border flex items-center gap-1 transition-all ${
              autoScroll
                ? 'bg-[#111111] border-[#FFFFFF]/40 text-[#FFFFFF] font-medium'
                : 'bg-[#050505] border-[#2A2A2A] text-[#737373] hover:text-[#A3A3A3]'
            }`}
            title={autoScroll ? t.consoleScrollOn : t.consoleScrollOff}
          >
            <ArrowDown className={`w-3 h-3 ${autoScroll ? 'text-[#FFFFFF]' : 'text-[#737373]'}`} />
            <span>{autoScroll ? t.consoleScrollOn : t.consoleScrollOff}</span>
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            id="terminal-copy-logs-btn"
            onClick={copyLogs}
            className="h-7 px-2.5 rounded border border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373] transition-all flex items-center gap-1 text-[10px]"
            title={t.consoleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#FFFFFF]" />
                <span className="text-[#FFFFFF] font-semibold">{t.consoleCopied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{t.consoleCopy}</span>
              </>
            )}
          </button>

          {/* Clear Console */}
          <button
            type="button"
            id="terminal-clear-logs-btn"
            onClick={onClearLogs}
            className="h-7 px-2 rounded border border-[#2A2A2A] text-[#737373] hover:text-[#FFFFFF] hover:border-[#FFFFFF]/40 transition-all flex items-center justify-center"
            title={t.consoleClear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Level Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[#2A2A2A] bg-[#0A0A0A]/70 gap-2 z-10">
        {/* Log Level Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="terminal-filter-all-btn"
            onClick={() => setSelectedLevel('all')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all whitespace-nowrap ${
              selectedLevel === 'all'
                ? 'bg-[#F5F5F5] text-[#050505] font-bold border-[#F5F5F5] shadow-sm'
                : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:text-[#F5F5F5] hover:border-[#737373]'
            }`}
          >
            {t.consoleFilterAll} ({counts.all})
          </button>

          <button
            type="button"
            id="terminal-filter-info-btn"
            onClick={() => setSelectedLevel('info')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'info'
                ? 'bg-[#FFFFFF]/15 text-[#FFFFFF] font-bold border-[#FFFFFF]/50'
                : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:text-[#F5F5F5]'
            }`}
          >
            <Info className="w-3 h-3 text-[#A3A3A3]" />
            <span>{t.consoleFilterInfo} ({counts.info})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-success-btn"
            onClick={() => setSelectedLevel('success')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'success'
                ? 'bg-[#FFFFFF]/20 text-[#FFFFFF] font-bold border-[#FFFFFF]/60'
                : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:text-[#FFFFFF]'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-[#FFFFFF]" />
            <span>{t.consoleFilterSuccess} ({counts.success})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-warn-btn"
            onClick={() => setSelectedLevel('warn')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'warn'
                ? 'bg-[#737373]/20 text-[#737373] font-bold border-[#737373]/50'
                : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:text-[#737373]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#737373]" />
            <span>{t.consoleFilterWarn} ({counts.warn})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-error-btn"
            onClick={() => setSelectedLevel('error')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'error'
                ? 'bg-[#FFFFFF]/20 text-[#FFFFFF] font-bold border-[#FFFFFF]/50'
                : 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A] hover:text-[#FFFFFF]'
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-[#FFFFFF]" />
            <span>{t.consoleFilterError} ({counts.error})</span>
          </button>
        </div>

        {/* Quick Text Filter Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#737373] absolute left-2.5 pointer-events-none" />
          <input
            id="terminal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.consoleSearchPlaceholder}
            className="h-7 pl-8 pr-6 bg-[#050505] border border-[#2A2A2A] rounded text-[#F5F5F5] text-xs placeholder:text-[#737373] focus:outline-none focus:border-[#FFFFFF] w-36 sm:w-48 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              id="terminal-clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 text-[10px] text-[#737373] hover:text-[#F5F5F5] px-1"
              title="Clear Search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Terminal Stream with Mineiro Username Intelligence ASCII Background */}
      <div
        ref={scrollRef}
        className="relative flex-1 p-4 overflow-y-auto space-y-1.5 bg-[#050505] text-[#F5F5F5] select-text leading-relaxed font-mono"
      >
        {/* Background Watermark: Mineiro Username Intelligence ASCII Logo */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0" 
          aria-hidden="true"
        >
          <pre className="text-[#FFFFFF]/[0.05] font-mono text-[9px] sm:text-xs md:text-sm lg:text-base font-black leading-tight text-center tracking-tighter">
{`
 ██╗     ██╗          ███╗   ███╗███████╗
 ██║     ██║          ████╗ ████║██╔════╝
 ██║     ██║    █████╗██╔████╔██║█████╗  
 ██║     ██║    ╚════╝██║╚██╔╝██║██╔══╝  
 ███████╗███████╗     ██║ ╚═╝ ██║███████╗
 ╚══════╝╚══════╝     ╚═╝     ╚═╝╚══════╝
      [ Mineiro Username Intelligence // UNIFIED OSINT ENGINE ]
`}
          </pre>
        </div>

        {/* Initial ASCII Header Banner */}
        <div className="relative z-10 text-[#A3A3A3] pb-2 border-b border-[#2A2A2A]">
          <pre className="text-[10px] text-[#FFFFFF] font-bold leading-tight">
{`   _      _             __  __        
  | |    | |           |  \\/  |       
  | |    | |     __ _  | \\  / |  ___  
  | |    | |    / _\` | | |\\/| | / _ \\ 
  | |____| |___| (_| | | |  | ||  __/ 
  |______|______\\__,_| |_|  |_| \\___| 
  v2.5.0 // UNIFIED OSINT RECONNAISSANCE ENGINE`}
          </pre>
          <p className="mt-2 text-[#A3A3A3] text-[11px]">
            {t.consoleReadyMsg}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="relative z-10 text-[#737373] italic py-10 text-center">
            {t.consoleEmptyNotice}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Filter className="w-6 h-6 text-[#737373]" />
            <span className="text-[#F5F5F5] font-bold uppercase text-[11px]">
              {t.consoleNoFilteredEvents}
            </span>
            <button
              type="button"
              id="terminal-reset-filter-btn"
              onClick={handleResetFilters}
              className="px-3 py-1 bg-[#F5F5F5] text-[#050505] font-bold uppercase text-[10px] hover:bg-white transition-colors"
            >
              {t.clear}
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let prefix = '[*]';
            let textColor = 'text-[#A3A3A3]';
            let badgeBg = 'bg-[#0A0A0A] border-[#2A2A2A] text-[#A3A3A3]';

            if (log.level === 'success') {
              prefix = '[+]';
              textColor = 'text-[#F5F5F5] font-medium';
              badgeBg = 'bg-[#0A0A0A] border-[#FFFFFF]/50 text-[#FFFFFF]';
            } else if (log.level === 'warn') {
              prefix = '[!]';
              textColor = 'text-[#737373] font-medium';
              badgeBg = 'bg-[#0A0A0A] border-[#737373]/50 text-[#737373]';
            } else if (log.level === 'error') {
              prefix = '[-]';
              textColor = 'text-[#FFFFFF] font-medium';
              badgeBg = 'bg-[#0A0A0A] border-[#FFFFFF]/50 text-[#FFFFFF]';
            }

            return (
              <div key={log.id} className={`relative z-10 flex items-start gap-2 ${textColor}`}>
                <span className="text-[#737373] shrink-0 text-[10px] pt-0.5">{log.timestamp}</span>
                <span
                  className={`shrink-0 px-1 py-0.2 text-[9px] uppercase font-bold border ${badgeBg}`}
                >
                  {log.level}
                </span>
                <span className="shrink-0 font-bold">{prefix}</span>
                {log.target && (
                  <span className="shrink-0 text-[#A3A3A3] text-[10px] border border-[#2A2A2A] px-1 bg-[#0A0A0A]">
                    @{log.target}
                  </span>
                )}
                <span className="break-all">{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Terminal Footer Telemetry */}
      <div className="relative z-10 flex flex-wrap items-center justify-between px-4 py-1.5 border-t border-[#2A2A2A] bg-[#0A0A0A] text-[10px] text-[#A3A3A3] gap-2">
        <div className="flex items-center gap-3">
          <span>
            TOTAL: <strong className="text-[#F5F5F5]">{counts.all}</strong>
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>
            INFO: <strong className="text-[#A3A3A3]">{counts.info}</strong>
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>
            SUCCESS: <strong className="text-[#FFFFFF]">{counts.success}</strong>
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>
            WARN: <strong className="text-[#737373]">{counts.warn}</strong>
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>
            ERROR: <strong className="text-[#FFFFFF]">{counts.error}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedLevel !== 'all' && (
            <span className="text-[#FFFFFF] uppercase font-semibold">
              Filter: {selectedLevel}
            </span>
          )}
          {searchQuery && (
            <span className="text-[#A3A3A3]">
              Query: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
