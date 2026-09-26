# Changelog

## [1.4.0] - 2026-09-26

### Added
- Intelligence Report workspace with editorial UX inspired by professional intelligence products.
- Deterministic Intelligence Assessment layer.
- Key Intelligence Judgments, Collection Coverage, Evidence Matrix and Footprint Clusters.
- Explicit hypotheses, alternative hypothesis, contradictory evidence and Intelligence Gaps.
- Prioritized pivots, Next Collection Plan and Stop Condition.
- Selective local exports: enriched HTML, analytical JSON, Markdown and Evidence CSV.
- Optional evidence-bounded AI Analyst Copilot with `AI_SYNTHESIZED` provenance.
- Two-phase progressive full scan optimized for large Colab runs.
- Deterministic v1.4 intelligence smoke test.
- Software/data architecture and methodology documentation.

### Changed
- Intelligence report becomes the primary post-scan workspace.
- Audit filters are hidden in the report view to reduce visual density.
- Full scans use fast discovery before deeper candidate validation.
- Progressive validation respects protection boundaries and does not retry blocked endpoints.
- Package and server version bumped to 1.4.0.

### Notes
- Same username remains a lead, not identity proof.
- AI synthesis never raises factual confidence by itself.
- Legacy dashboard and detailed audit views remain available as drill-down surfaces.


## [1.3.2] - 2026-09-26

### Added
- One-click Google Colab notebook with Mineiro black-and-white visual identity.
- Offline self-contained `MANUAL.html` with 13 guided sections, OS tabs, inline diagrams, annotated illustrations, theme toggle and print mode.
- Two-click launchers for Windows, macOS and Linux.
- Synthetic Detector Bench demo with deterministic expected output.
- `COMECE-AQUI.md` for first-time users.
- `RELATORIO-DE-TESTES.md` with explicit executed/not-executed status.
- CI checks for documentation, demo and shell launcher syntax.

### Changed
- Package version bumped to 1.3.2.
- README now prioritizes beginner onboarding and Google Colab.


## [1.3.1] - 2026-09-26

### Fixed
- Google Colab proxy host is now explicitly allowed by Vite using `.codatalab-user-runtimes.internal`.
- Registry-only detectors no longer enter direct username scans.
- Discord is retained in the Registry without generating a placeholder validation warning.
- Registry stats now distinguish scannable and registry-only detectors.
- Colab notebook includes an update/recovery cell for older sessions.


## [1.3.0] - 2026-09-26

### Added
- Mineiro Registry abstraction over the 985-detector catalog.
- Registry health dashboard with category, reliability and provenance summaries.
- Detector Bench engine for TP/TN/FP/FN, precision, recall, FPR and availability.
- Registry API endpoints for stats, filtered detectors and benchmark calculation.
- `registry:validate` and `registry:stats` CLI commands.
- Official Google Colab notebook and Colab documentation.
- Registry contribution and growth documentation for 6,000+ detectors.
- CI validation for Registry integrity.

### Changed
- Package version bumped to 1.3.0.
- Dashboard language now avoids treating FOUND as verified identity.
- Data-source cards now represent Registry, Evidence Engine and Detector Bench.
- Server telemetry and health version updated to v1.3.

### Notes
- The historical 985-detector catalog remains preserved.
- Legacy detectors remain marked `legacy-audit-required` until independently audited.
- Detector Reliability remains heuristic; Detector Bench metrics are empirical when observations exist.

## 1.2.0 — Expanded Evidence Catalog

- restored the broad historical catalog: 985 endpoints;
- retained legacy entries instead of deleting low-confidence detectors;
- added Detector Reliability Score;
- added reliability tiers: high, medium and experimental;
- added site type classification;
- added provenance and license status metadata;
- added optional eight-signal Evidence Engine;
- full matrix exposes up to 7,880 logical evidence checks;
- added reliability-weighted Digital Footprint Profile;
- removed mock presence from the execution path;
- changed transport errors from false `not_found` to `error`;
- documented code-license vs dataset-license boundaries;
- kept monochrome visual system.
