// Pure computation of the batch import modal. No React, no DOM. Tested in tests/bulkImport.logic.test.ts.
import type { ParsedTarget } from '../../utils/csvParser';

/** Valid targets of a parsed list and how many are usernames and e-mails. */
export function summarizeParsedTargets(parsedTargets: ParsedTarget[]): {
  validTargets: ParsedTarget[];
  usernameCount: number;
  emailCount: number;
} {
  const validTargets = parsedTargets.filter((t) => t.isValid);
  const usernameCount = validTargets.filter((t) => t.type === 'username').length;
  const emailCount = validTargets.filter((t) => t.type === 'email').length;
  return { validTargets, usernameCount, emailCount };
}
