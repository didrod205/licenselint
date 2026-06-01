/**
 * Third-party notices (attribution) file generation.
 *
 * Many permissive licenses (MIT, BSD, Apache-2.0) require that you reproduce
 * their copyright/permission notice when you distribute. This produces a
 * THIRD-PARTY-NOTICES text grouping dependencies by license.
 */

import type { Report } from "../types.js";

export function toNotices(report: Report): string {
  const lines: string[] = [];
  lines.push("THIRD-PARTY SOFTWARE NOTICES");
  lines.push("============================");
  lines.push("");
  lines.push(
    `This product bundles the following ${report.dependencies.length} third-party ` +
      "packages, whose licenses are reproduced/identified below.",
  );
  lines.push("");

  // Group by license expression.
  const groups = new Map<string, { name: string; version: string }[]>();
  for (const d of report.dependencies) {
    const key = d.licenseIds.length ? d.licenseIds.join(" OR ") : d.license;
    const arr = groups.get(key) ?? [];
    arr.push({ name: d.name, version: d.version });
    groups.set(key, arr);
  }

  const sortedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [license, pkgs] of sortedGroups) {
    lines.push("-".repeat(72));
    lines.push(`License: ${license}`);
    lines.push("-".repeat(72));
    for (const p of pkgs.sort((a, b) => a.name.localeCompare(b.name))) {
      lines.push(`  - ${p.name}@${p.version}`);
    }
    lines.push("");
  }

  lines.push(
    "Note: full license texts are distributed with each package under its own",
  );
  lines.push("directory. Review copyleft/unknown entries with legal counsel.");
  lines.push("");
  return lines.join("\n");
}
