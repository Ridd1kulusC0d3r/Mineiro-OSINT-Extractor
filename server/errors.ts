import { STATUS_CODES } from 'node:http';
import type { NextFunction, Request, Response } from 'express';

const STATUS_TEXT = STATUS_CODES as Record<number, string | undefined>;

/** Any /api path no router answered: JSON 404 instead of falling through to the SPA's index.html. */
export function apiNotFound(req: Request, res: Response) {
  res.status(404).json({ error: 'Unknown API route', method: req.method, path: req.originalUrl.split('?')[0] });
}

/**
 * For POST routes that read fields from the body. Without a JSON body (no body, or another content type) Express 5
 * leaves req.body undefined and reading a field from it throws, which used to end as a generic 500.
 */
export function requireJsonBody(req: Request, res: Response, next: NextFunction) {
  if (req.body === null || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'JSON body required (Content-Type: application/json)' });
  }
  return next();
}

interface HttpError extends Error { status?: number; statusCode?: number; type?: string; expose?: boolean }

const BODY_ERRORS: Record<string, string> = {
  'entity.parse.failed': 'Malformed JSON body',
  'entity.too.large': 'Request body too large',
};

/**
 * Last error handler. Client errors raised by the body parser get a fixed JSON message; anything else is a 500
 * with a generic message. The error itself (message, stack) is only logged, never sent to the client.
 */
export function errorHandler(err: HttpError, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);
  const status = Number(err?.status ?? err?.statusCode);
  if (status >= 400 && status < 500) {
    return res.status(status).json({ error: BODY_ERRORS[err.type ?? ''] ?? (STATUS_TEXT[status] || 'Bad request') });
  }
  console.error(`[error] ${req.method} ${req.originalUrl.split('?')[0]}:`, err);
  return res.status(500).json({ error: 'Internal server error' });
}
