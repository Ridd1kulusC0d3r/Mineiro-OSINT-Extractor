import { useCallback, useState } from 'react';
import type { ScanLog } from '../types';
import type { ScanLogLevel } from '../scan/engine';

export type AddLog = (message: string, level?: ScanLogLevel) => void;

/** The console's event stream (TerminalLogs). Every hook writes to it through `addLog`. */
export function useScanLog() {
  const [logs, setLogs] = useState<ScanLog[]>([]);

  const addLog = useCallback<AddLog>((message, level = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp,
        level,
        message,
      },
    ]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, addLog, clearLogs };
}
