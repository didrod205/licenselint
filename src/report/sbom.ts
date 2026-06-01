/** CycloneDX-style SBOM (Software Bill of Materials) export. */

import type { Report } from "../types.js";

/**
 * Emit a minimal CycloneDX 1.5 JSON SBOM listing every component and its
 * license. This is a widely-accepted format for supply-chain/compliance tools.
 * `serialNumber`/timestamps are taken from the report so output is deterministic.
 */
export function toSbom(report: Report): string {
  const components = report.dependencies.map((d) => {
    const licenses = d.licenseIds.length
      ? d.licenseIds.map((id) => ({ license: { id } }))
      : [{ license: { name: d.license } }];
    return {
      type: "library",
      name: d.name,
      version: d.version,
      purl: `pkg:npm/${encodeURIComponent(d.name)}@${d.version}`,
      licenses,
    };
  });

  const doc = {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    version: 1,
    metadata: {
      timestamp: report.generatedAt,
      tools: [{ vendor: "licenselint", name: "licenselint", version: report.version }],
    },
    components,
  };
  return JSON.stringify(doc, null, 2) + "\n";
}
