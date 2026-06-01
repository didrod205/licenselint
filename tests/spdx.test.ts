import { describe, it, expect } from "vitest";
import { parseExpression, classifyId, normalizeId } from "../src/spdx.js";

describe("classifyId", () => {
  it("classifies common licenses", () => {
    expect(classifyId("MIT")).toBe("permissive");
    expect(classifyId("Apache-2.0")).toBe("permissive");
    expect(classifyId("MPL-2.0")).toBe("weak-copyleft");
    expect(classifyId("GPL-3.0-only")).toBe("copyleft");
    expect(classifyId("AGPL-3.0-or-later")).toBe("network-copyleft");
    expect(classifyId("BUSL-1.1")).toBe("proprietary");
    expect(classifyId("Made-Up-License")).toBe("unknown");
  });
});

describe("normalizeId", () => {
  it("maps deprecated ids and aliases", () => {
    expect(normalizeId("GPL-3.0")).toBe("GPL-3.0-only");
    expect(normalizeId("Apache 2.0")).toBe("Apache-2.0");
    expect(normalizeId("MIT License")).toBe("MIT");
  });
});

describe("parseExpression", () => {
  it("parses a single license", () => {
    const r = parseExpression("MIT");
    expect(r.ids).toEqual(["MIT"]);
    expect(r.class).toBe("permissive");
    expect(r.spdx).toBe(true);
  });

  it("takes the lighter side of an OR choice", () => {
    const r = parseExpression("(GPL-3.0-only OR MIT)");
    expect(r.class).toBe("permissive"); // can choose MIT
    expect(r.hasChoice).toBe(true);
    expect(r.ids.sort()).toEqual(["GPL-3.0-only", "MIT"]);
  });

  it("takes the worse side of an AND", () => {
    const r = parseExpression("MIT AND GPL-3.0-only");
    expect(r.class).toBe("copyleft");
  });

  it("ignores WITH exception clauses", () => {
    const r = parseExpression("GPL-2.0-or-later WITH Classpath-exception-2.0");
    expect(r.class).toBe("copyleft");
    expect(r.ids).toContain("GPL-2.0-or-later");
  });

  it("flags deprecated SPDX ids", () => {
    const r = parseExpression("GPL-2.0");
    expect(r.deprecated[0]).toEqual({ id: "GPL-2.0", replacement: "GPL-2.0-only" });
  });

  it("treats unlicensed markers and free text as unknown", () => {
    expect(parseExpression("").class).toBe("unknown");
    expect(parseExpression("UNLICENSED").class).toBe("unknown");
    expect(parseExpression("SEE LICENSE IN LICENSE").class).toBe("unknown");
    const free = parseExpression("Some Custom License");
    expect(free.spdx).toBe(false);
  });
});
