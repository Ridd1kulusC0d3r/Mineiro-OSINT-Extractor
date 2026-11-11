import 'dotenv/config';
import express from 'express';
import path from 'path';
import { verifyRouter } from './server/routes/verify';
import { extrasRouter } from './server/routes/extras';
import { storeRouter } from './server/routes/store';
import { registryRouter } from './server/routes/registry';
import { emailRouter } from './server/routes/email';
import { geminiRouter } from './server/routes/gemini';
import { copilotRouter } from './server/routes/copilot';
import { profileRouter } from './server/routes/profile';
import { PUBLIC_MODE, rateLimit, securityHeaders } from './server/security/middleware';


const TERMINAL_BANNER = `\n+------------------------------------------------------------------+\n|                                                                  |\n|   M   M  I  N   N  EEEEE  I  RRRR    OOO                       |\n|   MM MM  I  NN  N  E      I  R   R  O   O                      |\n|   M M M  I  N N N  EEEE   I  RRRR   O   O                      |\n|   M   M  I  N  NN  E      I  R  R   O   O                      |\n|   M   M  I  N   N  EEEEE  I  R   R   OOO                       |\n|                                                                  |\n|                USERNAME INTELLIGENCE // OSINT                       |\n|                                                                  |\n|   [ probe ] -> [ classify ] -> [ correlate ] -> [ export ]      |\n|                                                                  |\n|   public signals only  |  evidence over assumptions              |\n+------------------------------------------------------------------+\n`;
const app = express();
const PORT = Number(process.env.PORT || 3000);
// Containers need 0.0.0.0; the pip launcher sets HOST=127.0.0.1 so a local install is not exposed to the LAN.
const HOST = process.env.HOST || '0.0.0.0';


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

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      // Loaded lazily so the production bundle (and the pip package) does not need Vite.
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, HOST, () => {
      console.log('\n' + TERMINAL_BANNER + '\n');
      console.log(`[ready] http://${HOST}:${PORT}`);
      console.log('[mode] local-first OSINT probes | persistent cases | diff intelligence | v1.7.0');
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use.`);
      } else {
        console.error('[Server Error] Unhandled server error:', err);
      }
    });
  } catch (err) {
    console.error('[Server Startup Error] Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();

