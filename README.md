# Mineiro Username Intelligence

<p align="center">
  <img src="assets/mineiro-logo.png" alt="Mineiro" width="200">
</p>

<p align="center"><strong>OSINT Investigation Workbench</strong> for public username presence: evidence first, cautious correlation, auditable reports.</p>

<p align="center">
  <a href="https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Version" src="https://img.shields.io/badge/version-1.7.0-111111">
  <img alt="Node" src="https://img.shields.io/badge/node-22%2B-111111">
  <img alt="License" src="https://img.shields.io/badge/code-MIT-111111">
</p>

<p align="center">
  <a href="https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb"><strong>▶ Open in Google Colab</strong></a>
  &nbsp;·&nbsp;
  <a href="#quick-start">Install</a>
  &nbsp;·&nbsp;
  <a href="docs/USER-GUIDE.md">User guide</a>
  &nbsp;·&nbsp;
  <a href="docs/README.md">Docs</a>
  &nbsp;·&nbsp;
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/demo.gif" alt="Mineiro scanning a public handle across 49 platforms, with live progress, evidence-based verdicts and the correlation graph" width="860">
</p>

<p align="center"><sub>A Standard scan of a public open-source handle: live progress, per-platform verdicts (found / absent / uncertain), the Evidence Engine, and the correlation graph.</sub></p>

---

## What it is

Mineiro checks public surfaces associated with an identifier (a username or e-mail) and turns raw technical responses into a structured assessment.

It keeps apart four things that username tools usually blur together:

```text
collection  →  evidence  →  correlation  →  assessment
```

A `FOUND` is an observation. It is **not** proof of identity.

### What you get

- A registry of **985 cataloged detectors** (984 scannable) with provenance and reliability metadata;
- Quick, Standard and Full scan presets;
- An Evidence Engine with several signals per response, plus a **differential baseline** that probes a handle that cannot exist and discards "200 OK" pages that look the same (soft-404s);
- Detector Reliability and Source Quality kept separate from per-observation confidence;
- Clusters of public footprint, a correlation graph with provenance, primary and alternative hypotheses, contradictory evidence and gaps;
- HTML, JSON, Markdown, CSV and **STIX 2.1** exports, each with a SHA-256 manifest;
- Declarative detectors (`registry/detectors/*.json`) with canary handles and a weekly health check;
- A local SQLite store (Entity → Observation → Claim) where every claim must cite observations;
- An optional AI Analyst Copilot, always labeled `AI_SYNTHESIZED` and unable to raise factual confidence.

## Quick start

### Option 1 — pip

```bash
pip install mineiro-osint     # not on PyPI yet? see "Install from a release" below
mineiro                       # opens http://127.0.0.1:3000
```

The package ships the full app (~1.3 MB). It uses your Node.js (>= 22.5) if present; otherwise it installs its own through `nodejs-wheel-binaries`, so there is nothing else to set up. It binds to `127.0.0.1` and stores data in `~/.mineiro`. Run `mineiro --check` for diagnostics.

**Install from a release** (before the first PyPI publication):

```bash
pip install https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/releases/download/v1.7.0/mineiro_osint-1.7.0-py3-none-any.whl
```

### Option 2 — Google Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb)

The official notebook clones the repo, installs dependencies, validates the registry, starts the server and opens the UI through the Colab proxy. Nothing to install locally.

### Option 3 — from source

Requires **Node.js 22+**.

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm ci --no-audit --no-fund
npm run dev
```

Open `http://localhost:3000`. A guided setup is in [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md), and Docker instructions are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

> The in-depth documentation under `docs/` is currently in Portuguese. This README and the CHANGELOG are the English entry points.

## Investigation flow

```text
Intelligence Requirement → Progressive Collection → Evidence → Correlation
        → Hypotheses → Contradictions → Assessment → Pivots → Collection Plan
```

The requirement you choose changes which findings are relevant, not the observed facts. Available requirements: username presence, public account correlation, digital footprint mapping, developer footprint, threat-research alias mapping, brand impersonation monitoring.

## Scan modes

| Mode | Scope | Evidence Engine | Use for |
|---|---:|---:|---|
| Quick | Top 20 | no | fast checks and development |
| Standard | Top 50 | yes (with differential baseline) | normal investigations |
| Full | Whole scannable registry | progressive | broad coverage |

Full scan runs in two phases: fast discovery first, then deeper checks only on candidates that were found, uncertain or rate-limited. Protected endpoints stay inconclusive. Mineiro does not try to defeat CAPTCHAs or access controls.

## Reading a result

Do not use one score to answer different questions.

| Field | Answers |
|---|---|
| Detector Reliability | Is this site's rule usually dependable? |
| Observation Confidence | Was *this* query conclusive? |
| Correlation Confidence | Do the findings support a relation between accounts? |
| Source Quality | How strong is the public source observed? |
| IPS | Is this finding worth reviewing before the others? |

Full model: [docs/INTELLIGENCE-METHODOLOGY.md](docs/INTELLIGENCE-METHODOLOGY.md).

## What's new in 1.7

- **Safer probing.** The server only probes URLs a registry detector can produce, resolves DNS through a guard that blocks private, loopback, link-local and cloud-metadata ranges (rebinding-safe), and re-validates every redirect hop. Rate limits, security headers and a `MINEIRO_PUBLIC=1` mode for shared deployments.
- **Fewer false positives.** Differential baseline (target vs. a random non-existent handle) and declarative detectors with canaries.
- **Auditable evidence.** Every result carries `evidenceHash` (SHA-256), `collectedAt` and `detectorVersion`.
- **Interoperable.** STIX 2.1 export; SQLite store with Entity → Observation → Claim.
- **More OSINT.** Username variants with Jaro-Winkler similarity, pivot extraction with depth/budget limits, avatar perceptual hash, Wayback Machine timeline, Brazilian CNPJ lookup (company-level fields only).
- **`pip install`** and a reproducible, locked build.

See the [CHANGELOG](CHANGELOG.md) for details.

## Graph hunting, cases and diffs

- Similar usernames appear as candidate nodes and can be scanned straight from the graph; pivot scans run in the background and feed the same graph.
- Read-only local graph queries (`MATCH candidate=true AND similarity>=70`, `SHARED type=DOMAIN`, `PATH from=TARGET to=PROFILE`), with optional Neo4j/Cypher export. Guide: [docs/GRAPH-HUNTING.md](docs/GRAPH-HUNTING.md).
- Long-lived Cases (browser IndexedDB) with immutable snapshots and a Diff Intelligence view (`NEW`, `DISAPPEARED`, `CHANGED`, `UNCHANGED`, `CONFIDENCE_UP`, `CONFIDENCE_DOWN`). `DISAPPEARED` is a difference between collections, **not** proof that an account was deleted.

## Architecture

```text
React UI ── Intelligence Report · Evidence Audit · Registry · AI Analyst Copilot
   │
Express API ── verify (guarded fetch) · extras (variants, pivots, avatar, Wayback, CNPJ) · store (SQLite, STIX)
   │              └─ src/core: evidence · baseline · matchers · net · stix  (pure, unit-tested)
Public endpoints
```

Details: [ARCHITECTURE.md](ARCHITECTURE.md).

## Development

```bash
npm ci --no-audit --no-fund
npm test          # Vitest: evidence, baseline, SSRF guard, store
npm run check     # the full CI gate
npm run build:python   # stage the app inside the pip package
npm run detectors:health   # live canary check of declarative detectors
```

Contributing: [CONTRIBUTING.md](CONTRIBUTING.md). Security policy: [SECURITY.md](SECURITY.md).

## Principles

1. **Observation is not identity.**
2. **Inconclusive stays inconclusive.**
3. **Provenance must survive all the way to the report.**
4. **Contradictions deserve the same visibility as supporting evidence.**
5. **AI summarizes and prioritizes; it does not fabricate factual confidence.**
6. **Collecting more is not automatically investigating better.**

## Responsible use

Use only publicly accessible information, for a legitimate and authorized purpose. Respect applicable terms, rate limits, privacy and the law (including LGPD/GDPR).

The project provides no mechanism to bypass authentication, CAPTCHAs or access controls, and it does not score people.

## License and provenance

Original Mineiro code is MIT. The historical catalog has entries still under provenance audit; read [LICENSES_AND_PROVENANCE.md](LICENSES_AND_PROVENANCE.md) before reusing the dataset outside this project.

---

**Mineiro Username Intelligence v1.7.0** · OSINT Investigation Workbench · evidence first · local reporting
