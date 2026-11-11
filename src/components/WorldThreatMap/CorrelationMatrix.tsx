import { Check, ChevronDown, ChevronUp, Copy, Crosshair, ExternalLink, Search, Server } from 'lucide-react';
import type { MappedOrigin } from '../../data/geoPlatforms';

interface CorrelationMatrixProps {
  allOrigins: MappedOrigin[];
  matrixRows: MappedOrigin[];
  matrixSearch: string;
  setMatrixSearch: (value: string) => void;
  showCorrelationMatrix: boolean;
  setShowCorrelationMatrix: (value: boolean) => void;
  activeOrigin: MappedOrigin | null;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
  focusOnServer: (origin: MappedOrigin) => void;
}

/** Collapsible URL to server IP table. */
export function CorrelationMatrix({
  allOrigins, matrixRows, matrixSearch, setMatrixSearch, showCorrelationMatrix, setShowCorrelationMatrix, activeOrigin,
  copiedKey, copyToClipboard, focusOnServer,
}: CorrelationMatrixProps) {
  return (
    <div className="border border-rule bg-paper">
      <div 
        className="p-3 border-b border-rule flex items-center justify-between cursor-pointer hover:bg-rule-2/50 transition-colors"
        onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
      >
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-ink shrink-0" />
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            URL ↔ Server IP Infrastructure Correlation Matrix
          </span>
          <span className="text-[10px] px-2 py-0.5 border border-rule bg-rule-2 text-ink-2">
            {allOrigins.length} Correlated Endpoints
          </span>
        </div>

        <div className="flex items-center gap-2 text-ink-3 text-xs">
          <span>{showCorrelationMatrix ? 'Collapse Matrix' : 'Expand Matrix'}</span>
          {showCorrelationMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {showCorrelationMatrix && (
        <div className="p-3 space-y-3">
          {/* Search Filter for Matrix */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by IP, platform, ASN, city, URL..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-paper-2 border border-rule text-ink text-[11px] placeholder:text-ink-3 focus:outline-none focus:border-ink-3 font-mono"
              />
            </div>

            <div className="text-[11px] text-ink-3 flex items-center gap-2">
              <span>Showing {matrixRows.length} of {allOrigins.length} endpoints</span>
              {matrixSearch && (
                <button
                  type="button"
                  onClick={() => setMatrixSearch('')}
                  className="text-ink-3 hover:text-ink underline text-[10px]"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-rule">
            <table className="w-full text-left text-[11px] font-mono divide-y divide-rule">
              <thead className="bg-paper-2 text-ink-3 text-[10px] uppercase">
                <tr>
                  <th className="p-2.5">Discovered Platform & Target URL</th>
                  <th className="p-2.5">Correlated Server IP</th>
                  <th className="p-2.5">ASN & Backbone</th>
                  <th className="p-2.5">Geographical Location</th>
                  <th className="p-2.5">Jurisdiction</th>
                  <th className="p-2.5 text-right">Threat Density</th>
                  <th className="p-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule bg-paper">
                {matrixRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-ink-3">
                      No correlated endpoints matched search criteria.
                    </td>
                  </tr>
                ) : (
                  matrixRows.map((origin) => {
                    const isSelected = activeOrigin?.id === origin.id;
                    return (
                      <tr 
                        key={origin.id}
                        className={`hover:bg-rule-2/60 transition-colors ${
                          isSelected ? 'bg-rule-2/80 border-l-2 border-l-ink' : ''
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            <span>{origin.platformName}</span>
                            <span className="text-[9px] uppercase px-1 py-0.2 bg-rule-2 border border-rule text-ink-3 font-normal">
                              {origin.category}
                            </span>
                          </div>
                          <a
                            href={origin.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-ink-3 hover:text-ink truncate block max-w-xs transition-colors mt-0.5"
                            title={origin.url}
                          >
                            {origin.url}
                          </a>
                        </td>

                        <td className="p-2.5">
                          <div className="text-ink font-bold flex items-center gap-1">
                            <span>{origin.serverIp}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(origin.serverIp, `tbl-ip-${origin.id}`)}
                              className="text-ink-3 hover:text-ink"
                              title="Copy IP"
                            >
                              {copiedKey === `tbl-ip-${origin.id}` ? (
                                <Check className="w-2.5 h-2.5 text-ink" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-ink-3 truncate max-w-[180px]">
                            {origin.resolvedHost}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="text-ink font-medium truncate max-w-[160px]" title={origin.asn}>
                            {origin.asn}
                          </div>
                          <div className="text-[10px] text-ink-3 truncate max-w-[160px]">
                            {origin.isp}
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="text-ink">{origin.city}</div>
                          <div className="text-[10px] text-ink-3">{origin.country}</div>
                        </td>

                        <td className="p-2.5">
                          <span className="text-[10px] uppercase px-1.5 py-0.5 bg-paper-2 border border-rule text-ink-2">
                            {origin.jurisdiction}
                          </span>
                        </td>

                        <td className="p-2.5 text-right">
                          <span className={`font-bold ${origin.threatDensityWeight > 80 ? 'text-ink-3' : 'text-ink-2'}`}>
                            {origin.threatDensityWeight}
                          </span>
                          <span className="text-[10px] text-ink-3 block">
                            Score: {origin.threatScore}
                          </span>
                        </td>

                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => focusOnServer(origin)}
                              className="p-1 border border-rule bg-paper-2 text-ink-3 hover:text-ink hover:border-ink-3"
                              title="Locate on World Map"
                            >
                              <Crosshair className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={origin.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 border border-rule bg-paper-2 text-ink-3 hover:text-ink hover:border-ink-3"
                              title="Open URL"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
