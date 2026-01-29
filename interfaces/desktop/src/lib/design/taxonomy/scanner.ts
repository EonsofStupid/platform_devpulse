/**
 * @file ColdLight Build-Time Scanner
 * @package @devpulse/coldlight
 *
 * Scans folders to discover primitive kinds and verify 4-folder parity.
 * Loads contracts and generates the manifest.
 *
 * CORE PRINCIPLE: Folders are truth. Config drives everything.
 *
 * The scanner reads config.adapters.dsAdapter to know which adapter
 * folders to enforce. ColdLight public surface is always required.
 *
 * 4-Folder Parity (config-driven):
 *   1. {taxonomyRoot}/kinds/primitives/<kind>/                    - Contract (SSOT)
 *   2. {apiAdaptersRoot}/coldlight/<kind>/                        - ColdLight public API
 *   3. {apiAdaptersRoot}/{dsAdapter}/_internal/<kind>/            - dsAdapter mapping
 *   4. {primitivesRoot}/<kind>/                                   - Svelte component
 */

import type { ColdLightConfig } from "../coldlight.config";
import type {
  PrimitiveContract,
  ScanError,
  ScanResult,
  ColdLightManifest,
  ManifestPrimitive,
  PrimitiveScanResult,
  DsAdapterId,
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
// CONFIG-DERIVED PATHS
// =============================================================================

/**
 * All scanner paths derived from config. No hardcoded strings.
 */
function resolvePaths(config: ColdLightConfig) {
  const { designRoot, taxonomyRoot, apiAdaptersRoot, primitivesRoot } = config.roots;
  const dsAdapter = config.adapters.dsAdapter;

  return {
    /** Where taxonomy kind contracts live */
    taxonomyPrimitives: `${taxonomyRoot}/kinds/primitives`,
    /** ColdLight public adapter surface */
    coldlightApi: `${apiAdaptersRoot}/coldlight`,
    /** dsAdapter internal mapping (e.g. api/adapters/meltui/_internal) */
    dsAdapterInternal: `${apiAdaptersRoot}/${dsAdapter}/_internal`,
    /** Svelte component folders */
    primitives: primitivesRoot,
    /** Design root for contract loading */
    designRoot,
  };
}

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

function listKinds(fs: FsLike, taxonomyPrimitivesPath: string): string[] {
  try {
    return fs
      .readdirSync(taxonomyPrimitivesPath)
      .filter((name) => !name.startsWith("."))
      .filter((name) => !name.startsWith("_"))
      .filter((name) => isDir(fs, `${taxonomyPrimitivesPath}/${name}`));
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
// PARITY CHECK (config-driven)
// =============================================================================

/**
 * 4-folder parity check driven by config.
 * Checks: taxonomy contract, coldlight public API, dsAdapter _internal, svelte component.
 */
function checkParity(
  fs: FsLike,
  paths: ReturnType<typeof resolvePaths>,
  dsAdapter: DsAdapterId,
  kind: string
): PrimitiveScanResult {
  const kindPaths = {
    taxonomy: `${paths.taxonomyPrimitives}/${kind}`,
    coldlight: `${paths.coldlightApi}/${kind}`,
    dsAdapter: `${paths.dsAdapterInternal}/${kind}`,
    primitives: `${paths.primitives}/${kind}`,
  };

  const hasContract = isDir(fs, kindPaths.taxonomy);
  const hasColdlight = isDir(fs, kindPaths.coldlight);
  const hasDsAdapter = isDir(fs, kindPaths.dsAdapter);
  const hasPrimitivesDir = isDir(fs, kindPaths.primitives);
  const hasSvelteComponent = hasPrimitivesDir && containsSvelteFile(fs, kindPaths.primitives);

  const missingAdapters: DsAdapterId[] = [];
  if (!hasDsAdapter) missingAdapters.push(dsAdapter);

  const hasParity =
    hasContract &&
    hasColdlight &&
    hasDsAdapter &&
    hasPrimitivesDir &&
    hasSvelteComponent;

  return {
    kind,
    hasContract,
    hasColdlight,
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
  taxonomyPrimitivesPath: string,
  kind: string
): Promise<unknown> {
  const contractPath = `${taxonomyPrimitivesPath}/${kind}/contract.js`;
  const mod = await importFn(contractPath);
  return mod.default ?? mod.contract;
}

/**
 * Validate the generic PrimitiveContract shape.
 */
function isContractShape(x: unknown): x is PrimitiveContract {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;

  if (typeof c.kind !== "string") return false;
  if (c.ariaStateProvider !== "meltui" && c.ariaStateProvider !== "coldlight") return false;

  const slots = c.slots as Record<string, unknown> | undefined;
  if (!slots || typeof slots !== "object") return false;
  if (!Array.isArray(slots.required)) return false;
  if (!Array.isArray(slots.optional)) return false;
  if (!Array.isArray(slots.forbidden)) return false;

  const states = c.states as Record<string, unknown> | undefined;
  if (!states || typeof states !== "object") return false;
  if (!Array.isArray(states.shared)) return false;
  if (!Array.isArray(states.specific)) return false;

  if (!c.slotStates || typeof c.slotStates !== "object") return false;
  if (!c.slotActions || typeof c.slotActions !== "object") return false;

  const collections = c.collections as Record<string, unknown> | undefined;
  if (!collections || typeof collections.get !== "function") return false;

  return true;
}

/**
 * Convert a PrimitiveContract to a ManifestPrimitive for JSON serialization.
 * Unwinds collections.get() into flat aria/keyboard fields.
 */
function contractToManifest(contract: PrimitiveContract): ManifestPrimitive {
  const ariaCollection = contract.collections.get("aria") as {
    role?: string;
    requiredAttrs?: readonly string[];
    optionalAttrs?: readonly string[];
  } | undefined;

  const keyboardCollection = contract.collections.get("keyboard") as
    readonly string[] | undefined;

  const slotStates: Record<string, readonly string[]> = {};
  const allSlots = [...contract.slots.required, ...contract.slots.optional];
  allSlots.forEach((slot) => {
    const states = (contract.slotStates as Record<string, readonly string[]>)[slot];
    if (states) {
      slotStates[slot] = [...states];
    }
  });

  const slotActions: Record<string, readonly string[]> = {};
  allSlots.forEach((slot) => {
    const actions = (contract.slotActions as Record<string, readonly string[]>)[slot];
    if (actions) {
      slotActions[slot] = [...actions];
    }
  });

  return {
    kind: contract.kind,
    ariaStateProvider: contract.ariaStateProvider,
    slots: {
      required: [...contract.slots.required],
      optional: [...contract.slots.optional],
      forbidden: [...contract.slots.forbidden],
    },
    states: {
      shared: contract.states.shared.map(String),
      specific: contract.states.specific.map(String),
    },
    slotStates,
    slotActions,
    aria: {
      role: ariaCollection?.role ?? "",
      requiredAttrs: ariaCollection?.requiredAttrs ? [...ariaCollection.requiredAttrs] : [],
      optionalAttrs: ariaCollection?.optionalAttrs ? [...ariaCollection.optionalAttrs] : [],
    },
    keyboard: keyboardCollection ? [...keyboardCollection] : [],
  };
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

/**
 * Scan ColdLight primitives.
 *
 * Fully config-driven:
 * - Reads config.roots for all paths
 * - Reads config.adapters.dsAdapter for which adapter to enforce
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
  const paths = resolvePaths(config);
  const dsAdapter = config.adapters.dsAdapter as DsAdapterId;

  // Check if primitives category is enabled
  if (!config.generation.categories.primitives.enabled) {
    return { valid: true, primitives: [], errors: [], manifest: null };
  }

  // Discover kinds from filesystem
  const kinds = listKinds(fs, paths.taxonomyPrimitives);
  const manifestKinds: ManifestPrimitive[] = [];

  for (const kind of kinds) {
    // Check 4-folder parity (config-driven)
    const parityResult = checkParity(fs, paths, dsAdapter, kind);
    primitives.push(parityResult);

    if (!parityResult.hasParity) {
      if (!parityResult.hasContract) {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${paths.taxonomyPrimitives}/${kind}/`,
        });
      }
      if (!parityResult.hasColdlight) {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${paths.coldlightApi}/${kind}/`,
        });
      }
      parityResult.missingAdapters.forEach(() => {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${paths.dsAdapterInternal}/${kind}/`,
        });
      });
      if (!parityResult.hasSvelteComponent) {
        errors.push({
          code: "PARITY_MISSING_FOLDER",
          kind,
          detail: `${paths.primitives}/${kind}/*.svelte`,
        });
      }
    }

    // Load contract
    let contract: unknown;
    try {
      contract = await loadContract(importFn, paths.taxonomyPrimitives, kind);
    } catch {
      errors.push({
        code: "CONTRACT_LOAD_FAILED",
        kind,
        detail: `${paths.taxonomyPrimitives}/${kind}/contract.ts`,
      });
      continue;
    }

    // Validate contract shape
    if (!isContractShape(contract)) {
      errors.push({
        code: "CONTRACT_INVALID",
        kind,
        detail: `${paths.taxonomyPrimitives}/${kind}/contract.ts`,
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

  // Build manifest — dsAdapter from config
  const manifest: ColdLightManifest = {
    version: config.identity.version,
    generatedAt: new Date().toISOString(),
    adapters: {
      dsAdapter: config.adapters.dsAdapter,
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
export function scanPrimitiveKinds(fs: FsLike, config: ColdLightConfig): string[] {
  const paths = resolvePaths(config);
  return listKinds(fs, paths.taxonomyPrimitives);
}

/**
 * Scan a single primitive for parity.
 */
export function scanPrimitive(
  fs: FsLike,
  config: ColdLightConfig,
  kind: string
): PrimitiveScanResult {
  const paths = resolvePaths(config);
  const dsAdapter = config.adapters.dsAdapter as DsAdapterId;
  return checkParity(fs, paths, dsAdapter, kind);
}
