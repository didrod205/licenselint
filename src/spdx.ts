/**
 * Minimal SPDX license-expression parsing and risk classification.
 *
 * Handles the forms that appear in real package.json `license` fields:
 *   "MIT"
 *   "(MIT OR Apache-2.0)"
 *   "Apache-2.0 AND MIT"
 *   "GPL-2.0-or-later WITH Classpath-exception-2.0"
 *   "SEE LICENSE IN LICENSE"   (non-SPDX -> unknown)
 */

import { ALIASES, DEPRECATED_SPDX, LICENSE_CLASS, UNLICENSED_MARKERS } from "./spdx-data.js";
import { LICENSE_CLASSES, type LicenseClass } from "./types.js";

export interface ParsedExpression {
  /** De-duplicated SPDX-ish ids referenced. */
  ids: string[];
  /** Risk class for the whole expression. */
  class: LicenseClass;
  /** True if the expression is valid-looking SPDX. */
  spdx: boolean;
  /** Ids that are deprecated SPDX, mapped to replacements. */
  deprecated: { id: string; replacement: string }[];
  /** Whether an OR choice exists (lets a consumer pick the lighter side). */
  hasChoice: boolean;
}

const CLASS_RANK: Record<LicenseClass, number> = Object.fromEntries(
  LICENSE_CLASSES.map((c, i) => [c, i]),
) as Record<LicenseClass, number>;

/** Classify a single normalized SPDX id. */
export function classifyId(id: string): LicenseClass {
  const cls = LICENSE_CLASS[id];
  return cls ?? "unknown";
}

/** Normalize a raw token into a known SPDX id when possible. */
export function normalizeId(raw: string): string {
  const trimmed = raw.trim().replace(/^\(+|\)+$/g, "").trim();
  if (LICENSE_CLASS[trimmed]) return trimmed;
  if (DEPRECATED_SPDX[trimmed]) return DEPRECATED_SPDX[trimmed]!;
  if (ALIASES[trimmed]) return ALIASES[trimmed]!;
  // Case-insensitive alias lookup.
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (alias.toLowerCase() === trimmed.toLowerCase()) return id;
  }
  return trimmed;
}

/** The riskier of two classes wins (used for AND; OR picks the lighter). */
function worse(a: LicenseClass, b: LicenseClass): LicenseClass {
  return CLASS_RANK[a] >= CLASS_RANK[b] ? a : b;
}
function lighter(a: LicenseClass, b: LicenseClass): LicenseClass {
  return CLASS_RANK[a] <= CLASS_RANK[b] ? a : b;
}

/** Is the string a plausible SPDX identifier (not free text)? */
function looksSpdx(id: string): boolean {
  return /^[A-Za-z0-9.+-]+$/.test(id) && LICENSE_CLASS[id] !== undefined;
}

/** Parse and classify a license expression. */
export function parseExpression(raw: string): ParsedExpression {
  const input = (raw ?? "").trim();
  if (UNLICENSED_MARKERS.has(input.toUpperCase()) || input === "") {
    return { ids: [], class: "unknown", spdx: false, deprecated: [], hasChoice: false };
  }

  // Tokenize on AND / OR / WITH while keeping operators.
  const tokens = input
    .replace(/[()]/g, " ")
    .split(/\s+(AND|OR|WITH)\s+/i)
    .map((t) => t.trim())
    .filter(Boolean);

  const ids: string[] = [];
  const deprecated: { id: string; replacement: string }[] = [];
  let hasChoice = false;
  let allSpdx = true;

  // Build the class by folding operators. We track OR groups for "lighter".
  let current: LicenseClass | null = null;
  let pendingOp: "AND" | "OR" | "WITH" | null = null;

  for (const token of tokens) {
    const upper = token.toUpperCase();
    if (upper === "AND" || upper === "OR" || upper === "WITH") {
      pendingOp = upper as "AND" | "OR" | "WITH";
      if (upper === "OR") hasChoice = true;
      continue;
    }
    if (pendingOp === "WITH") {
      // Exception clause — doesn't change the base license id.
      pendingOp = null;
      continue;
    }

    const normalized = normalizeId(token);
    const orig = token.trim().replace(/^\(+|\)+$/g, "");
    if (DEPRECATED_SPDX[orig]) deprecated.push({ id: orig, replacement: normalized });
    if (!looksSpdx(normalized)) allSpdx = false;
    ids.push(normalized);

    const cls = classifyId(normalized);
    if (current === null) current = cls;
    else if (pendingOp === "OR") current = lighter(current, cls);
    else current = worse(current, cls); // AND or default
    pendingOp = null;
  }

  const uniqueIds = [...new Set(ids)];
  return {
    ids: uniqueIds,
    class: current ?? "unknown",
    spdx: allSpdx && uniqueIds.length > 0,
    deprecated,
    hasChoice,
  };
}
