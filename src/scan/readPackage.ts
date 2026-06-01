/** Read a package.json and extract its declared license. */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RawPackage {
  name: string;
  version: string;
  license: string;
  private: boolean;
}

interface PackageJson {
  name?: string;
  version?: string;
  private?: boolean;
  license?: unknown;
  licenses?: unknown;
}

/** Extract a license string from the various legacy/standard shapes. */
export function licenseFromPackageJson(pkg: PackageJson): string {
  if (typeof pkg.license === "string") return pkg.license;
  if (pkg.license && typeof pkg.license === "object") {
    const t = (pkg.license as { type?: string }).type;
    if (typeof t === "string") return t;
  }
  // Deprecated `licenses: [{ type }]` array form.
  if (Array.isArray(pkg.licenses)) {
    const types = pkg.licenses
      .map((l) => (l && typeof l === "object" ? (l as { type?: string }).type : undefined))
      .filter((t): t is string => typeof t === "string");
    if (types.length === 1) return types[0]!;
    if (types.length > 1) return `(${types.join(" OR ")})`;
  }
  return "";
}

/** Parse a package.json file into a RawPackage, or null if unreadable. */
export function readPackage(pkgPath: string): RawPackage | null {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;
    if (!pkg.name) return null;
    return {
      name: pkg.name,
      version: pkg.version ?? "0.0.0",
      license: licenseFromPackageJson(pkg),
      private: pkg.private === true,
    };
  } catch {
    return null;
  }
}

/**
 * If package.json has no license field, look for a LICENSE file as a last
 * resort and return a marker so we at least know one exists on disk.
 */
export function hasLicenseFile(dir: string): boolean {
  try {
    return readdirSync(dir).some((f) => /^licen[cs]e(\.|$)/i.test(f));
  } catch {
    return false;
  }
}

export function packageJsonPath(dir: string): string {
  return join(dir, "package.json");
}

export function exists(path: string): boolean {
  return existsSync(path);
}
