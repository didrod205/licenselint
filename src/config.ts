/** Configuration loading & defaults. */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LicenselintConfig } from "./types.js";

export const DEFAULT_CONFIG: LicenselintConfig = {
  allow: [],
  deny: [],
  failOn: ["copyleft", "network-copyleft", "proprietary"],
  unknownSeverity: "warning",
  exclude: [],
  overrides: {},
  includeDev: false,
  minScore: 0,
  ruleSeverity: {},
};

export const CONFIG_FILENAMES = [
  "licenselint.config.json",
  ".licenselintrc.json",
  ".licenselintrc",
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge<T>(base: T, override: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override ?? {})) {
    const current = out[key];
    if (isPlainObject(value) && isPlainObject(current)) {
      out[key] = deepMerge(current, value as Record<string, unknown>);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

export function loadConfig(explicitPath?: string, cwd = process.cwd()): LicenselintConfig {
  let file: string | undefined = explicitPath ? resolve(cwd, explicitPath) : undefined;
  if (!file) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = resolve(cwd, name);
      if (existsSync(candidate)) {
        file = candidate;
        break;
      }
    }
  }
  if (!file) return DEFAULT_CONFIG;
  if (!existsSync(file)) {
    throw new Error(`config file not found: ${file}`);
  }
  let parsed: Partial<LicenselintConfig>;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<LicenselintConfig>;
  } catch (e) {
    throw new Error(`invalid JSON in config ${file}: ${(e as Error).message}`);
  }
  return deepMerge(DEFAULT_CONFIG, parsed);
}
