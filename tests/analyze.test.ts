import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { scanAndAnalyze, analyze, toJSON, toMarkdown, toSbom, toNotices, gradeFor } from "../src/index.js";
import { scanProject } from "../src/scan/index.js";
import { DEFAULT_CONFIG } from "../src/config.js";

const PROJECT = resolve(__dirname, "../examples/sample-project");

describe("scanAndAnalyze", () => {
  const report = scanAndAnalyze(PROJECT, DEFAULT_CONFIG, { version: "9.9.9" });

  it("summarizes the project", () => {
    expect(report.tool).toBe("licenselint");
    expect(report.version).toBe("9.9.9");
    expect(report.summary.dependencies).toBeGreaterThan(4);
    expect(report.summary.errors).toBeGreaterThan(0);
  });

  it("breaks licenses down by class", () => {
    const classes = new Set(report.summary.byClass.map((b) => b.class));
    expect(classes.has("permissive")).toBe(true);
    expect(classes.has("copyleft")).toBe(true);
    expect(classes.has("network-copyleft")).toBe(true);
  });

  it("lists licenses in use sorted by count", () => {
    expect(report.summary.licenses.length).toBeGreaterThan(0);
    const counts = report.summary.licenses.map((l) => l.count);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("is deterministic", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const a = scanAndAnalyze(PROJECT, DEFAULT_CONFIG, { now });
    const b = scanAndAnalyze(PROJECT, DEFAULT_CONFIG, { now });
    expect(toJSON(a)).toBe(toJSON(b));
  });
});

describe("report renderers", () => {
  const deps = scanProject(PROJECT, DEFAULT_CONFIG);
  const report = analyze(deps, DEFAULT_CONFIG, {
    version: "1.0.0",
    now: new Date("2026-01-01T00:00:00Z"),
  });

  it("renders JSON", () => {
    expect(JSON.parse(toJSON(report)).tool).toBe("licenselint");
  });

  it("renders Markdown with breakdown and issues", () => {
    const md = toMarkdown(report);
    expect(md).toContain("# licenselint report");
    expect(md).toContain("## License breakdown");
    expect(md).toContain("## Issues");
  });

  it("renders a CycloneDX SBOM", () => {
    const sbom = JSON.parse(toSbom(report));
    expect(sbom.bomFormat).toBe("CycloneDX");
    expect(sbom.specVersion).toBe("1.5");
    expect(sbom.components.length).toBe(report.dependencies.length);
    expect(sbom.components[0].purl).toMatch(/^pkg:npm\//);
  });

  it("renders third-party notices grouped by license", () => {
    const notices = toNotices(report);
    expect(notices).toContain("THIRD-PARTY SOFTWARE NOTICES");
    expect(notices).toContain("License:");
  });
});

describe("gradeFor", () => {
  it("maps scores to grades", () => {
    expect(gradeFor(95)).toBe("A");
    expect(gradeFor(0)).toBe("F");
  });
});
