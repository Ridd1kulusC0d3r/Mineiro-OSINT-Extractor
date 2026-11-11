// Interprets the local server's reply to POST /api/osint/verify.
// A refusal from Mineiro itself (400 invalid request, 429 local rate limit...) carries no `status`;
// it must never be read as "the site has no such account".

export type VerifyStatus = 'found' | 'not_found' | 'uncertain' | 'rate_limited' | 'error';

export interface VerifyOutcome {
  status: VerifyStatus;
  statusCode?: number;
  uncertainReason?: string;
}

const KNOWN: VerifyStatus[] = ['found', 'not_found', 'uncertain', 'rate_limited', 'error'];

export function readVerifyOutcome(httpOk: boolean, httpStatus: number, data: any): VerifyOutcome {
  const status = data?.status;
  if (httpOk && typeof status === 'string' && (KNOWN as string[]).includes(status)) {
    return { status: status as VerifyStatus, statusCode: data.statusCode, uncertainReason: data.uncertainReason };
  }
  const reason = typeof data?.error === 'string' && data.error
    ? `Local server refused the probe: ${data.error}`
    : `Unexpected reply from the local server (HTTP ${httpStatus})`;
  return { status: 'error', statusCode: 0, uncertainReason: reason };
}
