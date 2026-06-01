/** Resolve a project directory into a list of classified Dependencies. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseExpression } from "../spdx.js";
import type { Dependency, LicenselintConfig } from "../types.js";
import { walkNodeModules } from "./walk.js";

interface RootManifest {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

function readRootManifest(projectDir: string): RootManifest {
  try {
    return JSON.parse(readFileSync(join(projectDir, "package.json"), "utf8")) as RootManifest;
  } catch {
    return {};
  }
}

function isExcluded(name: string, version: string, exclude: string[]): boolean {
  return exclude.includes(name) || exclude.includes(`${name}@${version}`);
}

/**
 * Scan a project directory. Reads node_modules, classifies each package's
 * license, applies overrides/excludes, and marks direct vs transitive deps.
 */
export function scanProject(projectDir: string, config: LicenselintConfig): Dependency[] {
  const manifest = readRootManifest(projectDir);
  const directProd = new Set(Object.keys(manifest.dependencies ?? {}));
  const directOptional = new Set(Object.keys(manifest.optionalDependencies ?? {}));
  const directDev = new Set(Object.keys(manifest.devDependencies ?? {}));

  const packages = walkNodeModules(projectDir);
  if (packages.length === 0) {
    throw new Error(
      `no installed packages found under ${join(projectDir, "node_modules")} — run your install first.`,
    );
  }

  const deps: Dependency[] = [];
  for (const pkg of packages) {
    if (isExcluded(pkg.name, pkg.version, config.exclude)) continue;

    // Skip dev-only direct deps unless includeDev.
    const isDirectProd = directProd.has(pkg.name) || directOptional.has(pkg.name);
    const isDirectDev = directDev.has(pkg.name);
    if (!config.includeDev && isDirectDev && !isDirectProd) continue;

    const override = config.overrides[pkg.name] ?? config.overrides[`${pkg.name}@${pkg.version}`];
    let licenseStr = override ?? pkg.license;
    // If no license declared but a LICENSE file exists, mark it noteworthy.
    if (!licenseStr && pkg.hasLicenseFile) licenseStr = "SEE LICENSE IN LICENSE";

    const parsed = parseExpression(licenseStr);
    deps.push({
      name: pkg.name,
      version: pkg.version,
      license: licenseStr || "(none)",
      licenseIds: parsed.ids,
      class: parsed.class,
      private: pkg.private,
      direct: isDirectProd || isDirectDev,
      path: pkg.dir,
    });
  }

  // Stable order: by name, then version.
  deps.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  return deps;
}
