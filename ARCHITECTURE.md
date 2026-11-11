# Architecture

## Objective
Mineiro separates discovery, evidence evaluation and analyst interpretation.

```text
Target -> Catalog -> Probe Scheduler -> HTTP Response -> Evidence Engine
                                             |              |
                                             |              +-> confidence
                                             +-> category profile / export
```

## Catalog model
v1.2 retains **985 historical endpoints**. Every runtime platform receives:

- `category`
- `siteType`
- `detectorReliability`
- `reliabilityTier`
- `provenanceStatus`
- `licenseStatus`
- `optionalEvidenceChecks`

Historical entries remain available for coverage while provenance is progressively audited.

## Evidence Engine
A single HTTP response can yield up to eight logical checks:

| Check | Purpose | Extra request |
|---|---|---:|
| Expected status | presence behavior | 0 |
| Absence status | explicit negative evidence | 0 |
| Redirect consistency | detect generic redirects | 0 |
| Username in final URL | routing continuity | 0 |
| Username in body | response token | 0 |
| Canonical match | canonical consistency | 0 |
| Soft-404 | detect generic error pages | 0 |
| Edge protection | classify WAF/rate limiting | 0 |

With 985 endpoints:

```text
985 x 8 = 7,880 optional evidence checks
```

This does not mean 7,880 extra network requests.

## Two different scores

### Detector reliability
A maintained estimate of how dependable the site's detection rule is.

### Result confidence
Evidence observed during the current scan.

Example:

```text
detector reliability = 91
result confidence     = 84
evidence              = probable
```

## Digital footprint classification
Found endpoints contribute to observable service clusters. The dashboard aggregates approximately:

```text
result confidence x detector reliability
```

This classifies the **observed digital footprint**, not personality, profession, ideology or identity.

## Growth model
New catalog packs should declare source, license, attribution, verification date and maintainer. Large untracked copy/paste imports should not be merged.


## v1.3 Registry Layer

```text
catalog packs
    |
    v
Mineiro Registry
    |
    +--> taxonomy
    +--> detector reliability
    +--> provenance
    +--> license status
    +--> evidence capabilities
    |
    +--> Registry API
    |
    +--> Detector Bench
            |
            +--> TP / TN / FP / FN
            +--> precision
            +--> recall
            +--> false-positive rate
            +--> availability
            +--> benchmark score
```

### API

- `GET /api/registry/stats`
- `GET /api/registry/detectors`
- `POST /api/registry/benchmark`

O benchmark recebe observações rotuladas e calcula métricas localmente. Não precisa armazenar usernames reais.

### Colab

A mesma aplicação Node/React roda em Google Colab. O notebook oficial instala dependências, valida o Registry, inicia o servidor e usa o proxy do Colab para abrir a interface.


## v1.4 Intelligence Workbench

```text
Target
  |
  v
Progressive Collection
  |
  v
Normalized ScanResult
  |
  +--> Evidence Engine
  |       |
  |       +--> detector confidence
  |       +--> observation confidence
  |
  v
Intelligence Assessment
  |
  +--> correlation support
  +--> key judgments
  +--> hypotheses
  +--> contradictions
  +--> gaps
  +--> pivots
  +--> collection plan
  |
  +--> Local Report Export
  |
  +--> Optional AI Analyst Copilot
          |
          +--> AI_SYNTHESIZED
          +--> never raises factual confidence
```

### Progressive scan

A full scan usa uma fase rápida de discovery com concorrência limitada maior. Apenas candidatos encontrados, incertos ou rate-limited seguem para validação aprofundada com Evidence Engine.

A fase progressiva não usa retry para contornar proteção. Endpoints protegidos permanecem inconclusivos.

### Presentation architecture

```text
IntelligenceReportView
├── executive assessment
├── collection health
├── evidence matrix
├── hypotheses / contradictions
├── pivots
├── gaps
├── AI analyst
└── methodology

IntelligenceExportModal
├── section selector
├── HTML
├── JSON
├── Markdown
└── CSV
```

Documentação detalhada:
- `docs/ENGINEERING-V1.4.md`
- `docs/INTELLIGENCE-METHODOLOGY.md`
- `docs/REPORTING-UX-V1.4.md`


## v1.4.1 Complete Intelligence Layer

```text
INTELLIGENCE REQUIREMENT
          |
          v
COLLECTION
          |
          v
NORMALIZED EVIDENCE
          |
          +--> Detector Confidence
          +--> Observation Confidence
          +--> Source Quality
          +--> Provenance
          |
          v
CORRELATION
          |
          +--> Correlation Graph
          +--> SAME_DOMAIN / SAME_HANDLE
          +--> Cross-cluster overlap
          |
          v
HYPOTHESES
          |
          +--> Primary
          +--> Cluster hypothesis
          +--> Alternative hypothesis
          |
          v
CONTRADICTIONS
          |
          v
ASSESSMENT
          |
          +--> KIJ
          +--> Analytic Ledger
          +--> Known / Assessed / Unknown
          |
          v
PIVOTS + COLLECTION PLAN
          |
          v
REPORT + SHA-256 EXPORT MANIFEST
```

### Requirement-aware analysis

O `IntelligenceRequirement` altera o peso de relevância do finding sem alterar o fato observado. O mesmo hit pode ter maior valor para `developer_footprint` e menor valor para `brand_impersonation`.

### Graph model

Node types:

```text
TARGET
USERNAME
EMAIL
PROFILE
PLATFORM
DOMAIN
PUBLIC_URL
DISPLAY_NAME
ORGANIZATION
PUBLIC_PROJECT
AVATAR_HASH
```

Edge types:

```text
USES
LINKS_TO
MENTIONS
HOSTED_ON
SAME_HANDLE
SAME_DOMAIN
REFERENCES
OBSERVED_ON
```

Toda aresta mantém `confidence`, `provenance`, `evidenceId` e, quando disponível, `sourceUrl` e `observedAt`.

### Provenance graph

```text
PRIMARY ──────> EVIDENCE ──────> DERIVED ASSESSMENT
EXTERNAL ─────> EVIDENCE ──────> DERIVED ASSESSMENT
AI_SYNTHESIZED ----------------> HYPOTHESIS ONLY
```

AI synthesis nunca altera automaticamente confidence factual.

### Integrity

O export calcula SHA-256 real sobre o payload antes da inserção do manifest. Cada formato gera um arquivo `.manifest.json` companheiro.

O hash é uma verificação de integridade do conteúdo, não assinatura de autoria nem cadeia de custódia legal.


## v1.7 Core, Safety and Data Layer

```text
Browser UI ──> Express (rate limit, headers)
                 ├─ routes/verify  ── detector-bound URL ── safeFetch (guarded DNS, manual redirects)
                 │        ├─ core/evidence   8 logical checks
                 │        ├─ core/baseline   target vs. random-handle control (soft-404 killer)
                 │        └─ core/matchers   registry/detectors/*.json (declarative rules + canaries)
                 ├─ routes/extras  variants · pivots · avatar dHash · Wayback CDX · CNPJ
                 └─ routes/store   SQLite: Entity -> Observation(evidence_hash) -> Claim(cites observations)
                                   └─ STIX 2.1 export
```

Design rules:

- `src/core/*` is pure (no Express, no filesystem) and covered by Vitest fixtures.
- The server never probes a URL the client invented: the URL must match the detector's `urlPattern`, and the resolved IP must be public at connect time.
- An observation is a fact with a hash; a claim is an inference and must cite observations.
- `MINEIRO_PUBLIC=1` removes everything that would let a shared instance act as an open scanner or a database of lookups.

## Server layout

```text
server.ts                 bootstrap: env, banner, Vite (dev) or dist/ + SPA fallback (production), listen
server/
  app.ts                  createApp(): headers, JSON body (2 MB), rate limits, routers, /api 404, error handler
  config.ts               listenHost() (HOST, default 127.0.0.1) and listenPort() (PORT, default 3000)
  version.ts              VERSION from package.json (health, User-Agent, banner)
  errors.ts               apiNotFound (JSON 404 for any unanswered /api path) and the final errorHandler
  routes/
    registry.ts           /api/health, /api/registry/{stats,detectors,benchmark}
    verify.ts             /api/osint/verify
    extras.ts             variants, pivots, avatar-hash, wayback, br/cnpj
    email.ts              /api/osint/email-recon
    gemini.ts             /api/osint/gemini-validate
    copilot.ts            /api/intelligence/copilot{,/status}
    profile.ts            /api/osint/profile (legacy, 410 unless MINEIRO_ENABLE_LEGACY_PROFILE=1)
    store.ts              /api/store/* (SQLite)
  services/gemini.ts      Gemini client, model list and fallback, JSON parsing, timeouts, profile passes
  security/               securityHeaders, rateLimit, PUBLIC_MODE; safeFetch (guarded DNS, manual redirects)
  db.ts, detectors.ts, hostLimiter.ts
```

- `createApp()` never listens and never touches Vite or `dist/`, so `tests/routes.test.ts` starts it on port 0 and
  calls it with `fetch`, with the outbound `undici` fetch and DNS stubbed. Each call has its own rate-limit buckets.
- Errors: body-parser errors become a fixed JSON 4xx (`Malformed JSON body`, `Request body too large`); anything
  unexpected becomes `500 {"error":"Internal server error"}`. Messages and stacks go to the server log only.
- Listening: `127.0.0.1` unless `HOST` is set. The Docker image and `docker-compose.yml` set `HOST=0.0.0.0`; the pip
  `mineiro` command passes its own `--host`.
- SSRF guard (`src/core/net.ts`, used by `safeFetch` before connecting and at DNS resolution): blocked IPv4 ranges are
  `0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.0.0/24`, `192.0.2/24`, `192.88.99/24`,
  `192.168/16`, `198.18/15`, `198.51.100/24`, `203.0.113/24` and `224/3` (multicast, reserved, broadcast). For IPv6 only
  global unicast `2000::/3` is allowed, minus `2001::/23`, `2001:db8::/32`, `2002::/16` and `3fff::/20`; IPv4-mapped
  addresses follow the IPv4 rule. Anything that does not parse as an IP literal is blocked.
- `npm run api:baseline -- --check` compares 33 normalized responses with `tests/fixtures/api-baseline/`.

## Client layout

```text
src/main.tsx              mounts <App/> inside the I18nProvider
src/app/
  App.tsx                 composition: calls the hooks, lays out Header, TargetBar, StatsBar, MainViews, AppModals, footer
  MainViews.tsx           the main canvas: one view at a time (report, evidence, platforms, correlation, AI, console, batch,
                          legacy dashboard); correlation, AI and the legacy dashboard load on first use
  AppModals.tsx           every overlay plus the hidden print layout; export, Gemini, cases and shortcuts load on first
                          open and then stay mounted
  shortcuts.ts            the one list of keyboard shortcuts: the key handler matches it, the shortcuts sheet renders it
  useAppShortcuts.ts      runs a shortcut action, from the keyboard or from a row of the sheet
  views.ts                AppView
src/hooks/
  useScan.ts              single-target workspace (target, results, e-mail recon), scan configuration, the engine wired to
                          the local server, graph pivots, opening saved work into the workspace
  useCases.ts             persistent cases (IndexedDB `mineiro_cases_v1`) and the last-5 cache (localStorage
                          `mineiro_cached_scans_v1`), integrity snapshots
  useSettings.ts          personal Gemini key and model (localStorage `mineiro_gemini_key`, `mineiro_gemini_model`)
  useBulkBatch.ts         the batch queue; never touches the single-scan workspace
  useModals.ts            which overlay is open; Esc closes them in a fixed order
  useScanLog.ts           console event stream; useResultFilters.ts: Evidence/Platforms filters
  useGlobalShortcuts.ts   keydown listener over src/app/shortcuts.ts
src/scan/
  engine.ts               runScan(job, deps): scope, chunked concurrency, two-phase full scan, progress/log callbacks,
                          stop/pause/skip. No React, DOM or storage.
  batch.ts                runBatch: the targets of a batch in sequence, with a pause/skip/abort control object
src/api/
  client.ts               one typed function per /api route; createApiClient({ baseUrl, fetch }) for non-browser callers
  errors.ts               ApiError: status (0 = no response), serverMessage, network, aborted, body
  types.ts                request/response shapes of those routes
src/components/           presentation only
  LazyFallback.tsx        placeholders and error boundary for lazily loaded views and dialogs
  WorldThreatMap/         one folder per large component; index.ts keeps the old import path:
    WorldThreatMap.tsx      state, effects and layout
    MapToolbar.tsx, ...     sections of the JSX
    worldThreatMap.logic.ts pure computation (tested in tests/worldThreatMap.logic.test.ts)
    worldThreatMap.render.ts  imperative D3 drawing, called from an effect
  NetworkRelationshipGraph/, RiskMatrix2x2/, CategoryHeatMap/   same layout (the legacy dashboard's D3 charts)
  DashboardView/          legacy dashboard (only the 1 shortcut opens it); dashboard.logic.ts
  ModularScanModal/, BulkImportModal/                            modularScan.logic.ts / bulkImport.logic.ts
src/core, data, registry, intelligence, graph, cases     pure domain (no React, no Express)
```

No file in `src/components` is above 500 lines. Fixed tables a component used to embed live in `src/data`
(`worldMapHosts.ts`, `categoryThreatWeights.ts`); purely presentational constants stay next to the component
(`CategoryHeatMap/dimensions.ts`, `ModularScanModal/presetCards.ts`).

Start-up bundle: views and dialogs that are not on screen at start-up are `React.lazy` chunks, and each D3 chart of
the legacy dashboard is its own chunk (the world map carries the atlas). `npm run build` lists the chunks; the
start-up JavaScript is the `index-*.js` entry plus the shared `jsx-runtime-*.js` it preloads. The production server
serves them from `dist/assets` with `express.static` (ETag, `max-age=0`); the pip package copies all of `dist/`.

Rules, enforced by `tests/boundaries.test.ts`:

- `src/core`, `data`, `registry`, `intelligence`, `graph`, `cases` and `scan` import neither `react`, `react-dom` nor
  `express`, nor anything from `src/components`, `src/hooks` or `src/app`.
- `src/components` imports nothing from `server/`.
- Inside `src/components`, `*.logic.ts` (pure computation) and `*.render.ts` (D3 drawing) import no React, UI kit
  (`lucide-react`, `motion`), component (`.tsx`), hook or app module; `*.logic.ts` also uses no DOM global. The
  theme modules they may import (`src/theme/palette.ts`, `tokens.ts`, `theme.ts`) stay React-free; the React hook
  `useThemeVersion` lives in `src/theme/useThemeVersion.ts`.
- Only `src/api/client.ts` calls `fetch('/api/...')`.

The scan engine takes its collaborators as parameters, so the same module can run where there is no browser:

```ts
runScan({ target, targetType, config }, {
  verify,           // (VerifyRequest, { signal }) => Promise<VerifyResponse>; throw ApiError for a server refusal
  emailRecon,       // optional: (email, { signal }) => Promise<EmailReconData>
  control,          // { signal, isPaused?, isSkipped?, announceAbort? }
  onProgress, onLog, onEmailLoading, onEmailData,
  now, random, sleep, resolveScope,   // defaults: Date.now, Math.random, setTimeout, the bundled catalog
}) // -> { results, emailData, foundCount, uncertainCount, totalScanned }
```

`tests/scan-engine.test.ts` drives it with a stubbed verifier: ordering and completeness, the concurrency ceiling,
cancellation, the two-phase path, refusals, transport errors and rate limits.
