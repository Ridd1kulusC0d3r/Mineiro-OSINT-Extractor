import express, { type Express } from 'express';
import { apiNotFound, errorHandler } from './errors';
import { copilotRouter } from './routes/copilot';
import { emailRouter } from './routes/email';
import { extrasRouter } from './routes/extras';
import { geminiRouter } from './routes/gemini';
import { profileRouter } from './routes/profile';
import { registryRouter } from './routes/registry';
import { storeRouter } from './routes/store';
import { verifyRouter } from './routes/verify';
import { PUBLIC_MODE, rateLimit, securityHeaders } from './security/middleware';

/**
 * Builds the Express app: middleware, rate limits and every /api router. No listen, no Vite, no static files:
 * server.ts adds those after it, so an unknown /api path never reaches the SPA fallback. Each call gets its own rate-limit buckets, so tests can start isolated instances.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', process.env.MINEIRO_TRUST_PROXY === '1');
  app.use(securityHeaders);
  app.use(express.json({ limit: '2mb' }));
  app.use('/api/osint/verify', rateLimit({ perMinute: PUBLIC_MODE ? 120 : 6000, burst: PUBLIC_MODE ? 40 : 600, name: 'verify' }));
  app.use(['/api/intelligence', '/api/osint/gemini-validate', '/api/osint/email-recon', '/api/osint/profile'], rateLimit({ perMinute: PUBLIC_MODE ? 10 : 60, name: 'ai' }));
  app.use(['/api/osint/wayback', '/api/osint/avatar-hash', '/api/osint/br', '/api/osint/pivots', '/api/osint/variants'], rateLimit({ perMinute: PUBLIC_MODE ? 20 : 300, name: 'extras' }));
  app.use(verifyRouter());
  app.use(extrasRouter());
  app.use(storeRouter());
  app.use(copilotRouter());
  app.use(registryRouter());
  app.use(emailRouter());
  app.use(geminiRouter());
  app.use(profileRouter());
  app.use('/api', apiNotFound);
  app.use(errorHandler);

  return app;
}
