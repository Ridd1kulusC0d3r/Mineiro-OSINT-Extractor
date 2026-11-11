import { useMemo, useState } from 'react';
import type { ScanResult } from '../types';

export type StatusFilter = 'all' | 'found' | 'uncertain' | 'not_found' | 'rate_limited';

/** Search and status filter of the Evidence and Platforms views. `uncertain` also matches rate-limited results. */
export function useResultFilters(results: ScanResult[]) {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visibleResults = useMemo(() => {
    return results.filter((r) => {
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesName = r.platformName.toLowerCase().includes(q);
        const matchesUrl = r.url.toLowerCase().includes(q);
        if (!matchesName && !matchesUrl) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'uncertain') {
          if (r.status !== 'uncertain' && r.status !== 'rate_limited') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [results, searchFilter, statusFilter]);

  return { searchFilter, setSearchFilter, statusFilter, setStatusFilter, visibleResults };
}
