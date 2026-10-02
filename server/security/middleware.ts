import type { NextFunction, Request, Response } from 'express';

/** Minimal security headers (no extra dependency). The UI is served same-origin only. */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

interface Bucket { tokens: number; updatedAt: number }

/**
 * Token-bucket rate limiter keyed by client IP.
 * `perMinute` is the sustained rate; `burst` is the bucket size.
 */
export function rateLimit(options: { perMinute: number; burst?: number; name?: string }) {
  const burst = options.burst ?? options.perMinute;
  const refillPerMs = options.perMinute / 60_000;
  const buckets = new Map<string, Bucket>();

  setInterval(() => {
    const cutoff = Date.now() - 10 * 60_000;
    for (const [key, bucket] of buckets) if (bucket.updatedAt < cutoff) buckets.delete(key);
  }, 60_000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key) || { tokens: burst, updatedAt: now };
    bucket.tokens = Math.min(burst, bucket.tokens + (now - bucket.updatedAt) * refillPerMs);
    bucket.updatedAt = now;

    if (bucket.tokens < 1) {
      buckets.set(key, bucket);
      res.setHeader('Retry-After', String(Math.ceil((1 - bucket.tokens) / refillPerMs / 1000)));
      return res.status(429).json({ error: 'Rate limit exceeded', limit: options.name || 'default' });
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    next();
  };
}

/**
 * Public-instance mode (MINEIRO_PUBLIC=1): disables server-held secrets and deep features
 * so a shared deployment cannot be used as an open scanner.
 */
export const PUBLIC_MODE = process.env.MINEIRO_PUBLIC === '1';
