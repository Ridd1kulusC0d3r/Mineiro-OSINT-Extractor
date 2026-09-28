# Changelog

## [1.5.0] - 2026-09-27

### Graph Hunting
- Similar-user candidate nodes can launch background pivot scans directly from the relationship graph.
- Pivot scans preserve the current investigation instead of replacing it.
- Pivot findings are merged into the active graph as observed profile edges.
- Candidate similarity edges remain explicitly candidate even after a successful pivot.
- Added Mineiro Graph Query, a local read-only graph query engine.
- Added query presets for similar usernames, shared domains, observed profiles, strong edges, same-domain relations and target-to-profile paths.
- Query results visually highlight matched nodes/edges and dim unrelated graph elements.
- Added optional local Neo4j/Cypher export without requiring a Neo4j dependency or remote connection.
- Added graph hunting smoke tests to the product quality gate and CI.
- Added dedicated Graph Hunting documentation.

### Safety and analytical semantics
- Similar username remains a discovery hypothesis, not identity proof.
- Pivot success confirms public presence of the candidate handle on observed services only.
- Candidate and observed edges retain separate semantics in UI and exports.


## [1.4.4] - 2026-09-27

### Internationalization
- Full interface language state for Portuguese, English and Spanish.
- Language selector now changes visible product surfaces instead of only storing a preference.
- Canonical trilingual UI catalog with CI key-parity validation.
- Intelligence Assessment narratives localized by selected language.
- Intelligence Requirements, judgments, hypotheses, contradictions, gaps, pivots, timeline and collection plan localized.
- AI Analyst Workspace, Gemini settings, Username Linkage and Relationship Graph localized.
- Export builder localized.
- HTML, Markdown and analytical JSON generation follow the selected language.
- Export manifest records the selected language.
- Browser document language and title update when the locale changes.
- Selected language persists in localStorage.
- Compatibility translation bridge covers legacy UI surfaces while components migrate to direct message keys.

### Compatibility
- Machine-oriented JSON and CSV structural field names remain stable for downstream integrations.
- Public evidence semantics and confidence scoring are unchanged by language selection.


## [1.4.3] - 2026-09-26

### Brand
- Product name standardized as **Mineiro Username Intelligence**.
- Product subtitle standardized as **OSINT Investigation Workbench**.
- Application header, browser metadata, server identity, package metadata, README, manual and Colab branding aligned.
- Canonical notebook renamed to `Mineiro_Username_Intelligence_Colab.ipynb`.
- Internal package renamed to `mineiro-username-intelligence`.
- GitHub repository slug remains unchanged for compatibility with existing links and redirects.


## [1.4.2] - 2026-09-26

### Product
- README redesigned as a concise product landing page.
- Canonical documentation hub under `docs/`.
- New Getting Started, User Guide, Colab guide, Troubleshooting and FAQ.
- Single canonical Google Colab notebook: `notebooks/Mineiro_Official_Colab.ipynb`.
- Legacy duplicate notebooks removed.
- Support, roadmap, issue forms and Pull Request template added.

### Colab
- clone/update flow consolidated;
- Node.js 22+ verification;
- dependency installation with quieter/faster npm flags;
- Registry validation during bootstrap;
- process-safe server restart;
- health polling before exposing the UI;
- persistent session log at `/content/mineiro-server.log`;
- direct Colab proxy URL;
- optional synthetic validation cell.

### Engineering
- `npm run check` added as the canonical local quality gate.
- CI now uses concurrency cancellation and npm download caching.
- CI validates the canonical docs surface and official Colab notebook.
- Package and server version aligned to 1.4.2.


## [1.4.1] - 2026-09-26

### Added
- Intelligence Requirement selector with requirement-aware analytical relevance.
- Complete 22-section intelligence report.
- Known / Assessed / Unknown executive framing.
- Source Quality grades A-E and requirement-aware Intelligence Priority Score.
- Expanded correlation graph: username/email, profile, platform, domain, public URL, display name, organization, public project and optional avatar-hash entities.
- Correlation relationships for USES, LINKS_TO, MENTIONS, HOSTED_ON, SAME_HANDLE, SAME_DOMAIN, REFERENCES and OBSERVED_ON.
- Cross-cluster overlap based on independent shared public domains.
- Semantic intelligence timeline separating scan time, account-created time, first-public-evidence time and source-observed time when those timestamps are actually available.
- Provenance graph separating PRIMARY, DERIVED, EXTERNAL and AI_SYNTHESIZED layers.
- Click-through Analytic Ledger evidence IDs.
- Dedicated unresolved findings, source/detector reliability and technical appendix sections.
- Real SHA-256 integrity snapshots without pseudo-hash fallback.
- Companion export manifest with payload SHA-256 and included/excluded section inventory.

### Changed
- Legacy print dossier no longer includes speculative behavioral/threat-actor profiling; print output is evidence-assessment based.
- Snapshot language now correctly describes integrity verification rather than authorship or legal chain of custody.
- AI Analyst Copilot follows the selected Intelligence Requirement.
- Post-scan navigation remains centered on the Intelligence Report.

### Validation
- Extended synthetic intelligence smoke test covers requirement weighting, provenance, cluster overlap, graph edges, semantic timeline and export SHA-256.


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
