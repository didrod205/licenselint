# licenselint — Product & Launch Strategy

The strategy brief behind licenselint, so the project can be maintained,
marketed, and grown by one person.

## 1. Idea & rationale

Open-source license compliance is a real legal and financial risk: shipping
GPL/AGPL in the wrong place can force you to open-source your own code, an
unlicensed dependency means you have no right to use it, and license inventory
is the first thing acquirers' due-diligence teams demand. Yet most teams don't
know what's in their tree, and the tools that do (FOSSA, Snyk, Black Duck) are
**paid SaaS that upload your manifest**. licenselint does the deterministic
part — parse SPDX, classify risk, enforce policy, emit SBOM/notices —
**entirely locally**.

## 2. Competitor analysis

| Tool | Focus | Gap licenselint fills |
| --- | --- | --- |
| **license-checker (npm)** | Lists licenses | Weak policy/classification; no SBOM, no risk classes |
| **FOSSA / Snyk / Black Duck** | Full compliance SaaS | Paid, upload your dependency data to their servers |
| **license-checker-rseidelsohn** | Fork w/ more output | Still extraction-first; no class-based policy or CycloneDX |
| **cyclonedx-npm** | SBOM generation | SBOM only — no policy gate, no risk classification |
| **Manual review / spreadsheets** | — | Doesn't scale, not deterministic, not CI-able |

**White space:** a free, **local**, deterministic tool that unifies
**classification + policy gate + SBOM + notices** in one CLI.

## 3. Differentiation

- **Risk classification**, not just a license string — copyleft vs permissive vs
  network-copyleft is the decision-relevant signal.
- **Real SPDX expression parsing** (OR picks lighter, AND picks stricter, WITH).
- **Local & private** — no upload; ideal where FOSSA/Snyk are a non-starter.
- **Compliance artifacts built in** — CycloneDX SBOM + third-party notices.
- **CI-native** — `--fail-on-issues` / `--min-score` exit codes.

## 4. Folder structure

```
licenselint/
├─ src/
│  ├─ spdx-data.ts, spdx.ts        # classification data + expression parser
│  ├─ scan/{walk,readPackage,index}.ts  # node_modules -> Dependency[]
│  ├─ policy.ts, score.ts, config.ts, types.ts
│  ├─ report/{json,markdown,sbom,notices,console}.ts
│  ├─ index.ts, cli.ts
├─ tests/                          # vitest specs
├─ examples/sample-project/        # fake node_modules tree + config + sample outputs
└─ .github/, README.md, CONTRIBUTING.md, CHANGELOG.md, LICENSE, package.json
```

## 5. Source

Full TypeScript in `src/` (ESM+CJS via tsup), MIT-licensed. See README
"Programmatic API" and CONTRIBUTING.

## 6. README

See [README.md](./README.md): one-liner, why-it-exists, features, install,
quick start, CLI usage, example result, config, 3 use cases, roadmap, FAQ,
contributing, license, sponsor (Lemon Squeezy), screenshot placeholder.

## 7. License

[MIT](./LICENSE).

## 8. GitHub topics

`license`, `license-checker`, `oss-compliance`, `sbom`, `spdx`, `license-audit`,
`dependency-license`, `gpl-checker`, `copyleft`, `cyclonedx`,
`third-party-notices`, `supply-chain`, `cli`, `typescript`.

## 9. Product Hunt blurb

> **licenselint — audit your dependencies' licenses before legal does.**
> A free, local CLI that scans your `node_modules`, classifies every license
> (permissive / copyleft / AGPL-style / proprietary / unknown), enforces an
> allow/deny policy, and generates a CycloneDX SBOM + third-party notices. No
> SaaS, no upload, no API key. `npx @didrod2539/licenselint scan`. Gate CI with
> `--fail-on-issues`.

## 10. npm name

Package `@didrod2539/licenselint`, bin `licenselint`. Scoped to satisfy npm's
name-similarity policy while keeping the memorable `*lint` brand and the
high-intent `license` keyword. ESM+CJS+types.

## 11. SEO/keyword strategy

- **Primary:** license checker, OSS compliance, SBOM generator, SPDX, GPL
  checker, dependency license audit, CycloneDX npm.
- **Long-tail:** "check npm dependency licenses", "fail CI on GPL", "generate
  SBOM locally", "third-party notices generator", "AGPL in node_modules".
- **Channels:** README (keyword-rich + FAQ), npm keywords, GitHub topics, a
  dev.to post ("The AGPL package hiding in your node_modules"), Product Hunt,
  r/node, r/devops, r/opensource, Hacker News, legal/eng compliance communities.
- **Content moat:** a "npm license risk classes explained" reference page that
  doubles as docs and ranks for "is MPL copyleft".

## 12. Monetization

- **Sponsorship via Lemon Squeezy only** (one-time/recurring) — FUNDING.yml +
  README. Funds: lockfile-only scanning, license-compatibility analysis, SPDX
  SBOM output, a GitHub Action, issue triage.
- **Future optional paid tier (never gates the OSS):** a hosted dashboard with
  org-wide license inventory, drift alerts, and PR comments. CLI + library stay
  free and MIT forever.

## 13. Maintenance plan (one person)

- Classification is a declarative data table; updates are one-line PRs with an
  SPDX citation.
- The parser, scanner, and policy engine are small, isolated, fully unit-tested.
- CI matrix (Node 18/20/22) + a committed fake `node_modules` fixture guard
  regressions deterministically.
- Tagged releases auto-publish via `release.yml`.
- Committed sample outputs make report-format changes obvious in diffs.
