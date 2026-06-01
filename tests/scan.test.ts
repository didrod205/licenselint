import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { scanProject } from "../src/scan/index.js";
import { licenseFromPackageJson } from "../src/scan/readPackage.js";
import { DEFAULT_CONFIG } from "../src/config.js";

const PROJECT = resolve(__dirname, "../examples/sample-project");

describe("licenseFromPackageJson", () => {
  it("reads the string form", () => {
    expect(licenseFromPackageJson({ license: "MIT" })).toBe("MIT");
  });

  it("reads the legacy object form", () => {
    expect(licenseFromPackageJson({ license: { type: "ISC" } })).toBe("ISC");
  });

  it("reads the legacy licenses array form", () => {
    expect(licenseFromPackageJson({ licenses: [{ type: "MIT" }, { type: "Apache-2.0" }] })).toBe(
      "(MIT OR Apache-2.0)",
    );
  });

  it("returns empty string when none", () => {
    expect(licenseFromPackageJson({})).toBe("");
  });
});

describe("scanProject", () => {
  it("walks node_modules and classifies licenses", () => {
    const deps = scanProject(PROJECT, DEFAULT_CONFIG);
    const byName = Object.fromEntries(deps.map((d) => [d.name, d]));
    expect(byName["left-pad"]?.class).toBe("permissive");
    expect(byName["copyleft-lib"]?.class).toBe("copyleft");
    expect(byName["network-share"]?.class).toBe("network-copyleft");
    expect(byName["mystery-pkg"]?.class).toBe("unknown");
    // scoped package is discovered
    expect(byName["@acme/widgets"]).toBeDefined();
    // transitive (nested node_modules) is discovered
    expect(byName["json-helper"]?.class).toBe("permissive");
  });

  it("excludes devDependencies by default and includes them with includeDev", () => {
    const without = scanProject(PROJECT, DEFAULT_CONFIG);
    expect(without.some((d) => d.name === "test-runner")).toBe(false);
    const withDev = scanProject(PROJECT, { ...DEFAULT_CONFIG, includeDev: true });
    expect(withDev.some((d) => d.name === "test-runner")).toBe(true);
  });

  it("applies overrides and excludes", () => {
    const overridden = scanProject(PROJECT, {
      ...DEFAULT_CONFIG,
      overrides: { "mystery-pkg": "MIT" },
    });
    expect(overridden.find((d) => d.name === "mystery-pkg")?.class).toBe("permissive");

    const excluded = scanProject(PROJECT, { ...DEFAULT_CONFIG, exclude: ["network-share"] });
    expect(excluded.some((d) => d.name === "network-share")).toBe(false);
  });

  it("is deterministic and sorted by name", () => {
    const a = scanProject(PROJECT, DEFAULT_CONFIG).map((d) => d.name);
    const b = scanProject(PROJECT, DEFAULT_CONFIG).map((d) => d.name);
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort((x, y) => x.localeCompare(y)));
  });
});
