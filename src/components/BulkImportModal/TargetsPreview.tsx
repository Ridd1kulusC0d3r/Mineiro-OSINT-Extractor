import { AtSign, Mail, Trash2 } from 'lucide-react';
import type { ParsedTarget } from '../../utils/csvParser';

interface TargetsPreviewProps {
  parsedTargets: ParsedTarget[];
  validCount: number;
  usernameCount: number;
  emailCount: number;
  duplicateCount: number;
  handleClearAll: () => void;
  handleRemoveTarget: (id: string) => void;
}

/** Counts of the parsed list and the table of targets, each removable. */
export function TargetsPreview({
  parsedTargets, validCount, usernameCount, emailCount, duplicateCount, handleClearAll, handleRemoveTarget,
}: TargetsPreviewProps) {
  return (
    <div className="space-y-3">
      {/* Metric bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border border-rule bg-paper-2">
        <div className="flex items-center gap-4 text-ink-3">
          <span>VALID TARGETS: <strong className="text-ink">{validCount}</strong></span>
          <span className="flex items-center gap-1">
            <AtSign className="w-3 h-3 text-ink-3" />
            USERNAMES: <strong className="text-ink">{usernameCount}</strong>
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-3 h-3 text-ink-3" />
            EMAILS: <strong className="text-ink">{emailCount}</strong>
          </span>
          {duplicateCount > 0 && (
            <span className="text-ink-3">
              DUPLICATES STRIPPED: {duplicateCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="text-ink-3 hover:text-ink text-[11px] uppercase flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear List
        </button>
      </div>

      {/* Targets Preview Table */}
      <div className="border border-rule bg-paper-2 max-h-56 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-paper border-b border-rule text-ink-3 text-[10px] uppercase sticky top-0">
            <tr>
              <th className="py-2 px-3 w-10">#</th>
              <th className="py-2 px-3">Target Identifier</th>
              <th className="py-2 px-3 w-28">Type</th>
              <th className="py-2 px-3">Context / Notes</th>
              <th className="py-2 px-3 w-16 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {parsedTargets.map((item, idx) => (
              <tr key={item.id} className="hover:bg-rule-2/50 transition-colors">
                <td className="py-1.5 px-3 text-ink-3 text-[10px]">{idx + 1}</td>
                <td className="py-1.5 px-3 font-semibold text-ink">
                  <span className="font-mono">
                    {item.type === 'username' ? `@${item.target}` : item.target}
                  </span>
                </td>
                <td className="py-1.5 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] uppercase border font-bold ${
                      item.type === 'email'
                        ? 'border-rule/80 bg-paper-2/40 text-ink-2'
                        : 'border-rule bg-rule-2 text-ink-2'
                    }`}
                  >
                    {item.type === 'email' ? (
                      <Mail className="w-2.5 h-2.5" />
                    ) : (
                      <AtSign className="w-2.5 h-2.5" />
                    )}
                    {item.type}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-ink-3 text-[11px] truncate max-w-[160px]">
                  {item.notes || '—'}
                </td>
                <td className="py-1.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveTarget(item.id)}
                    className="text-ink-3 hover:text-ink-3 p-1 transition-colors"
                    title="Remove target from batch"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
