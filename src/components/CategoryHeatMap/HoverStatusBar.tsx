import { Info } from 'lucide-react';
import { HEATMAP_STOPS } from '../../theme/palette';
import type { HoveredCell } from './categoryHeatMap.logic';

/** The hovered cell's value and description, and the thermal scale legend. */
export function HoverStatusBar({ hoveredCell }: { hoveredCell: HoveredCell | null }) {
  return (
    <div className="border border-rule bg-rule-2/60 p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      {hoveredCell ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-ink-3 uppercase">Focused Cell:</span>
          <span className="font-bold text-ink uppercase">{hoveredCell.category}</span>
          <span className="text-ink-3">»</span>
          <span className="text-ink font-mono font-semibold">{hoveredCell.dimension}:</span>
          <span className="px-2 py-0.5 bg-signal text-signal-ink font-bold text-xs">
            {Math.round(hoveredCell.value)}%
          </span>
          <span className="text-ink-3 font-sans text-[11px] sm:ml-2">
            ({hoveredCell.description})
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-ink-3">
          <Info className="w-3.5 h-3.5 text-ink-3 shrink-0" />
          <span>Hover over any thermal cell to audit details and click to inspect sector profiles.</span>
        </div>
      )}

      {/* Standardized Heatmap Legend Bar */}
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <span className="text-[10px] text-ink-3 uppercase mr-1">Thermal Scale:</span>
        {HEATMAP_STOPS.map((stop) => (
          <div key={stop.color} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-none inline-block border border-paper"
              style={{ backgroundColor: stop.color }}
            />
            <span className="text-[9px] text-ink-3">{stop.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
