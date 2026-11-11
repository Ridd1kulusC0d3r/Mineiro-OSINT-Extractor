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
import { APP_VERSION } from '../version';

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
    <div className="card font-mono text-xs flex flex-col h-[580px] overflow-hidden relative !bg-paper">
      {/* Terminal Titlebar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-rule bg-paper-2 gap-2 z-10">
        <div className="flex items-center gap-2 text-ink-2">
          <TerminalIcon className="w-3.5 h-3.5 text-ink" />
          <span className="text-ink font-bold tracking-wider text-xs">
            {t.consoleTitle}
          </span>
          {isScanning ? (
            <span className="chip chip-signal !text-[9px] animate-pulse">
              {t.consoleLive}
            </span>
          ) : (
            <span className="chip chip-quiet !text-[9px]">
              {t.consoleIdle}
            </span>
          )}
          <span className="text-ink-3 text-[10px] hidden sm:inline">
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
                ? 'bg-card border-ink/40 text-ink font-medium'
                : 'bg-paper border-rule text-ink-3 hover:text-ink-2'
            }`}
            title={autoScroll ? t.consoleScrollOn : t.consoleScrollOff}
          >
            <ArrowDown className={`w-3 h-3 ${autoScroll ? 'text-ink' : 'text-ink-3'}`} />
            <span>{autoScroll ? t.consoleScrollOn : t.consoleScrollOff}</span>
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            id="terminal-copy-logs-btn"
            onClick={copyLogs}
            className="btn !h-7 !px-2.5 !py-0 !text-[10px] font-mono"
            title={t.consoleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-ink" />
                <span className="text-ink font-semibold">{t.consoleCopied}</span>
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
            className="btn btn-icon !h-7 !w-7 !p-0"
            title={t.consoleClear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Level Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-rule bg-paper-2/70 gap-2 z-10">
        {/* Log Level Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="terminal-filter-all-btn"
            onClick={() => setSelectedLevel('all')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border transition-all whitespace-nowrap ${
              selectedLevel === 'all'
                ? 'bg-ink text-paper font-bold border-ink shadow-sm'
                : 'bg-paper-2 text-ink-2 border-rule hover:text-ink hover:border-ink-3'
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
                ? 'bg-ink/15 text-ink font-bold border-ink/50'
                : 'bg-paper-2 text-ink-2 border-rule hover:text-ink'
            }`}
          >
            <Info className="w-3 h-3 text-ink-2" />
            <span>{t.consoleFilterInfo} ({counts.info})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-success-btn"
            onClick={() => setSelectedLevel('success')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'success'
                ? 'bg-ink/20 text-ink font-bold border-ink/60'
                : 'bg-paper-2 text-ink-2 border-rule hover:text-ink'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-ink" />
            <span>{t.consoleFilterSuccess} ({counts.success})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-warn-btn"
            onClick={() => setSelectedLevel('warn')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'warn'
                ? 'bg-ink-3/20 text-ink-3 font-bold border-ink-3/50'
                : 'bg-paper-2 text-ink-2 border-rule hover:text-ink-3'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-ink-3" />
            <span>{t.consoleFilterWarn} ({counts.warn})</span>
          </button>

          <button
            type="button"
            id="terminal-filter-error-btn"
            onClick={() => setSelectedLevel('error')}
            className={`h-7 px-2.5 rounded text-[11px] font-mono border flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedLevel === 'error'
                ? 'bg-ink/20 text-ink font-bold border-ink/50'
                : 'bg-paper-2 text-ink-2 border-rule hover:text-ink'
            }`}
          >
            <AlertOctagon className="w-3 h-3 text-ink" />
            <span>{t.consoleFilterError} ({counts.error})</span>
          </button>
        </div>

        {/* Quick Text Filter Search */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2.5 pointer-events-none" />
          <input
            id="terminal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.consoleSearchPlaceholder}
            className="field !rounded-full h-7 pl-8 pr-6 text-xs w-36 sm:w-48 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              id="terminal-clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 text-[10px] text-ink-3 hover:text-ink px-1"
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
        className="relative flex-1 p-4 overflow-y-auto space-y-1.5 bg-paper text-ink select-text leading-relaxed font-mono"
      >
        {/* Background Watermark: Mineiro Username Intelligence ASCII Logo */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0" 
          aria-hidden="true"
        >
          <pre className="text-ink/[0.05] font-mono text-[9px] sm:text-xs md:text-sm lg:text-base font-black leading-tight text-center tracking-tighter">
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
        <div className="relative z-10 text-ink-2 pb-2 border-b border-rule">
          <pre className="text-[10px] text-ink font-bold leading-tight">
{`   _      _             __  __        
  | |    | |           |  \\/  |       
  | |    | |     __ _  | \\  / |  ___  
  | |    | |    / _\` | | |\\/| | / _ \\ 
  | |____| |___| (_| | | |  | ||  __/ 
  |______|______\\__,_| |_|  |_| \\___| 
  v${APP_VERSION} // UNIFIED OSINT RECONNAISSANCE ENGINE`}
          </pre>
          <p className="mt-2 text-ink-2 text-[11px]">
            {t.consoleReadyMsg}
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="relative z-10 text-ink-3 italic py-10 text-center">
            {t.consoleEmptyNotice}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="relative z-10 py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Filter className="w-6 h-6 text-ink-3" />
            <span className="text-ink font-bold uppercase text-[11px]">
              {t.consoleNoFilteredEvents}
            </span>
            <button
              type="button"
              id="terminal-reset-filter-btn"
              onClick={handleResetFilters}
              className="px-3 py-1 bg-ink text-paper font-bold uppercase text-[10px] hover:bg-signal transition-colors"
            >
              {t.clear}
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            let prefix = '[*]';
            let textColor = 'text-ink-2';
            let badgeBg = 'bg-paper-2 border-rule text-ink-2';

            if (log.level === 'success') {
              prefix = '[+]';
              textColor = 'text-ink font-medium';
              badgeBg = 'bg-paper-2 border-ink/50 text-ink';
            } else if (log.level === 'warn') {
              prefix = '[!]';
              textColor = 'text-ink-3 font-medium';
              badgeBg = 'bg-paper-2 border-ink-3/50 text-ink-3';
            } else if (log.level === 'error') {
              prefix = '[-]';
              textColor = 'text-ink font-medium';
              badgeBg = 'bg-paper-2 border-ink/50 text-ink';
            }

            return (
              <div key={log.id} className={`relative z-10 flex items-start gap-2 ${textColor}`}>
                <span className="text-ink-3 shrink-0 text-[10px] pt-0.5">{log.timestamp}</span>
                <span
                  className={`shrink-0 px-1 py-0.2 text-[9px] uppercase font-bold border ${badgeBg}`}
                >
                  {log.level}
                </span>
                <span className="shrink-0 font-bold">{prefix}</span>
                {log.target && (
                  <span className="shrink-0 text-ink-2 text-[10px] border border-rule px-1 bg-paper-2">
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
      <div className="relative z-10 flex flex-wrap items-center justify-between px-4 py-1.5 border-t border-rule bg-paper-2 text-[10px] text-ink-2 gap-2">
        <div className="flex items-center gap-3">
          <span>
            TOTAL: <strong className="text-ink">{counts.all}</strong>
          </span>
          <span className="text-ink-3">|</span>
          <span>
            INFO: <strong className="text-ink-2">{counts.info}</strong>
          </span>
          <span className="text-ink-3">|</span>
          <span>
            SUCCESS: <strong className="text-ink">{counts.success}</strong>
          </span>
          <span className="text-ink-3">|</span>
          <span>
            WARN: <strong className="text-ink-3">{counts.warn}</strong>
          </span>
          <span className="text-ink-3">|</span>
          <span>
            ERROR: <strong className="text-ink">{counts.error}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedLevel !== 'all' && (
            <span className="text-ink uppercase font-semibold">
              Filter: {selectedLevel}
            </span>
          )}
          {searchQuery && (
            <span className="text-ink-2">
              Query: &quot;{searchQuery}&quot;
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
