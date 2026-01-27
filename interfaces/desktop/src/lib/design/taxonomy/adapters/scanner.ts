/**
 * @file Primitives Scanner
 * @description Scans FOLDERS to discover primitive kinds and verify 4-folder parity.
 *
 * CORE PRINCIPLE: Folders are truth.
 *
 * The scanner reads folder names to discover primitives - not file contents,
 * not imports, not hardcoded arrays. A primitive exists because its folder exists.
 *
 * 4-Folder Parity requires:
 *   1. taxonomy/primitives/<kind>/     - Contract (SSOT)
 *   2. api/adapters/coldlight/_internal/<kind>/  - ColdLight API
 *   3. api/adapters/meltui/_internal/<kind>/     - MeltUI mapping
 *   4. primitives/<kind>/              - Svelte component (with .svelte file)
 */

import type {
  AdapterId,
  PrimitiveScanResult,
  RegistryScanResult,
} from "./types";

// =============================================================================
// PATHS
// =============================================================================

/**
 * Paths relative to src/lib/design/
 * These define the 4 locations for parity.
 */
const PATHS = {
  taxonomyPrimitives: "taxonomy/primitives",
  coldlightInternal: "api/adapters/coldlight/_internal",
  meltuiInternal: "api/adapters/meltui/_internal",
  primitives: "primitives",
} as const;

/**
 * Folders to ignore when scanning for primitive kinds.
 */
const IGNORE_FOLDERS = new Set(["_archive", ".claude", "node_modules"]);

// =============================================================================
// FILESYSTEM HELPERS
// =============================================================================

type FSModule = typeof import("node:fs");

/**
 * Check if a path exists and is a directory.
 */
function isDirectory(fs: FSModule, path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Get child folder names (not files, not ignored folders).
 */
function getChildFolders(fs: FSModule, dirPath: string): string[] {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => !name.startsWith("."))
      .filter((name) => !IGNORE_FOLDERS.has(name));
  } catch {
    return [];
  }
}

/**
 * Check if a directory contains at least one .svelte file.
 */
function containsSvelteFile(fs: FSModule, dirPath: string): boolean {
  try {
    return fs
      .readdirSync(dirPath)
      .some((name) => name.endsWith(".svelte"));
  } catch {
    return false;
  }
}

// =============================================================================
// SCANNER API
// =============================================================================

/**
 * Scan taxonomy/primitives/ to discover all primitive kinds.
 *
 * @param fs - Node fs module
 * @param basePath - Path to src/lib/design/
 * @returns Array of primitive kind names (folder names)
 */
export function scanPrimitiveKinds(fs: FSModule, basePath: string): string[] {
  const primitivesPath = `${basePath}/${PATHS.taxonomyPrimitives}`;
  return getChildFolders(fs, primitivesPath);
}

/**
 * Scan a single primitive for 4-folder parity.
 *
 * @param fs - Node fs module
 * @param basePath - Path to src/lib/design/
 * @param kind - Primitive kind to check
 * @returns Parity scan result
 */
export function scanPrimitive(
  fs: FSModule,
  basePath: string,
  kind: string
): PrimitiveScanResult {
  // Build paths for all 4 required locations
  const paths = {
    taxonomy: `${basePath}/${PATHS.taxonomyPrimitives}/${kind}`,
    coldlight: `${basePath}/${PATHS.coldlightInternal}/${kind}`,
    meltui: `${basePath}/${PATHS.meltuiInternal}/${kind}`,
    primitives: `${basePath}/${PATHS.primitives}/${kind}`,
  };

  // Check each location
  const hasContract = isDirectory(fs, paths.taxonomy);
  const hasColdlight = isDirectory(fs, paths.coldlight);
  const hasMeltui = isDirectory(fs, paths.meltui);
  const hasPrimitivesDir = isDirectory(fs, paths.primitives);
  const hasSvelteComponent = hasPrimitivesDir && containsSvelteFile(fs, paths.primitives);

  // Collect missing adapters
  const missingAdapters: AdapterId[] = [];
  if (!hasColdlight) missingAdapters.push("coldlight");
  if (!hasMeltui) missingAdapters.push("meltui");

  // Full parity requires all 4 folders + svelte file
  const hasParity =
    hasContract &&
    hasColdlight &&
    hasMeltui &&
    hasPrimitivesDir &&
    hasSvelteComponent;

  return {
    kind,
    hasContract,
    hasSvelteComponent,
    missingAdapters,
    hasParity,
  };
}

/**
 * Scan the full registry - all primitives and their parity status.
 *
 * @param fs - Node fs module
 * @param basePath - Path to src/lib/design/
 * @returns Full registry scan result
 */
export function scanRegistry(fs: FSModule, basePath: string): RegistryScanResult {
  const kinds = scanPrimitiveKinds(fs, basePath);
  const primitives: PrimitiveScanResult[] = [];
  const errors: string[] = [];

  for (const kind of kinds) {
    const result = scanPrimitive(fs, basePath, kind);
    primitives.push(result);

    // Collect human-readable error messages
    if (!result.hasParity) {
      if (!result.hasContract) {
        errors.push(`${kind}: missing ${PATHS.taxonomyPrimitives}/${kind}/`);
      }
      for (const adapterId of result.missingAdapters) {
        const adapterPath = adapterId === "coldlight"
          ? PATHS.coldlightInternal
          : PATHS.meltuiInternal;
        errors.push(`${kind}: missing ${adapterPath}/${kind}/`);
      }
      if (!result.hasSvelteComponent) {
        errors.push(`${kind}: missing ${PATHS.primitives}/${kind}/*.svelte`);
      }
    }
  }

  return {
    primitives,
    adapters: ["coldlight", "meltui"],
    valid: primitives.length > 0 && primitives.every((p) => p.hasParity),
    errors,
  };
}
