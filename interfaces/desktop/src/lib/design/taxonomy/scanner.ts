/**
 * @file ColdLight Build-Time Scanner
 * @package @devpulse/coldlight
 *
 * Scans folders to discover primitive kinds and verify 4-folder parity.
 * Loads contracts and generates the manifest.
 *
 * CORE PRINCIPLE: Folders are truth.
 *
 * 4-Folder Parity requires:
 *   1. taxonomy/kinds/primitives/<kind>/     - Contract (SSOT)
 *   2. api/adapters/coldlight/<kind>/        - ColdLight public API
 *   3. api/adapters/meltui/_internal/<kind>/ - MeltUI mapping
 *   4. primitives/<kind>/                    - Svelte component
 */

import type { ColdLightConfig } from "../coldlight.config";
import type {
  PrimitiveContract,
  ScanError,
  ScanResult,
  ColdLightManifest,
  ManifestPrimitive,
  PrimitiveScanResult,
  AdapterId,
} from "./types";

// =============================================================================
// FILESYSTEM ABSTRACTION
// =============================================================================

export type FsLike = {
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory: () => boolean };
  existsSync: (path: string) => boolean;
};

export type ImportLike = (path: string) => Promise<{ default?: unknown; contract?: unknown }>;

// =============================================================================
// PATHS
// =============================================================================

const PATHS = {
  taxonomyPrimitives: "taxonomy/kinds/primitives",
  apiColdlight: "api/adapters/coldlight",
  apiMeltuiInternal: "api/adapters/meltui/_internal",
  primitives: "primitives",
} as const;

// =============================================================================
// FILESYSTEM HELPERS
// =============================================================================

function isDir(fs: FsLike, path: string): boolean {
  try {
    return fs.statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function listKinds(fs: FsLike, baseDesignRoot: string): string[] {
  const root = `${baseDesignRoot}/${PATHS.taxonomyPrimitives}`;
  try {
    return fs
      .readdirSync(root)
      .filter((name) => !name.startsWith("."))
      .filter((name) => !name.startsWith("_"))
      .filter((name) => isDir(fs, `${root}/${name}`));
  } catch {
    return [];
  }
}

function containsSvelteFile(fs: FsLike, dirPath: string): boolean {
  try {
    return fs
      .readdirSync(dirPath)
      .some((name) => name.endsWith(".svelte"));
  } catch {
    return false;
  }
}

// =============================================================================
// PARITY CHECK
// =============================================================================

/**
 * 4-folder parity check.
 * Returns detailed result for a single primitive.
 */
function checkParity(
  fs: FsLike,
  baseDesignRoot: string,
  kind: string
): PrimitiveScanResult {
  const paths = {
    taxonomy: `${baseDesignRoot}/${PATHS.taxonomyPrimitives}/${kind}`,
    coldlight: `${baseDesignRoot}/${PATHS.apiColdlight}/${kind}`,
    meltui: `${baseDesignRoot}/${PATHS.apiMeltuiInternal}/${kind}`,
    primitives: `${baseDesignRoot}/${PATHS.primitives}/${kind}`,
  };

  const hasContract = isDir(fs, paths.taxonomy);
  const hasColdlight = isDir(fs, paths.coldlight);
  const hasMeltui = isDir(fs, paths.meltui);
  const hasPrimitivesDir = isDir(fs, paths.primitives);
  const hasSvelteComponent = hasPrimitivesDir && containsSvelteFile(fs, paths.primitives);

  const missingAdapters: AdapterId[] = [];
  if (!hasColdlight) missingAdapters.push("coldlight");
  if (!hasMeltui) missingAdapters.push("meltui");

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

// =============================================================================
// CONTRACT LOADING
// =============================================================================

async function loadContract(
  importFn: ImportLike,
  baseDesignRoot: string,
  kind: string
): Promise<unknown> {
  const contractPath = `${baseDesignRoot}/${PATHS.taxonomyPrimitives}/${kind}/contract.js`;
  const mod = await importFn(contractPath);
  return mod.default ?? mod.contract;
}

function isContractShape(x: unknown): x is PrimitiveContract {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.kind === "string" &&
    Array.isArray(c.slots) &&
    Array.isArray(c.requiredSlots) &&
    Array.isArray(c.states) &&
    c.aria !== undefined &&
    typeof (c.aria as Record<string, unknown>).role === "string" &&
    Array.isArray(c.keyboard) &&
    (c.provider === "meltui" || c.provider === "custom")
  );
}

function contractToManifest(contract: PrimitiveContract): ManifestPrimitive {
  return {
    kind: contract.kind,
    provider: contract.provider,
    slots: [...contract.slots],
    requiredSlots: [...contract.requiredSlots],
    states: contract.states.map(String),
    aria: {
      role: contract.aria.role,
      requiredAttrs: [...contract.aria.requiredAttrs],
    },
    keyboard: [...contract.keyboard],
  };
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

/**
 * Scan ColdLight primitives.
 *
 * - Reads config for paths and settings
 * - Scans taxonomy/kinds/primitives/ for kinds
 * - Checks 4-folder parity for each kind
 * - Loads and validates contracts
 * - Returns manifest or errors
 */
export async function scanColdLight(
  fs: FsLike,
  importFn: ImportLike,
  config: ColdLightConfig
): Promise<ScanResult> {
  const errors: ScanError[] = [];
  const primitives: PrimitiveScanResult[] = [];
  const baseDesignRoot = config.roots.designRoot;

  // Check if primitives category is enabled
  if (!config.generation.categories.primitives.enabled) {
    return { valid: true, primitives: [], errors: [], manifest: null };
  }

  // Discover kinds from filesystem
  const kinds = listKinds(fs, baseDesignRoot);
  const manifestKinds: ManifestPrimitive[] = [];

  for (const kind of kinds) {
    // Check 4-folder parity
    const parityResult = checkParity(fs, baseDesignRoot, kind);
    primitives.push(parityResult);

    if (!parityResult.hasParity) {
      if (!parityResult.hasContract) {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${PATHS.taxonomyPrimitives}/${kind}/`,
        });
      }
      for (const adapterId of parityResult.missingAdapters) {
        const adapterPath = adapterId === "coldlight"
          ? PATHS.apiColdlight
          : PATHS.apiMeltuiInternal;
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${adapterPath}/${kind}/`,
        });
      }
      if (!parityResult.hasSvelteComponent) {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${PATHS.primitives}/${kind}/*.svelte`,
        });
      }
    }

    // Load contract
    let contract: unknown;
    try {
      contract = await loadContract(importFn, baseDesignRoot, kind);
    } catch {
      errors.push({
        code: "CONTRACT_LOAD_FAILED",
        kind,
        detail: `${PATHS.taxonomyPrimitives}/${kind}/contract.ts`,
      });
      continue;
    }

    // Validate contract shape
    if (!isContractShape(contract)) {
      errors.push({
        code: "CONTRACT_INVALID",
        kind,
        detail: `${PATHS.taxonomyPrimitives}/${kind}/contract.ts`,
      });
      continue;
    }

    // Add to manifest
    manifestKinds.push(contractToManifest(contract));
  }

  const valid = errors.length === 0;

  // Early exit if parity failures and strict mode
  if (!valid && config.enforcement.failOnParity) {
    return { valid: false, primitives, errors, manifest: null };
  }

  // Build manifest
  const manifest: ColdLightManifest = {
    version: config.identity.version,
    generatedAt: new Date().toISOString(),
    adapters: {
      enabled: [...config.adapters.enabled],
      defaultActive: config.adapters.defaultActive,
      ariaStateProvider: config.adapters.ariaStateProvider,
    },
    categories: {
      primitives: { kinds: manifestKinds },
    },
  };

  // Early exit if contract load failures and strict mode
  if (!valid && config.enforcement.failOnContractLoad) {
    return { valid: false, primitives, errors, manifest: null };
  }

  return { valid, primitives, errors, manifest };
}

/**
 * Scan primitive kinds only (no contract loading).
 * Faster check for quick parity validation.
 */
export function scanPrimitiveKinds(fs: FsLike, basePath: string): string[] {
  return listKinds(fs, basePath);
}

/**
 * Scan a single primitive for parity.
 */
export function scanPrimitive(
  fs: FsLike,
  basePath: string,
  kind: string
): PrimitiveScanResult {
  return checkParity(fs, basePath, kind);
}
