# Contributing to licenselint

Thanks for your interest! licenselint is built so that **adding a license
classification or policy rule is small, isolated, and testable**.

## Getting started

```bash
git clone https://github.com/didrod205/licenselint.git
cd licenselint
npm install
npm test            # vitest
npm run typecheck   # tsc --noEmit
npm run build       # tsup -> dist/
node dist/cli.js scan examples/sample-project
```

## Project layout

```
src/
  spdx-data.ts      # SPDX id -> risk class, deprecated ids, aliases (data table)
  spdx.ts           # license-expression parser + classifier
  scan/             # walk node_modules -> read package.json -> Dependency[]
  policy.ts         # allow/deny/failOn/overrides -> Issue[]
  score.ts          # issues -> score & grade
  report/           # json | markdown | sbom (CycloneDX) | notices | console
  config.ts, types.ts, index.ts, cli.ts
tests/              # vitest specs
examples/sample-project/  # a fake node_modules tree used in tests & demos
```

## Adding a license classification

Edit `src/spdx-data.ts` — add the SPDX id to `LICENSE_CLASS` with the correct
class. If it's a deprecated id, add it to `DEPRECATED_SPDX`; if it's a common
non-SPDX alias, add it to `ALIASES`. Cite the
[SPDX license list](https://spdx.org/licenses/) in your PR.

## Adding a policy rule

1. Add the rule id to `RuleId` and `RULE_LABELS` in `src/types.ts`.
2. Emit it from `src/policy.ts` (`evaluate`), using the dependency's class/ids.
3. Add a test in `tests/policy.test.ts` proving it fires (and doesn't on clean
   input).

## Principles

- **Deterministic.** No randomness, no network, no time-dependent output. Same
  tree must always produce the same report.
- **Local only.** Never add telemetry or uploads — privacy is the product.
- **Not legal advice.** Classify conservatively and point users to counsel for
  copyleft/unknown cases.
- **Dependency-light.** Only `cac` and `picocolors` at runtime.
- **Actionable.** Every issue carries a concrete `fix` message.

## Checklist before opening a PR

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (tests added for new behavior)
- [ ] New classifications cite an SPDX source
- [ ] `CHANGELOG.md` updated for user-facing changes
- [ ] Regenerated `examples/sample-*` if output changed

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
