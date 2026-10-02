// Internet Archive CDX summary: when did a public profile URL exist?

export interface WaybackSummary {
  snapshots: number;
  firstSeen: string | null;
  lastSeen: string | null;
  statusCodes: Record<string, number>;
  sample: Array<{ timestamp: string; status: string; archiveUrl: string }>;
}

export function cdxQueryUrl(profileUrl: string, limit = 500): string {
  const params = new URLSearchParams({
    url: profileUrl, output: 'json', fl: 'timestamp,statuscode,original,digest',
    collapse: 'digest', limit: String(limit),
  });
  return `https://web.archive.org/cdx/search/cdx?${params}`;
}

function iso(ts: string): string {
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(8, 10)}:${ts.slice(10, 12)}:${ts.slice(12, 14)}Z`;
}

export function summarizeCdx(rows: unknown): WaybackSummary {
  const empty: WaybackSummary = { snapshots: 0, firstSeen: null, lastSeen: null, statusCodes: {}, sample: [] };
  if (!Array.isArray(rows) || rows.length < 2) return empty;

  const entries = (rows.slice(1) as string[][])
    .filter((r) => Array.isArray(r) && /^\d{14}$/.test(r[0]))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!entries.length) return empty;

  const statusCodes: Record<string, number> = {};
  for (const [, status] of entries) statusCodes[status] = (statusCodes[status] || 0) + 1;

  const pick = [entries[0], entries[Math.floor(entries.length / 2)], entries[entries.length - 1]]
    .filter((e, i, arr) => arr.findIndex((x) => x[0] === e[0]) === i);

  return {
    snapshots: entries.length,
    firstSeen: iso(entries[0][0]),
    lastSeen: iso(entries[entries.length - 1][0]),
    statusCodes,
    sample: pick.map(([timestamp, status, original]) => ({
      timestamp: iso(timestamp), status, archiveUrl: `https://web.archive.org/web/${timestamp}/${original}`,
    })),
  };
}
