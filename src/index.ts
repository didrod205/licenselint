/**
 * licenselint — audit your dependency tree's open-source licenses locally.
 * Classifies each package's license (permissive / copyleft / network-copyleft /
 * proprietary / unknown), enforces an allow/deny policy, and generates SBOM /
 * third-party notices. Deterministic, no code leaves your machine.
 *
 * This module is the programmatic API; see `cli.ts` for the command line.
 */

import { DEFAULT_CONFIG } from "./config.js";
import { evaluateAll } from "./policy.js";
import { scanProject } from "./scan/index.js";
import { gradeFor, scoreProject } from "./score.js";
import {
  CLASS_LABELS,
  LICENSE_CLASSES,
  type ClassBreakdown,
  type Dependency,
  type LicenselintConfig,
  type Report,
} from "./types.js";

export * from "./types.js";
export { DEFAULT_CONFIG, loadConfig } from "./config.js";
export { scanProject } from "./scan/index.js";
export { evaluate, evaluateAll } from "./policy.js";
export { parseExpression, classifyId, normalizeId } from "./spdx.js";
export { gradeFor } from "./score.js";
export { toJSON } from "./report/json.js";
export { toMarkdown } from "./report/markdown.js";
export { toSbom } from "./report/sbom.js";
export { toNotices } from "./report/notices.js";

/** Build a full report from a pre-scanned dependency list. */
export function analyze(
  dependencies: Dependency[],
  config: LicenselintConfig = DEFAULT_CONFIG,
  options: { version?: string; now?: Date } = {},
): Report {
  const issues = evaluateAll(dependencies, config);

  const counts = { error: 0, warning: 0, info: 0 };
  for (const i of issues) counts[i.severity]++;

  const byClass: ClassBreakdown[] = LICENSE_CLASSES.map((c) => ({
    class: c,
    label: CLASS_LABELS[c],
    count: dependencies.filter((d) => d.class === c).length,
  })).filter((b) => b.count > 0);

  const licenseCounts = new Map<string, number>();
  for (const d of dependencies) {
    const key = d.licenseIds.length ? d.licenseIds.join(" OR ") : d.license;
    licenseCounts.set(key, (licenseCounts.get(key) ?? 0) + 1);
  }
  const licenses = [...licenseCounts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

  const score = scoreProject(dependencies.length, issues);

  return {
    tool: "licenselint",
    version: options.version ?? "0.0.0",
    generatedAt: (options.now ?? new Date()).toISOString(),
    summary: {
      dependencies: dependencies.length,
      score,
      grade: gradeFor(score),
      errors: counts.error,
      warnings: counts.warning,
      infos: counts.info,
      byClass,
      licenses,
    },
    issues,
    dependencies,
  };
}

/** Scan a project directory and build a report in one call. */
export function scanAndAnalyze(
  projectDir: string,
  config: LicenselintConfig = DEFAULT_CONFIG,
  options: { version?: string; now?: Date } = {},
): Report {
  const deps = scanProject(projectDir, config);
  return analyze(deps, config, options);
}
