/**
 * Listen address. Loopback by default so a source checkout (npm run dev / npm start) is not exposed to the LAN;
 * containers set HOST=0.0.0.0 (Dockerfile, docker-compose.yml) and the pip launcher passes its --host.
 */
export function listenHost(env: NodeJS.ProcessEnv = process.env): string {
  return env.HOST?.trim() || '127.0.0.1';
}

export function listenPort(env: NodeJS.ProcessEnv = process.env): number {
  return Number(env.PORT || 3000);
}
