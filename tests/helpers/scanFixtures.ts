// Small builders for ScanResult / EmailReconData used by the component logic tests.
import type { EmailReconData, ScanResult } from '../../src/types';

export function result(overrides: Partial<ScanResult> & Pick<ScanResult, 'platformId'>): ScanResult {
  return {
    id: overrides.platformId,
    platformName: overrides.platformId,
    category: 'social',
    url: `https://example.test/${overrides.platformId}`,
    status: 'found',
    ...overrides,
  };
}

export function email(overrides: Partial<EmailReconData> = {}): EmailReconData {
  return {
    email: 'analyst@proton.me',
    username: 'analyst',
    domain: 'proton.me',
    isValidSyntax: true,
    isDisposable: false,
    isCommonProvider: true,
    mxRecordsFound: true,
    mxServers: [],
    gravatarExists: false,
    hash: '0',
    associatedFootprint: [],
    ...overrides,
  };
}
