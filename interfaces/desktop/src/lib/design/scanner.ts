/**
 * @file ColdLight Build-Time Scanner
 * @package @devpulse/coldlight
 *
 * Scans primitives/ folders to discover kinds and verify contract-aware parity.
 * Loads colocated contracts and generates the manifest (= the taxonomy).
 *
 * CORE PRINCIPLE: Folders are truth. Config drives everything.
 * Contracts are COLOCATED with implementations in primitives/{kind}/.
 *
 * The scanner reads config.adapters.active to know which adapter
 * folders to enforce. Parity mode is determined per-kind by the
 * contract's ariaStateProvider field.
 *
 * Contract-Aware Parity:
 *   ariaStateProvider: "meltui"    → 3-folder parity
 *     1. {primitivesRoot}/<kind>/contract.ts          - Contract (colocated SSOT)
 *     2. {apiRoot}/adapters/{active}/_internal/<kind>/ - Adapter mapping
 *     3. {primitivesRoot}/<kind>/*.svelte              - Svelte component
 *
 *   ariaStateProvider: "coldlight" → 2-folder parity
 *     1. {primitivesRoot}/<kind>/contract.ts - Contract (colocated SSOT)
 *     2. {primitivesRoot}/<kind>/*.svelte    - Svelte component
 */

import type { ColdLightConfig } from "./coldlight.config.js";
import type {
	AriaStateProvider,
	ColdLightManifest,
	ComponentScanResult,
	DsAdapterId,
	ManifestComponent,
	ManifestEffect,
	ManifestPrimitive,
	ManifestRecipe,
	PrimitiveScanResult,
	ScanError,
	ScanResult,
	SlotAction,
	StateToken,
} from "./scanner.types.js";
import type { PrimitiveContract } from "./primitives/_schema/types.js";

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

function resolvePaths(config: ColdLightConfig) {
	const { apiRoot, primitivesRoot, componentsRoot, buildersRoot, recipesRoot, effectsRoot } = config.roots;
	const active = config.adapters.active;

	return {
		primitives: primitivesRoot,
		components: componentsRoot,
		dsAdapter: `${apiRoot}/adapters/${active}/_internal`,
		apiAdapters: `${apiRoot}/adapters`,
		builders: buildersRoot,
		recipes: recipesRoot,
		effects: effectsRoot,
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
		return fs.readdirSync(dirPath).some((name) => name.endsWith(".svelte"));
	} catch {
		return false;
	}
}

function containsContractFile(fs: FsLike, dirPath: string): boolean {
	try {
		return fs.existsSync(`${dirPath}/contract.ts`) || fs.existsSync(`${dirPath}/contract.js`);
	} catch {
		return false;
	}
}

// =============================================================================
// PARITY CHECK (contract-aware)
// =============================================================================

/**
 * Contract-aware parity check.
 *
 * ariaStateProvider: "meltui"    → 3-folder (contract + dsAdapter + svelte)
 * ariaStateProvider: "coldlight" → 2-folder (contract + svelte)
 *
 * Also detects ColdLight builder presence (informational, not parity-affecting).
 */
function checkParity(
	fs: FsLike,
	paths: ReturnType<typeof resolvePaths>,
	dsAdapter: DsAdapterId,
	kind: string,
	ariaStateProvider: AriaStateProvider,
): PrimitiveScanResult {
	const kindDir = `${paths.primitives}/${kind}`;
	const dsAdapterDir = `${paths.dsAdapter}/${kind}`;
	const builderDir = `${paths.builders}/${kind}`;

	const hasContract = containsContractFile(fs, kindDir);
	const hasDsAdapter = isDir(fs, dsAdapterDir);
	const hasSvelteComponent = containsSvelteFile(fs, kindDir);
	const hasBuilder = isDir(fs, builderDir);

	const missingAdapters: DsAdapterId[] = [];
	if (ariaStateProvider === "meltui" && !hasDsAdapter) {
		missingAdapters.push(dsAdapter);
	}

	let hasParity: boolean;
	if (ariaStateProvider === "meltui") {
		hasParity = hasContract && hasDsAdapter && hasSvelteComponent;
	} else {
		hasParity = hasContract && hasSvelteComponent;
	}

	return {
		kind,
		ariaStateProvider,
		hasContract,
		hasSvelteComponent,
		hasBuilder,
		missingAdapters,
		hasParity,
	};
}

// =============================================================================
// CONTRACT LOADING
// =============================================================================

async function loadContract(
	importFn: ImportLike,
	primitivesPath: string,
	kind: string,
): Promise<unknown> {
	const contractPath = `${primitivesPath}/${kind}/contract.js`;
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
		slotSpec: contract.slotSpec as Record<string, ManifestPrimitive["slotSpec"][string]>,
		aria: {
			role: contract.aria.role,
			requiredAttrs: [...contract.aria.requiredAttrs],
			optionalAttrs: [...contract.aria.optionalAttrs],
		},
		keyboard: [...contract.keyboard],
		focusStrategy: contract.focusStrategy,
		compound: contract.compound,
		...(contract.orientation != null ? { orientation: contract.orientation } : {}),
		...(contract.dismissBehavior != null ? { dismissBehavior: contract.dismissBehavior } : {}),
	};
}

// =============================================================================
// RECIPE SCANNING
// =============================================================================

/**
 * Scan recipe folders to discover registered recipes.
 * Walks {recipesRoot}/components/ and {recipesRoot}/layouts/ for kind folders,
 * imports each index.js to trigger recipe registration, then reads the registry.
 */
async function scanRecipes(
	fs: FsLike,
	importFn: ImportLike,
	recipesPath: string,
): Promise<ManifestRecipe[]> {
	const manifestRecipes: ManifestRecipe[] = [];
	const categories = ["components", "layouts"];

	for (const category of categories) {
		const categoryPath = `${recipesPath}/${category}`;
		const kindFolders = listSubfolders(fs, categoryPath);

		for (const kind of kindFolders) {
			const indexPath = `${categoryPath}/${kind}/index.js`;
			if (!fs.existsSync(`${categoryPath}/${kind}/index.ts`) &&
				!fs.existsSync(indexPath)) {
				continue;
			}

			try {
				// Import triggers side-effect recipe registration
				await importFn(indexPath);
			} catch {
				// Recipe import failed — not a scanner error, recipes are optional
			}
		}
	}

	// Read all registered recipes from the runtime registry
	try {
		const registryMod = await importFn(`${recipesPath}/index.js`);
		const getRecipesForKind = (registryMod as Record<string, unknown>).getRecipesForKind as
			| ((kind: string) => Array<{ id: string; kind: string; label: string; defaults: Record<string, unknown>; classes: (props: Record<string, unknown>) => Record<string, string> }>)
			| undefined;

		if (getRecipesForKind) {
			// Discover all kinds by scanning the recipe folders
			const allKinds = new Set<string>();
			for (const category of categories) {
				const categoryPath = `${recipesPath}/${category}`;
				listSubfolders(fs, categoryPath).forEach((k) => allKinds.add(k));
			}

			allKinds.forEach((kind) => {
				const recipes = getRecipesForKind(kind);
				recipes.forEach((recipe) => {
					// Resolve slots by calling classes() with defaults
					let slots: string[] = [];
					try {
						const classes = recipe.classes(recipe.defaults as Record<string, unknown>);
						slots = Object.keys(classes);
					} catch {
						// If classes() fails with partial defaults, report empty slots
					}

					manifestRecipes.push({
						id: recipe.id,
						kind: recipe.kind,
						label: recipe.label,
						slots,
						defaults: recipe.defaults as Record<string, unknown>,
					});
				});
			});
		}
	} catch {
		// Registry not available — recipes won't be in manifest
	}

	return manifestRecipes;
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

/**
 * Scan ColdLight primitives and recipes.
 *
 * Fully config-driven:
 * - Scans primitivesRoot for kind folders
 * - Per kind: loads colocated contract.ts → reads ariaStateProvider → checks parity
 * - Scans recipesRoot for recipe definitions → includes in manifest
 * - Returns manifest or errors
 */
export async function scanColdLight(
	fs: FsLike,
	importFn: ImportLike,
	config: ColdLightConfig,
): Promise<ScanResult> {
	const errors: ScanError[] = [];
	const primitives: PrimitiveScanResult[] = [];
	const paths = resolvePaths(config);
	const dsAdapter = config.adapters.active;

	if (!config.generation.categories.primitives.enabled) {
		return { valid: true, primitives: [], errors: [], manifest: null };
	}

	const kinds = listSubfolders(fs, paths.primitives);
	const manifestKinds: ManifestPrimitive[] = [];

	for (const kind of kinds) {
		// Skip _schema folder — it's type infrastructure, not a primitive
		if (kind.startsWith("_")) continue;

		// Check if this folder has a contract
		if (!containsContractFile(fs, `${paths.primitives}/${kind}`)) {
			continue; // No contract = not a registered primitive yet
		}

		let contract: unknown;
		try {
			contract = await loadContract(importFn, paths.primitives, kind);
		} catch {
			errors.push({
				code: "CONTRACT_LOAD_FAILED",
				kind,
				detail: `${paths.primitives}/${kind}/contract.ts`,
			});
			continue;
		}

		if (!isContractShape(contract)) {
			errors.push({
				code: "CONTRACT_INVALID",
				kind,
				detail: `${paths.primitives}/${kind}/contract.ts`,
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
					detail: `${paths.primitives}/${kind}/contract.ts`,
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

	// Scan recipes
	const manifestRecipes = await scanRecipes(fs, importFn, paths.recipes);

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
			recipes: { entries: manifestRecipes },
		},
	};

	if (!valid && config.enforcement.failOnContractLoad) {
		return { valid: false, primitives, errors, manifest: null };
	}

	return { valid, primitives, errors, manifest };
}

/**
 * Scan primitive kinds only (no contract loading).
 */
export function scanPrimitiveKinds(fs: FsLike, config: ColdLightConfig): string[] {
	const paths = resolvePaths(config);
	return listSubfolders(fs, paths.primitives).filter((k) => !k.startsWith("_"));
}

/**
 * Scan a single primitive for parity.
 */
export function scanPrimitive(
	fs: FsLike,
	config: ColdLightConfig,
	kind: string,
	ariaStateProvider: AriaStateProvider,
): PrimitiveScanResult {
	const paths = resolvePaths(config);
	const dsAdapter = config.adapters.active;
	return checkParity(fs, paths, dsAdapter, kind, ariaStateProvider);
}
