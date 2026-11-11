import type { NextFunction, Request, Response } from 'express';

/** Any /api path no router answered: JSON 404 instead of falling through to the SPA's index.html. */
export function apiNotFound(req: Request, res: Response) {
  res.status(404).json({ error: 'Unknown API route', method: req.method, path: req.originalUrl.split('?')[0] });
}
