// Every /api route the browser client calls, one typed function each. Nothing else in src/ calls fetch('/api/...').
//
// Errors: a function either resolves with the route's 200 reply or throws an ApiError (src/api/errors.ts) carrying the
// HTTP status (0 when no response arrived), the server's own message when the JSON body has one, whether it was a
// network failure, and whether the caller aborted it. Every function accepts an AbortSignal.
//
// `createApiClient` takes the fetch implementation and a base URL, so the same functions can run outside the browser
// (a test, or later a server-side worker calling another Mineiro instance).
import { ApiError, serverMessageOf } from './errors';
import type {
  CopilotRequest,
  CopilotResponse,
  CopilotStatusResponse,
  EmailReconData,
  EmailReconRequest,
  GeminiValidateRequest,
  GeminiValidateResponse,
  HealthResponse,
  VerifyRequest,
  VerifyResponse,
} from './types';

export { ApiError, isApiError } from './errors';
export type * from './types';

export interface CallOptions {
  signal?: AbortSignal;
}

/** Calls that can carry the personal Gemini key the user saved in AI settings. */
export interface GeminiCallOptions extends CallOptions {
  geminiKey?: string;
}

export interface ApiClientConfig {
  /** Prefix for every path; '' (same origin) in the browser. */
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface RequestSpec {
  method: 'GET' | 'POST';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** A 200 whose body is not JSON resolves with {} instead of throwing (the verify route's historical contract). */
  lenientJson?: boolean;
}

const geminiHeader = (key?: string): Record<string, string> => (key ? { 'x-gemini-api-key': key } : {});

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? '';
  const doFetch = (input: string, init: RequestInit) => (config.fetch ?? globalThis.fetch)(input, init);

  async function request<T>(spec: RequestSpec): Promise<T> {
    const headers: Record<string, string> = { ...(spec.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...spec.headers };
    let response: Response;
    try {
      response = await doFetch(`${baseUrl}${spec.path}`, {
        method: spec.method,
        headers: Object.keys(headers).length ? headers : undefined,
        body: spec.body !== undefined ? JSON.stringify(spec.body) : undefined,
        signal: spec.signal,
      });
    } catch (error) {
      const aborted = Boolean(spec.signal?.aborted) || (error as { name?: string })?.name === 'AbortError';
      const message = error instanceof Error && error.message ? error.message : aborted ? 'Request aborted' : 'Network request failed';
      throw new ApiError({ status: 0, message, network: !aborted, aborted, cause: error });
    }

    let body: unknown;
    let parsed = false;
    try {
      const text = await response.text();
      body = JSON.parse(text);
      parsed = true;
    } catch {
      body = undefined;
    }

    if (!response.ok) {
      const serverMessage = serverMessageOf(body);
      throw new ApiError({
        status: response.status,
        message: serverMessage ?? `HTTP ${response.status} from ${spec.path}`,
        body,
        serverMessage,
      });
    }
    if (!parsed) {
      if (spec.lenientJson) return {} as T;
      throw new ApiError({ status: response.status, message: `Invalid JSON reply from ${spec.path}` });
    }
    return body as T;
  }

  return {
    /** GET /api/health */
    health: (options: CallOptions = {}) =>
      request<HealthResponse>({ method: 'GET', path: '/api/health', signal: options.signal }),

    /**
     * POST /api/osint/verify. A refusal from the local server (400 invalid request, 429 local rate limit) is an
     * ApiError whose `body` is the JSON reply; src/core/verifyOutcome.ts turns it into an `error` result.
     */
    verify: (body: VerifyRequest, options: CallOptions = {}) =>
      request<VerifyResponse>({ method: 'POST', path: '/api/osint/verify', body, signal: options.signal, lenientJson: true }),

    /** POST /api/osint/email-recon */
    emailRecon: (body: EmailReconRequest, options: CallOptions = {}) =>
      request<EmailReconData>({ method: 'POST', path: '/api/osint/email-recon', body, signal: options.signal }),

    /** POST /api/osint/gemini-validate. A key that fails the test is an ApiError (400) with the provider's message. */
    validateGemini: (body: GeminiValidateRequest, options: CallOptions = {}) =>
      request<GeminiValidateResponse>({ method: 'POST', path: '/api/osint/gemini-validate', body, signal: options.signal }),

    /** GET /api/intelligence/copilot/status */
    copilotStatus: (options: GeminiCallOptions = {}) =>
      request<CopilotStatusResponse>({
        method: 'GET', path: '/api/intelligence/copilot/status', headers: geminiHeader(options.geminiKey), signal: options.signal,
      }),

    /** POST /api/intelligence/copilot */
    copilot: (body: CopilotRequest, options: GeminiCallOptions = {}) =>
      request<CopilotResponse>({
        method: 'POST', path: '/api/intelligence/copilot', body, headers: geminiHeader(options.geminiKey), signal: options.signal,
      }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** The browser client: same origin, global fetch. */
export const api: ApiClient = createApiClient();
