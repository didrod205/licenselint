/** Core types for licenselint. */

export type Severity = "error" | "warning" | "info";

/** Risk class for a license, from safest to riskiest. */
export type LicenseClass =
  | "public-domain"
  | "permissive"
  | "weak-copyleft"
  | "copyleft"
  | "network-copyleft"
  | "proprietary"
  | "unknown";

export const LICENSE_CLASSES: LicenseClass[] = [
  "public-domain",
  "permissive",
  "weak-copyleft",
  "copyleft",
  "network-copyleft",
  "proprietary",
  "unknown",
];

export const CLASS_LABELS: Record<LicenseClass, string> = {
  "public-domain": "Public domain",
  permissive: "Permissive",
  "weak-copyleft": "Weak copyleft",
  copyleft: "Copyleft",
  "network-copyleft": "Network copyleft",
  proprietary: "Proprietary",
  unknown: "Unknown / unlicensed",
};

export type RuleId =
  | "denied-license"
  | "not-allowed-license"
  | "unknown-license"
  | "missing-license"
  | "copyleft-license"
  | "network-copyleft-license"
  | "deprecated-spdx"
  | "non-spdx-expression";

export const RULE_LABELS: Record<RuleId, string> = {
  "denied-license": "Denied license",
  "not-allowed-license": "License not in allowlist",
  "unknown-license": "Unknown license",
  "missing-license": "Missing license",
  "copyleft-license": "Copyleft license",
  "network-copyleft-license": "Network copyleft (AGPL-style)",
  "deprecated-spdx": "Deprecated SPDX identifier",
  "non-spdx-expression": "Non-SPDX license expression",
};

/** A resolved dependency with its license. */
export interface Dependency {
  name: string;
  version: string;
  /** Raw license expression as declared (SPDX or free text). */
  license: string;
  /** Parsed, de-duplicated SPDX-ish identifiers found in the expression. */
  licenseIds: string[];
  /** The risk class of the whole expression (worst-case of its parts). */
  class: LicenseClass;
  /** Whether the package declares itself private. */
  private: boolean;
  /** Direct vs transitive (best-effort). */
  direct: boolean;
  path?: string;
}

export interface Issue {
  rule: RuleId;
  severity: Severity;
  dependency: string;
  version: string;
  license: string;
  class: LicenseClass;
  message: string;
  fix?: string;
}

export interface ClassBreakdown {
  class: LicenseClass;
  label: string;
  count: number;
}

export interface Report {
  tool: "licenselint";
  version: string;
  generatedAt: string;
  summary: {
    dependencies: number;
    score: number;
    grade: string;
    errors: number;
    warnings: number;
    infos: number;
    byClass: ClassBreakdown[];
    licenses: { id: string; count: number }[];
  };
  issues: Issue[];
  dependencies: Dependency[];
}

export interface LicenselintConfig {
  /** Only these SPDX ids are allowed (empty = allow anything not denied). */
  allow: string[];
  /** These SPDX ids are always rejected. */
  deny: string[];
  /** License classes that should raise an error. */
  failOn: LicenseClass[];
  /** Treat a missing/unknown license as this severity. */
  unknownSeverity: Severity;
  /** Packages (name or name@version) to skip entirely. */
  exclude: string[];
  /** Treat these packages' license as the given SPDX id (overrides). */
  overrides: Record<string, string>;
  /** Include devDependencies in the scan. */
  includeDev: boolean;
  /** CI gate: minimum overall score (0–100). */
  minScore: number;
  ruleSeverity: Partial<Record<RuleId, Severity>>;
}
