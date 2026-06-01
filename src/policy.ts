/** Policy engine: turn classified dependencies into issues. */

import { DEPRECATED_SPDX } from "./spdx-data.js";
import { parseExpression } from "./spdx.js";
import type {
  Dependency,
  Issue,
  LicenselintConfig,
  RuleId,
  Severity,
} from "./types.js";

function sev(config: LicenselintConfig, rule: RuleId, fallback: Severity): Severity {
  return config.ruleSeverity[rule] ?? fallback;
}

function matchesList(ids: string[], list: string[]): boolean {
  if (ids.length === 0) return false;
  return ids.every((id) => list.includes(id));
}

function anyInList(ids: string[], list: string[]): string | undefined {
  return ids.find((id) => list.includes(id));
}

/** Evaluate one dependency against the policy, returning any issues. */
export function evaluate(dep: Dependency, config: LicenselintConfig): Issue[] {
  const issues: Issue[] = [];
  const base = {
    dependency: dep.name,
    version: dep.version,
    license: dep.license,
    class: dep.class,
  };

  // 1. Explicit deny list (highest priority).
  const denied = anyInList(dep.licenseIds, config.deny);
  if (denied) {
    issues.push({
      ...base,
      rule: "denied-license",
      severity: sev(config, "denied-license", "error"),
      message: `Uses denied license "${denied}"`,
      fix: `Remove ${dep.name} or replace it with a differently-licensed alternative.`,
    });
    return issues; // denial is terminal for this dep
  }

  // 2. Unknown / missing license.
  if (dep.class === "unknown") {
    const missing = dep.licenseIds.length === 0;
    issues.push({
      ...base,
      rule: missing ? "missing-license" : "unknown-license",
      severity: sev(config, missing ? "missing-license" : "unknown-license", config.unknownSeverity),
      message: missing
        ? `No license declared for ${dep.name}`
        : `Unrecognized license "${dep.license}"`,
      fix: missing
        ? "Verify the license manually; add an override once confirmed."
        : "Map this license via the `overrides` config once you've confirmed it.",
    });
    // fall through: allowlist below still applies
  }

  // 3. Allowlist (if configured, everything must be in it).
  if (config.allow.length > 0 && dep.licenseIds.length > 0) {
    if (!matchesList(dep.licenseIds, config.allow)) {
      const offending = dep.licenseIds.find((id) => !config.allow.includes(id));
      issues.push({
        ...base,
        rule: "not-allowed-license",
        severity: sev(config, "not-allowed-license", "error"),
        message: `License "${offending}" is not in the allowlist`,
        fix: `Add "${offending}" to \`allow\` if acceptable, or replace ${dep.name}.`,
      });
    }
  }

  // 4. Class-based failures (copyleft / network copyleft / proprietary).
  if (config.failOn.includes(dep.class)) {
    const rule: RuleId =
      dep.class === "network-copyleft" ? "network-copyleft-license" : "copyleft-license";
    issues.push({
      ...base,
      rule,
      severity: sev(config, rule, "error"),
      message: `${dep.name} is ${dep.class.replace("-", " ")} (${dep.license})`,
      fix:
        dep.class === "network-copyleft"
          ? "AGPL/SSPL can require sharing your service's source — confirm with legal."
          : "Copyleft can require sharing derivative source — confirm with legal.",
    });
  }

  // 5. Deprecated SPDX identifier (informational hygiene).
  const parsed = parseExpression(dep.license);
  for (const dep2 of parsed.deprecated) {
    issues.push({
      ...base,
      rule: "deprecated-spdx",
      severity: sev(config, "deprecated-spdx", "info"),
      message: `Deprecated SPDX id "${dep2.id}" (use "${dep2.replacement}")`,
      fix: `Ask the maintainer to update to "${dep2.replacement}".`,
    });
  }

  // 6. Non-SPDX expression (but a license is present) — hygiene warning.
  if (!parsed.spdx && dep.licenseIds.length > 0 && dep.class !== "unknown") {
    if (!DEPRECATED_SPDX[dep.license]) {
      issues.push({
        ...base,
        rule: "non-spdx-expression",
        severity: sev(config, "non-spdx-expression", "info"),
        message: `License "${dep.license}" is not a clean SPDX expression`,
        fix: "Prefer a valid SPDX identifier for tooling compatibility.",
      });
    }
  }

  return issues;
}

/** Evaluate every dependency. */
export function evaluateAll(deps: Dependency[], config: LicenselintConfig): Issue[] {
  const issues: Issue[] = [];
  for (const dep of deps) issues.push(...evaluate(dep, config));
  return issues;
}
