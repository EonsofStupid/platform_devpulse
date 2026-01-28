#!/usr/bin/env npx tsx
/**
 * @file ColdLight Manifest Verifier
 * @package @devpulse/coldlight
 *
 * Verifies that the committed manifest matches the current scan.
 * Used by lefthook pre-commit to ensure manifest is up to date.
 * Usage: pnpm coldlight:verify
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = path.resolve(__dirname, "../..");
const DESIGN_ROOT = path.resolve(DESKTOP_ROOT, "src/lib/design");

async function main() {
  console.log("[ColdLight] Verifying manifest...");

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
    console.error("[ColdLight] Verification failed - scan errors:");
    for (const err of result.errors) {
      console.error(`  [${err.code}] ${err.kind}: ${err.detail}`);
    }
    process.exit(1);
  }

  // Check if manifest file exists
  const manifestPath = path.resolve(
    DESKTOP_ROOT,
    coldlightConfig.generation.outputs.manifestJsonPath
  );

  if (!fs.existsSync(manifestPath)) {
    console.error("[ColdLight] Manifest file not found.");
    console.error(`  Expected: ${manifestPath}`);
    console.error("  Run 'pnpm coldlight:generate' first.");
    process.exit(1);
  }

  // Load committed manifest
  const committed = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const generated = result.manifest;

  if (!generated) {
    console.log("[ColdLight] No manifest to verify (categories disabled)");
    return;
  }

  // Compare (ignoring generatedAt timestamp)
  const committedNormalized = { ...committed, generatedAt: "__IGNORED__" };
  const generatedNormalized = { ...generated, generatedAt: "__IGNORED__" };

  const committedStr = JSON.stringify(committedNormalized, null, 2);
  const generatedStr = JSON.stringify(generatedNormalized, null, 2);

  if (committedStr !== generatedStr) {
    console.error("[ColdLight] Manifest is stale!");
    console.error("  The committed manifest does not match the current scan.");
    console.error("  Run 'pnpm coldlight:generate' and commit the changes.");
    process.exit(1);
  }

  console.log("[ColdLight] Manifest verified - up to date");
  console.log(`[ColdLight] ${generated.categories.primitives.kinds.length} primitives registered`);
}

main().catch((err) => {
  console.error("[ColdLight] Fatal error:", err);
  process.exit(1);
});
