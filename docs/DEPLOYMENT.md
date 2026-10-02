# Deployment

Mineiro has three supported operating profiles.

## 1. Google Colab — demo and lab

Use the official notebook when you want:

- zero local installation;
- workshops and demonstrations;
- short-lived testing;
- reproducing a known environment.

Colab is intentionally **not** the recommended persistent production runtime. The VM is ephemeral and the proxy hostname changes between sessions.

## 2. Docker — recommended persistent local/server deployment

Build:

~~~bash
docker build -t mineiro-username-intelligence:1.7.0 .
~~~

Run:

~~~bash
docker run --rm \
  -p 3000:3000 \
  -e GEMINI_API_KEY="\${GEMINI_API_KEY:-}" \
  mineiro-username-intelligence:1.7.0
~~~

Health:

~~~text
GET /api/health
~~~

The production image:

- builds with Node.js 22;
- uses npm ci for reproducibility;
- installs only production dependencies in the runtime image;
- runs as the non-root node user;
- exposes an HTTP healthcheck.

Docker Compose remains available through docker-compose.yml.

## 3. Managed container platform — recommended public URL

The application is a good fit for a managed container platform because the Express backend itself is stateless.

Recommended deployment shape:

~~~text
GitHub
   ↓
CI
   ↓
Docker image
   ↓
Managed container
   ├── HTTPS
   ├── /api/health
   └── optional GEMINI_API_KEY
~~~

Suitable categories include:

- Cloud Run;
- Render;
- Railway;
- Fly.io;
- a small VPS running Docker Compose.

Platform choice is operational, not architectural. Mineiro does not require a server-side database for v1.6.

## Case persistence and deployment

Case Graph persistence is local-first.

~~~text
Browser
  └── IndexedDB
       ├── Cases
       ├── collection snapshots
       ├── pivot investigations
       └── Diff Intelligence history
~~~

This means:

- redeploying the server does not erase a user's browser Cases;
- multiple server instances can run without sharing a database;
- Cases stay isolated to the browser profile where they were created.

Clearing browser site data or using another browser/device does **not** automatically transfer Cases.

A future Case Bundle export/import is the appropriate way to move investigations between machines without making a central database mandatory.

## Environment variables

### MINEIRO_PUBLIC

Set to `1` for any shared or public deployment: stricter rate limits, server Gemini key ignored, SQLite store and avatar hashing disabled.

### MINEIRO_DB

Path of the SQLite file (default `data/mineiro.sqlite`). Mount a volume on `/app/data` in containers.

### MINEIRO_TRUST_PROXY

Set to `1` behind a reverse proxy so rate limiting uses the real client IP.

### MINEIRO_HOST_CONCURRENCY / MINEIRO_CACHE_TTL_MS

Per-host concurrent probe cap (default 4) and verify-result cache TTL (default 300000 ms).

### PORT

HTTP port. Defaults to 3000.

### GEMINI_API_KEY

Optional server-side Gemini key. The deterministic evidence and assessment pipeline works without AI.

Do not commit API keys to GitHub or bake them into container images.

## Reverse proxy

If deploying behind Nginx, Caddy, a load balancer, or a managed HTTPS proxy:

- forward normal HTTP traffic to port 3000;
- preserve request method/body for /api/*;
- do not cache dynamic API responses;
- cache immutable frontend assets according to their generated hashes.

## GitHub Pages

GitHub Pages is suitable for documentation, but **not** for the primary Mineiro runtime.

The product includes:

- Express API routes;
- public endpoint verification;
- Gemini proxy calls;
- health endpoints.

Those require a server process.

## Production checklist

~~~bash
npm ci --no-audit --no-fund
npm run check
npm run build
docker build -t mineiro-username-intelligence:1.7.0 .
~~~

Then verify:

~~~text
/api/health
UI load
Quick synthetic/manual test
Case persistence after browser reload
Diff after two snapshots of the same target
~~~
