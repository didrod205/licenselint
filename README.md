<div align="center">

# ⚖️ licenselint

### Audit your dependencies' open-source licenses — locally, before legal does.

[![npm version](https://img.shields.io/npm/v/@didrod2539/licenselint.svg?color=success)](https://www.npmjs.com/package/@didrod2539/licenselint)
[![CI](https://github.com/didrod205/licenselint/actions/workflows/ci.yml/badge.svg)](https://github.com/didrod205/licenselint/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/@didrod2539/licenselint.svg)](https://www.npmjs.com/package/@didrod2539/licenselint)
[![license](https://img.shields.io/npm/l/@didrod2539/licenselint.svg)](./LICENSE)

A deterministic CLI that scans your dependency tree, **classifies every
license** (permissive / copyleft / network-copyleft / proprietary / unknown),
enforces an **allow/deny policy**, and generates a **CycloneDX SBOM** and
**third-party notices** — all locally. Your code never leaves your machine.

</div>

---

## One-line summary

`licenselint` reads your installed `node_modules`, classifies each package's
license, flags policy violations (GPL/AGPL, unlicensed, denied), and emits a
score, SBOM, and attribution file — no SaaS, no upload, no API key.

## Why this project exists

Open-source license violations are a real, expensive problem:

- Ship a copyleft (**GPL/AGPL**) package in the wrong place and you can be
  obligated to **open-source your own code** — AGPL even across a network.
- An **unlicensed** dependency ("UNLICENSED", no `license` field) means you have
  **no legal right to use it** at all.
- The first thing an **acquirer's due-diligence** team asks for is a license
  inventory — and a surprise there can kill a deal.

Most teams have **no idea** what licenses live in their dependency tree, and the
tools that do (FOSSA, Snyk, Black Duck) are **paid SaaS that upload your manifest
to their servers**. `licenselint` does the deterministic, mechanical part — parse
SPDX expressions, classify risk, enforce policy, generate SBOM/notices —
**entirely locally**, so it drops into CI or a pre-merge gate with zero data exposure.

## Key features

- 🏷️ **License classification** — every dependency mapped to a risk class:
  public-domain, permissive, weak/strong copyleft, network-copyleft, proprietary,
  or unknown.
- 🧮 **Real SPDX parsing** — handles `(MIT OR Apache-2.0)`, `A AND B`,
  `GPL-2.0-or-later WITH …`, deprecated ids, and legacy `licenses[]` arrays.
- 🚦 **Policy engine** — `allow`/`deny` lists, fail-on-class, per-package
  `overrides`, `exclude`, and per-rule severities.
- 📋 **SBOM export** — standards-compliant **CycloneDX 1.5** JSON.
- 📄 **Third-party notices** — attribution file grouped by license.
- 📊 **Score + A–F grade**, JSON/Markdown reports, **CI gate** exit codes.
- 🔒 **100% local & deterministic** — no network, no upload, same tree → same report.

## Install

```bash
# run without installing
npx @didrod2539/licenselint scan

# or install
npm install -g @didrod2539/licenselint    # global CLI (provides `licenselint`)
npm install -D @didrod2539/licenselint    # project dev-dependency (for CI)
```

Node ≥ 18. ESM + CJS + TypeScript types.

## Quick start

```bash
# from your project root (after npm install)
licenselint scan
```

```
Scanned 8 dependencies
  Permissive              4
  Copyleft                2
  Network copyleft        1
  Unknown / unlicensed    1

  ✗ network-share@2.0.1 Uses denied license "AGPL-3.0-or-later"
      → Remove network-share or replace it with a differently-licensed alternative.
  ✗ copyleft-lib@1.0.0 copyleft-lib is copyleft (GPL-3.0-only)
      → Copyleft can require sharing derivative source — confirm with legal.
  ⚠ mystery-pkg@0.5.0 No license declared for mystery-pkg

Overall  0/100 (F)  8 deps, 5 error(s), 1 warning(s), 1 info
```

## CLI usage

```bash
licenselint scan [dir]        # audit a project (default: current directory)
licenselint report <in.json>  # re-render a saved report (md | sbom | notices)
licenselint init              # scaffold licenselint.config.json
licenselint --help
licenselint --version
```

`scan` options:

| Option | Description |
| --- | --- |
| `--config <file>` | Path to a config file (otherwise auto-detected) |
| `--dev` | Include devDependencies |
| `--json <file>` | Write a JSON report |
| `--md <file>` | Write a Markdown report |
| `--sbom <file>` | Write a CycloneDX SBOM |
| `--notices <file>` | Write a THIRD-PARTY-NOTICES file |
| `--min-score <n>` | Exit non-zero if the overall score < n (CI gate) |
| `--fail-on-issues` | Exit non-zero if there's any error-level issue |
| `--quiet` | Hide info-level issues in the console |

## Example result

Full reports for the bundled sample project are in
[`examples/sample-report.md`](./examples/sample-report.md),
[`examples/sample-sbom.json`](./examples/sample-sbom.json) and
[`examples/THIRD-PARTY-NOTICES.txt`](./examples/THIRD-PARTY-NOTICES.txt).

> 📸 _Screenshot / demo GIF placeholder:_ `./docs/screenshot.png` — record the
> terminal running `npx @didrod2539/licenselint scan examples/sample-project`.

## Configuration

Create `licenselint.config.json` (or run `licenselint init`):

```json
{
  "allow": ["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD"],
  "deny": ["AGPL-3.0-only", "AGPL-3.0-or-later", "SSPL-1.0"],
  "failOn": ["copyleft", "network-copyleft", "proprietary"],
  "unknownSeverity": "warning",
  "includeDev": false,
  "minScore": 80,
  "exclude": ["internal-pkg"],
  "overrides": { "weird-pkg@1.2.3": "MIT" },
  "ruleSeverity": { "deprecated-spdx": "info" }
}
```

| Field | Meaning |
| --- | --- |
| `allow` | If non-empty, every license must be in this list |
| `deny` | These SPDX ids are always rejected (terminal) |
| `failOn` | License classes that raise an error |
| `unknownSeverity` | Severity for missing/unknown licenses |
| `includeDev` | Include devDependencies |
| `exclude` | Packages (`name` or `name@version`) to skip |
| `overrides` | Force a package's license to a given SPDX id |
| `minScore` | CI gate threshold (overridable with `--min-score`) |
| `ruleSeverity` | Override severity per rule id |

Rule ids: `denied-license`, `not-allowed-license`, `unknown-license`,
`missing-license`, `copyleft-license`, `network-copyleft-license`,
`deprecated-spdx`, `non-spdx-expression`.

## Real-world use cases

1. **Block risky licenses in CI.** Add `licenselint scan --fail-on-issues` to
   your pipeline. A PR that pulls in a transitive **AGPL** package fails the build
   before it's ever shipped.
2. **Generate compliance artifacts for a release.** Run
   `licenselint scan --sbom sbom.json --notices THIRD-PARTY-NOTICES.txt` to emit
   a CycloneDX SBOM and attribution file your legal/release process can attach.
3. **Prep for due diligence or an audit.** `licenselint scan --md licenses.md`
   gives you a clean, per-class inventory of everything in your tree — what an
   acquirer or auditor will ask for, before they ask.

## Programmatic API

```ts
import { scanAndAnalyze, toSbom, toMarkdown } from "@didrod2539/licenselint";

const report = scanAndAnalyze(process.cwd(), config);
console.log(report.summary.byClass);
await fs.writeFile("sbom.json", toSbom(report));
await fs.writeFile("licenses.md", toMarkdown(report));
```

## Roadmap

- Read `package-lock.json` / `pnpm-lock.yaml` / `yarn.lock` without a full install.
- SPDX-3 / SPDX-tag-value SBOM output in addition to CycloneDX.
- License **compatibility** analysis (can these licenses coexist in one distribution?).
- Pull copyright lines from each package's LICENSE file into notices.
- A GitHub Action that comments the license diff on PRs.
- Workspaces / monorepo awareness.

## FAQ

**Does it upload my dependency list anywhere?**
No. `licenselint` runs entirely on your machine — no API key, no telemetry, no
uploads, no network calls. That's the whole point versus hosted scanners.

**Is this legal advice?**
No. It's a deterministic classifier and policy engine to *surface* license risk.
Always confirm copyleft/unknown findings with qualified counsel.

**How does it find licenses?**
It walks `node_modules` (including scoped and nested packages), reads each
`package.json` `license`/`licenses` field, and parses the SPDX expression. If a
field is missing it notes whether a `LICENSE` file exists so you can review.

**What about `package-lock.json` only (no install)?**
Lockfile-only scanning is on the roadmap. Today it reads installed packages,
which reflects exactly what you ship.

**The score seems harsh/lenient — can I tune it?**
Yes. `failOn`, `allow`/`deny`, `unknownSeverity`, and `ruleSeverity` all change
what's flagged; `--min-score`/`--fail-on-issues` decide what fails CI.

**Why is an `OR` license classed by its lighter side?**
Because you may legally choose either — `(GPL-3.0-only OR MIT)` lets you take MIT,
so it's treated as permissive. `AND` takes the stricter side.

## Contributing

Contributions welcome! License classifications live in `src/spdx-data.ts` and
policy rules in `src/policy.ts`. See [CONTRIBUTING.md](./CONTRIBUTING.md) and the
[Code of Conduct](./CODE_OF_CONDUCT.md).

```bash
git clone https://github.com/didrod205/licenselint.git
cd licenselint
npm install
npm test
npm run build
node dist/cli.js scan examples/sample-project
```

## License

[MIT](./LICENSE) © licenselint contributors

## 💖 Sponsor

licenselint is free, MIT-licensed, and built in spare time. If it saved you from
a license surprise (or a failed audit), please consider supporting it:

- ⭐ **Star this repo** — free, and it helps others find it.
- 🍋 **[Sponsor via Lemon Squeezy](https://elab-studio.lemonsqueezy.com/checkout/buy/5d059b89-51d0-456b-b33a-ed56994f7010)** — one-time or recurring.

**Where your support goes:** lockfile-only scanning, license-compatibility
analysis, copyright extraction, SPDX SBOM output, a PR-commenting GitHub Action,
and fast issue responses.
