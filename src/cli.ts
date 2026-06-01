#!/usr/bin/env node
/** licenselint command-line interface. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cac } from "cac";
import pkg from "../package.json";
import { DEFAULT_CONFIG, loadConfig } from "./config.js";
import { analyze, scanAndAnalyze } from "./index.js";
import { printReport } from "./report/console.js";
import { toJSON } from "./report/json.js";
import { toMarkdown } from "./report/markdown.js";
import { toSbom } from "./report/sbom.js";
import { toNotices } from "./report/notices.js";
import type { Report } from "./types.js";

const CONFIG_FILE = "licenselint.config.json";
const cli = cac("licenselint");

interface ScanOptions {
  config?: string;
  dev?: boolean;
  json?: string;
  md?: string;
  sbom?: string;
  notices?: string;
  minScore?: string;
  failOnIssues?: boolean;
  quiet?: boolean;
}

cli
  .command("scan [dir]", "Audit a project's dependency licenses (default: cwd)")
  .option("--config <file>", "Path to a config file")
  .option("--dev", "Include devDependencies")
  .option("--json <file>", "Write a JSON report")
  .option("--md <file>", "Write a Markdown report")
  .option("--sbom <file>", "Write a CycloneDX SBOM")
  .option("--notices <file>", "Write a THIRD-PARTY-NOTICES file")
  .option("--min-score <n>", "Exit non-zero if the overall score is below this (CI gate)")
  .option("--fail-on-issues", "Exit non-zero if there is any error-level issue")
  .option("--quiet", "Hide info-level issues in the console")
  .example("  licenselint scan")
  .example("  licenselint scan . --fail-on-issues --sbom sbom.json")
  .example("  licenselint scan ./app --json licenses.json --notices NOTICES.txt")
  .action((dir: string | undefined, options: ScanOptions) => {
    try {
      const config = loadConfig(options.config);
      if (options.dev) config.includeDev = true;
      const projectDir = resolve(dir ?? ".");

      const report = scanAndAnalyze(projectDir, config, { version: pkg.version });
      printReport(report, Boolean(options.quiet));

      if (options.json) {
        writeFileSync(resolve(options.json), toJSON(report));
        console.log(`\nWrote JSON report → ${options.json}`);
      }
      if (options.md) {
        writeFileSync(resolve(options.md), toMarkdown(report));
        console.log(`Wrote Markdown report → ${options.md}`);
      }
      if (options.sbom) {
        writeFileSync(resolve(options.sbom), toSbom(report));
        console.log(`Wrote SBOM → ${options.sbom}`);
      }
      if (options.notices) {
        writeFileSync(resolve(options.notices), toNotices(report));
        console.log(`Wrote third-party notices → ${options.notices}`);
      }

      const minScore = options.minScore !== undefined ? Number(options.minScore) : config.minScore;
      let failed = false;
      if (report.summary.score < minScore) {
        console.error(`\nlicenselint: score ${report.summary.score} is below the minimum ${minScore}.`);
        failed = true;
      }
      if (options.failOnIssues && report.summary.errors > 0) {
        console.error(`licenselint: ${report.summary.errors} error-level license issue(s) found.`);
        failed = true;
      }
      if (failed) process.exit(1);
    } catch (e) {
      console.error(`licenselint: ${(e as Error).message}`);
      process.exit(2);
    }
  });

cli
  .command("report <input>", "Re-render a saved JSON report (md | sbom | notices)")
  .option("--md <file>", "Write Markdown")
  .option("--sbom <file>", "Write a CycloneDX SBOM")
  .option("--notices <file>", "Write a THIRD-PARTY-NOTICES file")
  .action((input: string, options: { md?: string; sbom?: string; notices?: string }) => {
    try {
      const report = JSON.parse(readFileSync(resolve(input), "utf8")) as Report;
      let wrote = false;
      if (options.md) {
        writeFileSync(resolve(options.md), toMarkdown(report));
        console.log(`Wrote ${options.md}`);
        wrote = true;
      }
      if (options.sbom) {
        writeFileSync(resolve(options.sbom), toSbom(report));
        console.log(`Wrote ${options.sbom}`);
        wrote = true;
      }
      if (options.notices) {
        writeFileSync(resolve(options.notices), toNotices(report));
        console.log(`Wrote ${options.notices}`);
        wrote = true;
      }
      if (!wrote) process.stdout.write(toMarkdown(report));
    } catch (e) {
      console.error(`licenselint: ${(e as Error).message}`);
      process.exit(2);
    }
  });

cli
  .command("init", "Create a licenselint config file with sensible defaults")
  .option("--force", "Overwrite an existing config")
  .action((options: { force?: boolean }) => {
    const file = resolve(CONFIG_FILE);
    if (existsSync(file) && !options.force) {
      console.error(`licenselint: ${CONFIG_FILE} already exists (use --force to overwrite).`);
      process.exit(1);
    }
    const seeded = {
      ...DEFAULT_CONFIG,
      allow: ["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "Unlicense", "CC0-1.0"],
      deny: ["AGPL-3.0-only", "AGPL-3.0-or-later", "SSPL-1.0"],
    };
    writeFileSync(file, JSON.stringify(seeded, null, 2) + "\n");
    console.log(`Created ${CONFIG_FILE}`);
  });

cli.help();
cli.version(pkg.version);
cli.parse();
