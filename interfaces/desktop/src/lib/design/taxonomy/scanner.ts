/**
 * @file ColdLight Build-Time Scanner
 * @package @devpulse/coldlight
 *
 * Scans folders to discover primitive kinds and verify contract-aware parity.
 * Loads contracts and generates the manifest.
 *
 * CORE PRINCIPLE: Folders are truth. Config drives everything.
 *
 * The scanner reads config.adapters.active to know which adapter
 * folders to enforce. Parity mode is determined per-kind by the
 * contract's ariaStateProvider field.
 *
 * Contract-Aware Parity:
 *   ariaStateProvider: "meltui"    → 3-folder parity
 *     1. {taxonomyRoot}/kinds/primitives/<kind>/          - Contract (SSOT)
 *     2. {apiRoot}/adapters/{active}/_internal/<kind>/    - Adapter mapping
 *     3. {primitivesRoot}/<kind>/                         - Svelte component
 *
 *   ariaStateProvider: "coldlight" → 2-folder parity
 *     1. {taxonomyRoot}/kinds/primitives/<kind>/   - Contract (SSOT)
 *     2. {primitivesRoot}/<kind>/                   - Svelte component
 *
 * Spine Validation:
 *   taxonomy/api/adapter/ ↔ api/adapters/ must match 1:1.
 *   No orphans in either direction.
 */

import type { ColdLightConfig } from "../coldlight.config.js";
import type {
	AriaStateProvider,
	PrimitiveContract,
	ScanError,
	ScanResult,
	ColdLightManifest,
	ManifestPrimitive,
	PrimitiveScanResult,
	DsAdapterId,
	StateToken,
	SlotAction,
} from "./types.js";

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
 *
 * Naming convention:
 *   cl*      = ColdLight declarations (taxonomy side)
 *   dsAdapter = implementation side
 */
function resolvePaths(config: ColdLightConfig) {
	const { designRoot, taxonomyRoot, apiRoot, primitivesRoot } = config.roots;
	const active = config.adapters.active;

	return {
		/** ColdLight declarations: primitive kind contracts */
		clPrimitives: `${taxonomyRoot}/kinds/primitives`,
		/** ColdLight declarations: adapter taxonomy folders */
		clAdapters: `${taxonomyRoot}/api/adapter`,
		/** Active adapter _internal folders (e.g. api/adapters/meltui/_internal) */
		dsAdapter: `${apiRoot}/adapters/${active}/_internal`,
		/** All API adapters root (for spine validation) */
		apiAdapters: `${apiRoot}/adapters`,
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

function listSubfolders(fs: FsLike, dirPath: string): string[] {
	try {
		return fs
			.readdirSync(dirPath)
			.filter((name) => !name.startsWith("."))
			.filter((name) => !name.startsWith("_"))
			.filter((name) => isDir(fs, `${dirPath}/${name}`));
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
// SPINE VALIDATION
// =============================================================================

/**
 * Validate spine: taxonomy/api/adapter/ ↔ api/adapters/ must match 1:1.
 * No orphans in either direction. Runs once per scan, not per-kind.
 */
function validateSpine(
	fs: FsLike,
	paths: ReturnType<typeof resolvePaths>
): ScanError[] {
	const errors: ScanError[] = [];

	const taxonomyAdapterFolders = listSubfolders(fs, paths.clAdapters);
	const apiAdapterFolders = listSubfolders(fs, paths.apiAdapters);

	taxonomyAdapterFolders.forEach((name) => {
		if (!apiAdapterFolders.includes(name)) {
			errors.push({
				code: "SPINE_MISMATCH",
				kind: name,
				detail: `Taxonomy declares adapter "${name}" at ${paths.clAdapters}/${name}/ but no implementation at ${paths.apiAdapters}/${name}/`,
			});
		}
	});

	apiAdapterFolders.forEach((name) => {
		if (!taxonomyAdapterFolders.includes(name)) {
			errors.push({
				code: "SPINE_MISMATCH",
				kind: name,
				detail: `Implementation exists at ${paths.apiAdapters}/${name}/ but no taxonomy declaration at ${paths.clAdapters}/${name}/`,
			});
		}
	});

	return errors;
}

// =============================================================================
// PARITY CHECK (contract-aware)
// =============================================================================

/**
 * Contract-aware parity check.
 *
 * ariaStateProvider: "meltui"    → 3-folder (taxonomy + dsAdapter + primitives)
 * ariaStateProvider: "coldlight" → 2-folder (taxonomy + primitives)
 */
function checkParity(
	fs: FsLike,
	paths: ReturnType<typeof resolvePaths>,
	dsAdapter: DsAdapterId,
	kind: string,
	ariaStateProvider: AriaStateProvider
): PrimitiveScanResult {
	const kindPaths = {
		clPrimitive: `${paths.clPrimitives}/${kind}`,
		dsAdapter: `${paths.dsAdapter}/${kind}`,
		primitive: `${paths.primitives}/${kind}`,
	};

	const hasContract = isDir(fs, kindPaths.clPrimitive);
	const hasDsAdapter = isDir(fs, kindPaths.dsAdapter);
	const hasPrimitivesDir = isDir(fs, kindPaths.primitive);
	const hasSvelteComponent = hasPrimitivesDir && containsSvelteFile(fs, kindPaths.primitive);

	const missingAdapters: DsAdapterId[] = [];
	if (ariaStateProvider === "meltui" && !hasDsAdapter) {
		missingAdapters.push(dsAdapter);
	}

	let hasParity: boolean;
	if (ariaStateProvider === "meltui") {
		hasParity = hasContract && hasDsAdapter && hasPrimitivesDir && hasSvelteComponent;
	} else {
		hasParity = hasContract && hasPrimitivesDir && hasSvelteComponent;
	}

	return {
		kind,
		ariaStateProvider,
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
	clPrimitivesPath: string,
	kind: string
): Promise<unknown> {
	const contractPath = `${clPrimitivesPath}/${kind}/contract.js`;
	const mod = await importFn(contractPath);
	return mod.default ?? mod.contract;
}

/**
 * Validate the generic PrimitiveContract shape.
 * Checks direct typed fields — no collections.get() indirection.
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

	const aria = c.aria as Record<string, unknown> | undefined;
	if (!aria || typeof aria !== "object") return false;
	if (typeof aria.role !== "string") return false;
	if (!Array.isArray(aria.requiredAttrs)) return false;
	if (!Array.isArray(aria.optionalAttrs)) return false;

	if (!Array.isArray(c.keyboard)) return false;

	return true;
}

/**
 * Convert a PrimitiveContract to a ManifestPrimitive for JSON serialization.
 * Direct field access — no collections unwinding needed.
 */
function contractToManifest(contract: PrimitiveContract): ManifestPrimitive {
	const slotStates: ManifestPrimitive["slotStates"] = {};
	const allSlots = [...contract.slots.required, ...contract.slots.optional];
	allSlots.forEach((slot) => {
		const states = (contract.slotStates as Record<string, readonly StateToken[]>)[slot];
		if (states) {
			slotStates[slot] = [...states];
		}
	});

	const slotActions: ManifestPrimitive["slotActions"] = {};
	allSlots.forEach((slot) => {
		const actions = (contract.slotActions as Record<string, readonly SlotAction[]>)[slot];
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
			shared: [...contract.states.shared],
			specific: [...contract.states.specific],
		},
		slotStates,
		slotActions,
		aria: {
			role: contract.aria.role,
			requiredAttrs: [...contract.aria.requiredAttrs],
			optionalAttrs: [...contract.aria.optionalAttrs],
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
 * Fully config-driven:
 * - Reads config.roots for all paths
 * - Reads config.adapters.active for which adapter to enforce
 * - Validates spine (taxonomy/api/adapter/ ↔ api/adapters/)
 * - Scans taxonomy/kinds/primitives/ for kinds
 * - Per kind: loads contract FIRST → reads ariaStateProvider → checks parity
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
	const dsAdapter = config.adapters.active;

	if (!config.generation.categories.primitives.enabled) {
		return { valid: true, primitives: [], errors: [], manifest: null };
	}

	const spineErrors = validateSpine(fs, paths);
	errors.push(...spineErrors);

	const kinds = listSubfolders(fs, paths.clPrimitives);
	const manifestKinds: ManifestPrimitive[] = [];

	for (const kind of kinds) {
		let contract: unknown;
		try {
			contract = await loadContract(importFn, paths.clPrimitives, kind);
		} catch {
			errors.push({
				code: "CONTRACT_LOAD_FAILED",
				kind,
				detail: `${paths.clPrimitives}/${kind}/contract.ts`,
			});
			continue;
		}

		if (!isContractShape(contract)) {
			errors.push({
				code: "CONTRACT_INVALID",
				kind,
				detail: `${paths.clPrimitives}/${kind}/contract.ts`,
			});
			continue;
		}

		const parityResult = checkParity(fs, paths, dsAdapter, kind, contract.ariaStateProvider);
		primitives.push(parityResult);

		if (!parityResult.hasParity) {
			if (!parityResult.hasContract) {
				errors.push({
					code: "PARITY_MISSING_FOLDER",
					kind,
					detail: `${paths.clPrimitives}/${kind}/`,
				});
			}
			parityResult.missingAdapters.forEach(() => {
				errors.push({
					code: "PARITY_MISSING_FOLDER",
					kind,
					detail: `${paths.dsAdapter}/${kind}/`,
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

		manifestKinds.push(contractToManifest(contract));
	}

	const valid = errors.length === 0;

	if (!valid && config.enforcement.failOnParity) {
		return { valid: false, primitives, errors, manifest: null };
	}

	const manifest: ColdLightManifest = {
		version: config.identity.version,
		generatedAt: new Date().toISOString(),
		adapters: {
			dsAdapter: config.adapters.active,
		},
		categories: {
			primitives: { kinds: manifestKinds },
		},
	};

	if (!valid && config.enforcement.failOnContractLoad) {
		return { valid: false, primitives, errors, manifest: null };
	}

	return { valid, primitives, errors, manifest };
}

/**
 * Scan primitive kinds only (no contract loading).
 * Faster check for quick kind discovery.
 */
export function scanPrimitiveKinds(fs: FsLike, config: ColdLightConfig): string[] {
	const paths = resolvePaths(config);
	return listSubfolders(fs, paths.clPrimitives);
}

/**
 * Scan a single primitive for parity.
 * Requires ariaStateProvider to determine parity mode (3-folder vs 2-folder).
 */
export function scanPrimitive(
	fs: FsLike,
	config: ColdLightConfig,
	kind: string,
	ariaStateProvider: AriaStateProvider
): PrimitiveScanResult {
	const paths = resolvePaths(config);
	const dsAdapter = config.adapters.active;
	return checkParity(fs, paths, dsAdapter, kind, ariaStateProvider);
}
