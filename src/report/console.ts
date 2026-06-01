import pc from "picocolors";
import type { LicenseClass, Report, Severity } from "../types.js";

const MARK: Record<Severity, (s: string) => string> = {
  error: (s) => pc.red(s),
  warning: (s) => pc.yellow(s),
  info: (s) => pc.blue(s),
};
const SIGN: Record<Severity, string> = { error: "✗", warning: "⚠", info: "ℹ" };

function gradeColor(grade: string, text: string): string {
  if (grade === "A") return pc.green(text);
  if (grade === "B") return pc.cyan(text);
  if (grade === "C") return pc.yellow(text);
  return pc.red(text);
}

function classColor(cls: LicenseClass, text: string): string {
  if (cls === "permissive" || cls === "public-domain") return pc.green(text);
  if (cls === "weak-copyleft") return pc.cyan(text);
  if (cls === "copyleft" || cls === "network-copyleft") return pc.red(text);
  if (cls === "proprietary") return pc.magenta(text);
  return pc.yellow(text);
}

/** Print a report to the console. When `quiet`, info-level issues are hidden. */
export function printReport(report: Report, quiet = false): void {
  const s = report.summary;

  console.log(pc.bold(`\nScanned ${s.dependencies} dependencies`));
  for (const b of s.byClass) {
    console.log(`  ${classColor(b.class, b.label.padEnd(20))} ${String(b.count).padStart(4)}`);
  }

  const issues = quiet ? report.issues.filter((i) => i.severity !== "info") : report.issues;
  if (issues.length > 0) {
    console.log("");
    for (const i of issues) {
      console.log(
        `  ${MARK[i.severity](SIGN[i.severity])} ${pc.bold(`${i.dependency}@${i.version}`)} ${i.message}`,
      );
      if (i.fix) console.log(`      ${pc.dim("→ " + i.fix)}`);
    }
  }

  const head = gradeColor(s.grade, `${s.score}/100 (${s.grade})`);
  console.log(
    `\n${pc.bold("Overall")}  ${head}  ` +
      `${s.dependencies} deps, ` +
      `${pc.red(`${s.errors} error(s)`)}, ${pc.yellow(`${s.warnings} warning(s)`)}, ${s.infos} info`,
  );
}
