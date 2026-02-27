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
	ManifestSvgBlank,
	ManifestSvgFilter,
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
	const { apiRoot, primitivesRoot, componentsRoot, buildersRoot, recipesRoot, effectsRoot, svgRoot } = config.roots;
	const active = config.adapters.active;

	return {
		primitives: primitivesRoot,
		components: componentsRoot,
		dsAdapter: `${apiRoot}/adapters/${active}/_internal`,
		apiAdapters: `${apiRoot}/adapters`,
		builders: buildersRoot,
		recipes: recipesRoot,
		effects: effectsRoot,
		svg: svgRoot,
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
// COMPONENT CONTRACT LOADING & VALIDATION
// =============================================================================

/**
 * Validate the generic ComponentContract shape.
 */
function isComponentContractShape(x: unknown): x is Record<string, unknown> {
	if (!x || typeof x !== "object") return false;
	const c = x as Record<string, unknown>;

	if (typeof c.kind !== "string") return false;
	if (typeof c.primitiveKind !== "string") return false;

	const slots = c.slots as Record<string, unknown> | undefined;
	if (!slots || typeof slots !== "object") return false;
	if (!Array.isArray(slots.required)) return false;

	if (!c.slotContracts || typeof c.slotContracts !== "object") return false;

	const accessibleName = c.accessibleName as Record<string, unknown> | undefined;
	if (!accessibleName || typeof accessibleName !== "object") return false;

	const focus = c.focus as Record<string, unknown> | undefined;
	if (!focus || typeof focus !== "object") return false;

	const interactions = c.interactions as Record<string, unknown> | undefined;
	if (!interactions || typeof interactions !== "object") return false;

	return true;
}

/**
 * Convert a ComponentContract to a ManifestComponent for JSON serialization.
 */
function componentContractToManifest(contract: Record<string, unknown>): ManifestComponent {
	const slots = contract.slots as { required: string[]; optional?: string[] };
	const accessibleName = contract.accessibleName as {
		required: boolean;
		sources: string[];
	};
	const focus = contract.focus as {
		strategy: string;
		initialFocus?: string;
		returnFocus?: string;
	};
	const keyboard = contract.keyboard as {
		global: Array<{ key: string; action: string; description: string }>;
	};
	const states = contract.states as { all: string[] };
	const interactions = contract.interactions as {
		modal: boolean;
		selectable: boolean;
		editable: boolean;
		expandable: boolean;
	};
	const waiAdapt = contract.waiAdapt as
		| { action?: string; purpose?: string; simplification: string }
		| undefined;

	return {
		kind: contract.kind as string,
		description: contract.description as string,
		primitiveKind: contract.primitiveKind as string,
		apgPattern: contract.apgPattern as string | undefined,
		slots: {
			required: [...slots.required],
			optional: [...(slots.optional ?? [])],
		},
		accessibleName: {
			required: accessibleName.required,
			sources: [...accessibleName.sources],
		},
		focus: {
			strategy: focus.strategy,
			...(focus.initialFocus != null ? { initialFocus: focus.initialFocus } : {}),
			...(focus.returnFocus != null ? { returnFocus: focus.returnFocus } : {}),
		},
		keyboard: (keyboard?.global ?? []).map((k) => ({
			key: k.key,
			action: k.action,
			description: k.description,
		})),
		states: [...(states?.all ?? [])],
		interactions: {
			modal: interactions.modal,
			selectable: interactions.selectable,
			editable: interactions.editable,
			expandable: interactions.expandable,
		},
		...(waiAdapt
			? {
					waiAdapt: {
						...(waiAdapt.action != null ? { action: waiAdapt.action } : {}),
						...(waiAdapt.purpose != null ? { purpose: waiAdapt.purpose } : {}),
						simplification: waiAdapt.simplification,
					},
				}
			: {}),
	};
}

// =============================================================================
// COMPONENT SCANNING
// =============================================================================

/**
 * Scan component folders to discover kinds and load contracts.
 * Cross-validates that each component.primitiveKind exists in discovered primitives.
 */
async function scanComponents(
	fs: FsLike,
	importFn: ImportLike,
	componentsPath: string,
	discoveredPrimitiveKinds: ReadonlySet<string>,
): Promise<{
	components: ComponentScanResult[];
	manifestComponents: ManifestComponent[];
	errors: ScanError[];
}> {
	const components: ComponentScanResult[] = [];
	const manifestComponents: ManifestComponent[] = [];
	const errors: ScanError[] = [];

	const kinds = listSubfolders(fs, componentsPath);

	for (const kind of kinds) {
		if (kind.startsWith("_")) continue;

		const kindDir = `${componentsPath}/${kind}`;

		if (!containsContractFile(fs, kindDir)) {
			continue;
		}

		const hasSvelteComponent = containsSvelteFile(fs, kindDir);

		let contract: unknown;
		try {
			contract = await loadContract(importFn, componentsPath, kind);
		} catch {
			errors.push({
				code: "COMPONENT_CONTRACT_LOAD_FAILED",
				kind,
				detail: `${componentsPath}/${kind}/contract.ts`,
			});
			components.push({
				kind,
				hasContract: false,
				hasSvelteComponent,
				primitiveKind: null,
				primitiveExists: false,
			});
			continue;
		}

		if (!isComponentContractShape(contract)) {
			errors.push({
				code: "COMPONENT_CONTRACT_INVALID",
				kind,
				detail: `${componentsPath}/${kind}/contract.ts`,
			});
			components.push({
				kind,
				hasContract: true,
				hasSvelteComponent,
				primitiveKind: null,
				primitiveExists: false,
			});
			continue;
		}

		const primitiveKind = contract.primitiveKind as string;
		const primitiveExists = discoveredPrimitiveKinds.has(primitiveKind);

		if (!primitiveExists) {
			errors.push({
				code: "COMPONENT_PRIMITIVE_NOT_FOUND",
				kind,
				detail: `Component '${kind}' references primitive '${primitiveKind}' which was not found in primitives/`,
			});
		}

		components.push({
			kind,
			hasContract: true,
			hasSvelteComponent,
			primitiveKind,
			primitiveExists,
		});

		manifestComponents.push(componentContractToManifest(contract));
	}

	return { components, manifestComponents, errors };
}

// =============================================================================
// EFFECT SCANNING
// =============================================================================

/**
 * Scan effect category folders and collect registered effects.
 * Imports each category index to trigger side-effect registration,
 * then reads the effect registry for manifest serialization.
 */
async function scanEffects(
	fs: FsLike,
	importFn: ImportLike,
	effectsPath: string,
): Promise<{
	definitions: ManifestEffect[];
	categories: string[];
	conflictGroups: Record<string, string[]>;
}> {
	const definitions: ManifestEffect[] = [];
	const categories: string[] = [];
	const conflictGroups: Record<string, string[]> = {};

	const categoriesDir = `${effectsPath}/categories`;
	const categoryFolders = listSubfolders(fs, categoriesDir);

	for (const category of categoryFolders) {
		categories.push(category);

		const indexPath = `${categoriesDir}/${category}/index.js`;
		if (!fs.existsSync(`${categoriesDir}/${category}/index.ts`) &&
			!fs.existsSync(indexPath)) {
			continue;
		}

		try {
			await importFn(indexPath);
		} catch {
			// Effect category import failed — non-fatal
		}
	}

	// Read registered effects from the runtime registry
	try {
		const registryMod = await importFn(`${effectsPath}/index.js`);
		const getAllEffectsForManifest = (registryMod as Record<string, unknown>).getAllEffectsForManifest as
			| (() => ManifestEffect[])
			| undefined;
		const getCategoryManifests = (registryMod as Record<string, unknown>).getCategoryManifests as
			| (() => Array<{ category: string; effectIds: string[]; conflictGroups: Record<string, string[]> }>)
			| undefined;

		if (getAllEffectsForManifest) {
			definitions.push(...getAllEffectsForManifest());
		}

		if (getCategoryManifests) {
			const manifests = getCategoryManifests();
			manifests.forEach((m) => {
				Object.entries(m.conflictGroups).forEach(([group, ids]) => {
					conflictGroups[group] = ids;
				});
			});
		}
	} catch {
		// Effect registry not available — effects won't be in manifest
	}

	return { definitions, categories, conflictGroups };
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
// SVG FILTER SCANNING
// =============================================================================

/**
 * Scan SVG filter definitions from the filter registry.
 * Imports the definitions barrel to trigger side-effect registration,
 * then reads the filter registry for manifest serialization.
 */
async function scanSvgFilters(
	importFn: ImportLike,
	svgPath: string,
): Promise<{
	filters: ManifestSvgFilter[];
	blanks: ManifestSvgBlank[];
}> {
	const filters: ManifestSvgFilter[] = [];
	const blanks: ManifestSvgBlank[] = [
		{ shape: "rect", availableFilters: ["bevel-soft", "bevel-medium", "bevel-strong", "noise-subtle", "noise-medium", "glow-teal-svg", "glow-purple-svg"] },
		{ shape: "pill", availableFilters: ["bevel-soft", "bevel-medium", "bevel-strong", "noise-subtle", "noise-medium", "glow-teal-svg", "glow-purple-svg"] },
		{ shape: "circle", availableFilters: ["bevel-soft", "bevel-medium", "bevel-strong", "noise-subtle", "noise-medium", "glow-teal-svg", "glow-purple-svg"] },
		{ shape: "hexagon", availableFilters: ["bevel-soft", "bevel-medium", "bevel-strong", "noise-subtle", "noise-medium", "glow-teal-svg", "glow-purple-svg"] },
	];

	// Import filter definitions to trigger registration
	try {
		await importFn(`${svgPath}/filters/definitions/index.js`);
	} catch {
		// Filter definitions not available — non-fatal
	}

	// Read registered filters from the runtime registry
	try {
		const registryMod = await importFn(`${svgPath}/filters/registry.js`);
		const getAllFiltersForManifest = (registryMod as Record<string, unknown>).getAllFiltersForManifest as
			| (() => ManifestSvgFilter[])
			| undefined;

		if (getAllFiltersForManifest) {
			filters.push(...getAllFiltersForManifest());
		}
	} catch {
		// Filter registry not available — filters won't be in manifest
	}

	return { filters, blanks };
}

// =============================================================================
// MAIN SCANNER
// =============================================================================

/**
 * Scan ALL ColdLight layers: primitives, components, effects, recipes.
 *
 * Unified manifest — one document, all layers, cross-validated references.
 * Each layer references the layer below:
 *   tokens → nothing (atoms)
 *   effects → tokens (molecules reference token values)
 *   primitives → nothing structural (AST nodes)
 *   components → primitives (by kind) + effects (by ID)
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

	// =========================================================================
	// LAYER 1: Scan Primitives (AST nodes — structural foundation)
	// =========================================================================

	const manifestPrimitiveKinds: ManifestPrimitive[] = [];
	const discoveredPrimitiveKinds = new Set<string>();

	if (config.generation.categories.primitives.enabled) {
		const kinds = listSubfolders(fs, paths.primitives);

		for (const kind of kinds) {
			if (kind.startsWith("_")) continue;

			if (!containsContractFile(fs, `${paths.primitives}/${kind}`)) {
				continue;
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

			discoveredPrimitiveKinds.add(kind);

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

			manifestPrimitiveKinds.push(contractToManifest(contract));
		}
	}

	// =========================================================================
	// LAYER 2: Scan Components (cross-validates against primitives)
	// =========================================================================

	let componentResults: ComponentScanResult[] = [];
	let manifestComponents: ManifestComponent[] = [];

	if (config.generation.categories.components.enabled) {
		const componentScan = await scanComponents(
			fs, importFn, paths.components, discoveredPrimitiveKinds,
		);
		componentResults = componentScan.components;
		manifestComponents = componentScan.manifestComponents;
		errors.push(...componentScan.errors);
	}

	// =========================================================================
	// LAYER 3: Scan Effects (composable visual building blocks)
	// =========================================================================

	let effectDefinitions: ManifestEffect[] = [];
	let effectCategories: string[] = [];
	let effectConflictGroups: Record<string, string[]> = {};

	if (config.generation.categories.effects?.enabled) {
		const effectScan = await scanEffects(fs, importFn, paths.effects);
		effectDefinitions = effectScan.definitions;
		effectCategories = effectScan.categories;
		effectConflictGroups = effectScan.conflictGroups;
	}

	// =========================================================================
	// LAYER 4: Scan SVG Filters (premium tier neumorphism)
	// =========================================================================

	let svgFilters: ManifestSvgFilter[] = [];
	let svgBlanks: ManifestSvgBlank[] = [];

	if (config.generation.categories.svg?.enabled) {
		const svgScan = await scanSvgFilters(importFn, paths.svg);
		svgFilters = svgScan.filters;
		svgBlanks = svgScan.blanks;
	}

	// =========================================================================
	// LAYER 5: Scan Recipes (styling patterns)
	// =========================================================================

	const manifestRecipes = await scanRecipes(fs, importFn, paths.recipes);

	// =========================================================================
	// ASSEMBLE UNIFIED MANIFEST
	// =========================================================================

	const valid = errors.length === 0;

	if (!valid && config.enforcement.failOnParity) {
		return { valid: false, primitives, components: componentResults, errors, manifest: null };
	}

	const manifest: ColdLightManifest = {
		version: config.identity.version,
		generatedAt: new Date().toISOString(),
		adapters: {
			dsAdapter: config.adapters.active,
		},
		categories: {
			tokens: {
				tiers: ["global", "semantic", "component"],
				generatedFiles: ["tokens.css", "tailwind.css", "types.ts"],
			},
			effects: {
				definitions: effectDefinitions,
				categories: effectCategories,
				conflictGroups: effectConflictGroups,
			},
			svg: {
				filters: svgFilters,
				blanks: svgBlanks,
			},
			primitives: { kinds: manifestPrimitiveKinds },
			components: { kinds: manifestComponents },
			recipes: { entries: manifestRecipes },
		},
	};

	if (!valid && config.enforcement.failOnContractLoad) {
		return { valid: false, primitives, components: componentResults, errors, manifest: null };
	}

	return { valid, primitives, components: componentResults, errors, manifest };
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
