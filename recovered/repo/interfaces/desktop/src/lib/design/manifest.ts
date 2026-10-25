/**
 * @file ColdLight Manifest — Runtime Catalog Serialization
 * @package @devpulse/coldlight
 *
 * Generates the ColdLight manifest from what's already registered in memory.
 * No filesystem walking. No folder parity validation.
 *
 * Data sources:
 *   - kind-definitions registry → component catalog
 *   - recipe registry → styling patterns
 *
 * Consumers:
 *   - VPB (palette, controls, block factory)
 *   - Compositor (compile pipeline)
 *   - AI agents (component introspection)
 *
 * Enterprise pattern: the manifest is a JSON serialization of runtime state,
 * not a build-time filesystem scan. Same pattern as package.json exports —
 * declares what exists, tooling reads it.
 */

import {
	getAllKindDefinitions,
	type KindDefinition,
} from "./registry/kind-definitions.js";
import { getRecipesForKind, type RecipeDefinition } from "./recipes/index.js";

// =============================================================================
// MANIFEST TYPES
// =============================================================================

/** A single kind entry in the manifest. */
export interface ManifestKind {
	readonly kind: string;
	readonly label: string;
	readonly engine: "coldlight" | "meltui";
	readonly category: string;
	readonly defaultPreset: string;
	readonly defaultRecipe: string;
	readonly requiredAxes: readonly string[];
	readonly compound: boolean;
	readonly container: boolean;
	readonly containerSlots?: readonly string[];
	readonly recipes: readonly ManifestRecipe[];
}

/** A recipe entry in the manifest. */
export interface ManifestRecipe {
	readonly id: string;
	readonly kind: string;
	readonly label: string;
	readonly slots: readonly string[];
	readonly defaults: Record<string, unknown>;
}

/** The generated ColdLight manifest. */
export interface ColdLightManifest {
	readonly version: string;
	readonly generatedAt: string;
	readonly kinds: readonly ManifestKind[];
	readonly recipeCount: number;
	readonly kindCount: number;
}

// =============================================================================
// SERIALIZATION
// =============================================================================

function serializeRecipe(recipe: RecipeDefinition): ManifestRecipe {
	let slots: string[] = [];
	try {
		// biome-ignore lint/suspicious/noExplicitAny: recipe defaults are untyped at serialization boundary
		const classes = recipe.classes?.(recipe.defaults as any);
		if (classes) {
			slots = Object.keys(classes);
		}
	} catch {
		// If classes() fails with defaults, report empty slots
	}

	return {
		id: recipe.id,
		kind: recipe.kind,
		label: recipe.label,
		slots,
		// biome-ignore lint/suspicious/noExplicitAny: serialization boundary
		defaults: recipe.defaults as any,
	};
}

function serializeKind(def: KindDefinition): ManifestKind {
	const recipes = getRecipesForKind(def.kind).map(serializeRecipe);

	return {
		kind: def.kind,
		label: def.label,
		engine: def.engine,
		category: def.blockCategory,
		defaultPreset: def.defaultPreset,
		defaultRecipe: def.defaultRecipe,
		requiredAxes: [...def.requiredAxes],
		compound: def.compound,
		container: def.container,
		...(def.containerSlots ? { containerSlots: [...def.containerSlots] } : {}),
		recipes,
	};
}

// =============================================================================
// GENERATOR
// =============================================================================

/**
 * Generate the ColdLight manifest from runtime registries.
 *
 * Call after all recipes are registered (side-effect imports have run).
 * Returns a serializable object — write to JSON or consume directly.
 *
 * ```ts
 * import { generateManifest } from "$lib/design/manifest.js";
 * const manifest = generateManifest("0.1.0");
 * ```
 */
export function generateManifest(version: string): ColdLightManifest {
	const definitions = getAllKindDefinitions();
	const kinds = definitions.map(serializeKind);
	const recipeCount = kinds.reduce((sum, k) => sum + k.recipes.length, 0);

	return {
		version,
		generatedAt: new Date().toISOString(),
		kinds,
		recipeCount,
		kindCount: kinds.length,
	};
}
