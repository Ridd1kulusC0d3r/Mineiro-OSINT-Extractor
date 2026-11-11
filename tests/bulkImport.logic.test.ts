import { describe, expect, it } from 'vitest';
import { summarizeParsedTargets } from '../src/components/BulkImportModal/bulkImport.logic';
import { parseTargetCsv } from '../src/utils/csvParser';

describe('batch import modal logic', () => {
  it('counts the valid usernames and e-mails of a parsed list', () => {
    const parsed = parseTargetCsv('target\nalice\nbob@example.com\n', { deduplicate: true }).items;
    const summary = summarizeParsedTargets(parsed);
    expect(summary.validTargets.map((t) => t.target)).toEqual(['alice', 'bob@example.com']);
    expect(summary).toMatchObject({ usernameCount: 1, emailCount: 1 });
    expect(summarizeParsedTargets([])).toEqual({ validTargets: [], usernameCount: 0, emailCount: 0 });
  });
});
