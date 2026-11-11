// The one error type every /api call in src/api/client.ts throws. Pure TypeScript (no React, no DOM), so the scan
// engine can recognise a refusal from the local server without depending on the browser client.

export interface ApiErrorInit {
  /** HTTP status; 0 when no response arrived (network failure or cancellation). */
  status: number;
  message: string;
  /** True when the request never got an HTTP response (offline, connection refused, DNS, CORS...). */
  network?: boolean;
  /** True when the caller cancelled the request through its AbortSignal. */
  aborted?: boolean;
  /** Parsed JSON body of an error response, when there was one. */
  body?: unknown;
  /** The server's own explanation (`error`, then `message` in the JSON body), when it gave one. */
  serverMessage?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly network: boolean;
  readonly aborted: boolean;
  readonly body: unknown;
  readonly serverMessage?: string;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.network = Boolean(init.network);
    this.aborted = Boolean(init.aborted);
    this.body = init.body;
    this.serverMessage = init.serverMessage;
    if (init.cause !== undefined) (this as { cause?: unknown }).cause = init.cause;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** `error`, then `message`, from a JSON error body; undefined when neither is a non-empty string. */
export function serverMessageOf(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error) return record.error;
  if (typeof record.message === 'string' && record.message) return record.message;
  return undefined;
}
