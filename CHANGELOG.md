# Changelog

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
