/** Deterministic scoring & grading. */

import type { Issue, Severity } from "./types.js";

export function gradeFor(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const WEIGHT: Record<Severity, number> = { error: 10, warning: 4, info: 1 };

/**
 * Score a project from its license issues, scaled by dependency count so one
 * bad dep in a 500-package tree doesn't tank the score as hard as in a tiny
 * one — but any error still has real weight. Clamped 0–100.
 */
export function scoreProject(totalDeps: number, issues: Issue[]): number {
  const denom = Math.max(totalDeps, 10);
  let penalty = 0;
  for (const issue of issues) {
    // Per-issue flat penalty + a portion scaled to tree size.
    penalty += WEIGHT[issue.severity] * (1 + 10 / denom);
  }
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}
