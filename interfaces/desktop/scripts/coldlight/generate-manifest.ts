#!/usr/bin/env npx tsx
/**
 * @file ColdLight Manifest Generator
 * @package @devpulse/coldlight
 *
 * Runs the scanner and writes the manifest to disk.
 * Usage: pnpm coldlight:generate
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const DESIGN_ROOT = path.resolve(DESKTOP_ROOT, "src/lib/design");

async function main() {
  console.log("[ColdLight] Scanning primitives...");

  // Dynamic import to handle ES modules
  const { coldlightConfig } = await import(
    path.resolve(DESIGN_ROOT, "coldlight.config.js")
  );
  const { scanColdLight } = await import(
    path.resolve(DESIGN_ROOT, "taxonomy/scanner.js")
  );

  // Build import function that resolves relative to design root
  const importFn = async (p: string) => {
    const fullPath = path.resolve(DESKTOP_ROOT, p);
    return import(fullPath);
  };

  const result = await scanColdLight(fs, importFn, coldlightConfig);

  if (!result.valid) {
    console.error("[ColdLight] Scan failed with errors:");
    for (const err of result.errors) {
      console.error(`  [${err.code}] ${err.kind}: ${err.detail}`);
    }
    process.exit(1);
  }

  if (!result.manifest) {
    console.log("[ColdLight] No manifest generated (categories disabled)");
    return;
  }

  // Write manifest
  const outputPath = path.resolve(
    DESKTOP_ROOT,
    coldlightConfig.generation.outputs.manifestJsonPath
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result.manifest, null, 2) + "\n");
  console.log(`[ColdLight] Manifest written to ${outputPath}`);
  console.log(`[ColdLight] Found ${result.manifest.categories.primitives.kinds.length} primitives`);
}

main().catch((err) => {
  console.error("[ColdLight] Fatal error:", err);
  process.exit(1);
});
