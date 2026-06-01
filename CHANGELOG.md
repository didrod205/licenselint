# Changelog

All notable changes are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/) and this project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-06-01

### Added

- Initial public release.
- `scan` command: audit a project's dependency licenses from `node_modules`
  (scoped + nested packages, dedup by name@version).
- `report` command: re-render a saved JSON report as Markdown, SBOM, or notices.
- `init` command: scaffold a `licenselint.config.json` with sensible allow/deny.
- SPDX expression parsing: `OR` (lighter side), `AND` (stricter side), `WITH`
  exceptions, deprecated ids, and legacy `licenses[]` arrays.
- License classification into public-domain / permissive / weak-copyleft /
  copyleft / network-copyleft / proprietary / unknown.
- Policy engine: `allow`, `deny`, `failOn` (by class), `overrides`, `exclude`,
  `unknownSeverity`, and per-rule severities.
- Exports: JSON, Markdown, **CycloneDX 1.5 SBOM**, and a THIRD-PARTY-NOTICES
  attribution file.
- Score with an A–F grade; `--min-score` and `--fail-on-issues` CI gates.
- Programmatic API: `scanProject`, `analyze`, `scanAndAnalyze`, `evaluate`,
  `parseExpression`, `toJSON`, `toMarkdown`, `toSbom`, `toNotices`.
- Deterministic; runs entirely locally, no network. ESM + CJS + TypeScript types.

[0.1.0]: https://github.com/didrod205/licenselint/releases/tag/v0.1.0
