/**
 * Walk a project's node_modules to enumerate installed packages.
 *
 * Handles scoped packages (@scope/name) and nested node_modules (npm's
 * deduped + hoisted layout). Each unique name@version is reported once.
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { hasLicenseFile, packageJsonPath, readPackage, type RawPackage } from "./readPackage.js";

export interface WalkedPackage extends RawPackage {
  dir: string;
  hasLicenseFile: boolean;
}

function safeReaddir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Collect package directories directly under a node_modules folder. */
function packageDirs(nodeModules: string): string[] {
  const out: string[] = [];
  for (const entry of safeReaddir(nodeModules)) {
    if (entry.startsWith(".")) continue;
    const full = join(nodeModules, entry);
    if (!isDir(full)) continue;
    if (entry.startsWith("@")) {
      // Scoped: one more level down.
      for (const sub of safeReaddir(full)) {
        const subFull = join(full, sub);
        if (isDir(subFull)) out.push(subFull);
      }
    } else {
      out.push(full);
    }
  }
  return out;
}

/**
 * Recursively enumerate installed packages from a root node_modules, following
 * nested node_modules. De-duplicates by name@version.
 */
export function walkNodeModules(root: string): WalkedPackage[] {
  const seen = new Set<string>();
  const result: WalkedPackage[] = [];
  const queue: string[] = [join(root, "node_modules")];

  while (queue.length > 0) {
    const nm = queue.shift()!;
    if (!isDir(nm)) continue;
    for (const dir of packageDirs(nm)) {
      const pkg = readPackage(packageJsonPath(dir));
      if (pkg) {
        const key = `${pkg.name}@${pkg.version}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ ...pkg, dir, hasLicenseFile: hasLicenseFile(dir) });
        }
      }
      // Follow nested node_modules.
      const nested = join(dir, "node_modules");
      if (isDir(nested)) queue.push(nested);
    }
  }
  return result;
}
