/** SPDX license classification (curated subset, declarative). */

import type { LicenseClass } from "./types.js";

/**
 * Maps SPDX license identifiers to a risk class. Not exhaustive, but covers the
 * licenses that account for the vast majority of npm dependencies plus the
 * high-risk ones a compliance check cares about most.
 */
export const LICENSE_CLASS: Record<string, LicenseClass> = {
  // Public domain / equivalent
  "0BSD": "permissive",
  Unlicense: "public-domain",
  "CC0-1.0": "public-domain",
  "WTFPL": "public-domain",

  // Permissive
  MIT: "permissive",
  "MIT-0": "permissive",
  ISC: "permissive",
  "Apache-2.0": "permissive",
  "Apache-1.1": "permissive",
  "BSD-2-Clause": "permissive",
  "BSD-3-Clause": "permissive",
  "BSD-3-Clause-Clear": "permissive",
  "BSD-4-Clause": "permissive",
  Zlib: "permissive",
  "X11": "permissive",
  "BlueOak-1.0.0": "permissive",
  "Python-2.0": "permissive",
  "PostgreSQL": "permissive",
  "Artistic-2.0": "permissive",
  "UPL-1.0": "permissive",
  "NCSA": "permissive",
  "MPL-1.0": "weak-copyleft",

  // Weak / file-level copyleft
  "MPL-2.0": "weak-copyleft",
  "LGPL-2.0-only": "weak-copyleft",
  "LGPL-2.0-or-later": "weak-copyleft",
  "LGPL-2.1-only": "weak-copyleft",
  "LGPL-2.1-or-later": "weak-copyleft",
  "LGPL-3.0-only": "weak-copyleft",
  "LGPL-3.0-or-later": "weak-copyleft",
  "EPL-1.0": "weak-copyleft",
  "EPL-2.0": "weak-copyleft",
  "CDDL-1.0": "weak-copyleft",
  "CDDL-1.1": "weak-copyleft",
  "OSL-3.0": "weak-copyleft",

  // Strong copyleft
  "GPL-2.0-only": "copyleft",
  "GPL-2.0-or-later": "copyleft",
  "GPL-3.0-only": "copyleft",
  "GPL-3.0-or-later": "copyleft",
  "EUPL-1.1": "copyleft",
  "EUPL-1.2": "copyleft",

  // Network copyleft
  "AGPL-3.0-only": "network-copyleft",
  "AGPL-3.0-or-later": "network-copyleft",
  "SSPL-1.0": "network-copyleft",
  "OSL-3.0-network": "network-copyleft",

  // Source-available / restricted (treated as proprietary risk)
  "BUSL-1.1": "proprietary",
  "Elastic-2.0": "proprietary",
  "CC-BY-NC-4.0": "proprietary",
  "CC-BY-NC-SA-4.0": "proprietary",
};

/** Deprecated SPDX ids mapped to their current replacement. */
export const DEPRECATED_SPDX: Record<string, string> = {
  "GPL-2.0": "GPL-2.0-only",
  "GPL-3.0": "GPL-3.0-only",
  "LGPL-2.1": "LGPL-2.1-only",
  "LGPL-3.0": "LGPL-3.0-only",
  "AGPL-3.0": "AGPL-3.0-only",
  "GPL-2.0+": "GPL-2.0-or-later",
  "GPL-3.0+": "GPL-3.0-or-later",
  "LGPL-2.1+": "LGPL-2.1-or-later",
  "Nunit": "Nunit",
  "wxWindows": "WXwindows",
  "BSD": "BSD-2-Clause",
};

/** Common non-SPDX strings that nonetheless tell us the intent. */
export const ALIASES: Record<string, string> = {
  MIT: "MIT",
  "MIT License": "MIT",
  "MIT/X11": "MIT",
  ISC: "ISC",
  "Apache": "Apache-2.0",
  "Apache2": "Apache-2.0",
  "Apache 2.0": "Apache-2.0",
  "Apache License 2.0": "Apache-2.0",
  "BSD": "BSD-2-Clause",
  "New BSD": "BSD-3-Clause",
  "Public Domain": "Unlicense",
  "GPL": "GPL-3.0-or-later",
  "GPLv3": "GPL-3.0-only",
  "LGPL": "LGPL-3.0-or-later",
  "AGPL": "AGPL-3.0-or-later",
  "WTFPL": "WTFPL",
};

/** Strings that mean "no real license". */
export const UNLICENSED_MARKERS = new Set([
  "",
  "UNLICENSED",
  "UNKNOWN",
  "SEE LICENSE IN LICENSE",
  "NONE",
  "Nned",
]);
