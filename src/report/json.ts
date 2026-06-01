import type { Report } from "../types.js";

/** Pretty-printed JSON report (stable, deterministic). */
export function toJSON(report: Report): string {
  return JSON.stringify(report, null, 2) + "\n";
}
