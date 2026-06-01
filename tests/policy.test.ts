import { describe, it, expect } from "vitest";
import { evaluate, evaluateAll } from "../src/policy.js";
import { DEFAULT_CONFIG } from "../src/config.js";
import { parseExpression } from "../src/spdx.js";
import type { Dependency, LicenselintConfig, RuleId } from "../src/types.js";

function dep(name: string, license: string, extra: Partial<Dependency> = {}): Dependency {
  const parsed = parseExpression(license);
  return {
    name,
    version: "1.0.0",
    license,
    licenseIds: parsed.ids,
    class: parsed.class,
    private: false,
    direct: true,
    ...extra,
  };
}

function rules(d: Dependency, config: LicenselintConfig = DEFAULT_CONFIG): Set<RuleId> {
  return new Set(evaluate(d, config).map((i) => i.rule));
}

describe("evaluate", () => {
  it("passes a permissive license under default policy", () => {
    expect(evaluate(dep("ok", "MIT"), DEFAULT_CONFIG)).toHaveLength(0);
  });

  it("fails copyleft and network-copyleft under default failOn", () => {
    expect(rules(dep("g", "GPL-3.0-only")).has("copyleft-license")).toBe(true);
    expect(rules(dep("a", "AGPL-3.0-or-later")).has("network-copyleft-license")).toBe(true);
  });

  it("honours the deny list (terminal)", () => {
    const config = { ...DEFAULT_CONFIG, deny: ["MIT"] };
    const issues = evaluate(dep("x", "MIT"), config);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.rule).toBe("denied-license");
  });

  it("enforces an allowlist", () => {
    const config = { ...DEFAULT_CONFIG, allow: ["MIT"], failOn: [] };
    expect(rules(dep("ok", "MIT"), config).size).toBe(0);
    expect(rules(dep("no", "Apache-2.0"), config).has("not-allowed-license")).toBe(true);
  });

  it("flags missing and unknown licenses", () => {
    expect(rules(dep("none", "")).has("missing-license")).toBe(true);
    expect(rules(dep("weird", "Some Custom License")).has("unknown-license")).toBe(true);
  });

  it("flags deprecated SPDX as info", () => {
    const issues = evaluate(dep("d", "GPL-2.0"), { ...DEFAULT_CONFIG, failOn: [] });
    const dep1 = issues.find((i) => i.rule === "deprecated-spdx");
    expect(dep1?.severity).toBe("info");
  });

  it("respects ruleSeverity overrides", () => {
    const config = { ...DEFAULT_CONFIG, ruleSeverity: { "copyleft-license": "warning" as const } };
    const issue = evaluate(dep("g", "GPL-3.0-only"), config).find((i) => i.rule === "copyleft-license");
    expect(issue?.severity).toBe("warning");
  });
});

describe("evaluateAll", () => {
  it("aggregates issues across deps", () => {
    const issues = evaluateAll(
      [dep("a", "MIT"), dep("b", "GPL-3.0-only"), dep("c", "")],
      DEFAULT_CONFIG,
    );
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });
});
