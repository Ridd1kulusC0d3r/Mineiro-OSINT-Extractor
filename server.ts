import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createApp } from './server/app';
import { listenHost, listenPort } from './server/config';

const TERMINAL_BANNER = `\n+------------------------------------------------------------------+\n|                                                                  |\n|   M   M  I  N   N  EEEEE  I  RRRR    OOO                       |\n|   MM MM  I  NN  N  E      I  R   R  O   O                      |\n|   M M M  I  N N N  EEEE   I  RRRR   O   O                      |\n|   M   M  I  N  NN  E      I  R  R   O   O                      |\n|   M   M  I  N   N  EEEEE  I  R   R   OOO                       |\n|                                                                  |\n|                USERNAME INTELLIGENCE // OSINT                       |\n|                                                                  |\n|   [ probe ] -> [ classify ] -> [ correlate ] -> [ export ]      |\n|                                                                  |\n|   public signals only  |  evidence over assumptions              |\n+------------------------------------------------------------------+\n`;
const app = createApp();
const PORT = listenPort();
const HOST = listenHost(); // 127.0.0.1 unless HOST is set (containers set 0.0.0.0)

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
