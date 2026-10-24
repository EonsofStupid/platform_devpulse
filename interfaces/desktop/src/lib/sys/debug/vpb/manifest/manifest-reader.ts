/**
 * @file Manifest Reader — ColdLight contracts for the VPB
 * @layer vpb
 * @package @devpulse/sys
 *
 * The scanned manifest (`coldlight.manifest.json`, written by the contract
 * scanner deleted in 31dfab89) held primitives, components, recipes,
 * effects and SVG. Its primitive and component entries now come straight
 * from ColdLight's primitive catalog (spec + anatomy per kind), so they are
 * never stale. Recipes, effects, SVG and the token encoding have no source
 * today; those sections stay empty.
 * Provides typed accessors for VPB panels.
 */

import {
	type ManifestComponent,
	type ManifestEffect,
	type ManifestPrimitive,
	type ManifestRecipe,
	type ManifestSvgFilter,
	PRIMITIVES,
	toManifestComponent,
	toManifestPrimitive,
} from "@devpulse/coldlight/primitives";

/**
 * Unified manifest shape — as ds:build:full produced it. Primitives and
 * components are always present (from the catalog); the other sections
 * only when something produces them.
 */
export interface UnifiedManifest {
	readonly $schema?: string;
	readonly version?: string;
	readonly generatedAt: string;
	readonly config?: {
		readonly framework: string;
		readonly adapter: string;
		readonly ariaStateProvider: string;
	};
	readonly tokens?: {
		readonly pipeline: string;
		readonly encodingCategories: readonly {
			readonly code: string;
			readonly name: string;
			readonly description: string;
			readonly encodingOrder: number;
			readonly defaultIndex: number;
			readonly vpbControl: string;
			readonly valueCount: number;
			readonly values: readonly {
				readonly index: number;
				readonly id: string;
				readonly label: string;
				readonly tokenRefs: Record<string, string>;
				readonly varRefs?: readonly string[];
				readonly svgFilters: readonly string[];
			}[];
		}[];
		readonly encoding: {
			readonly order: readonly string[];
			readonly totalValues: number;
			readonly format: string;
			readonly example: string;
		};
		readonly tokenEnums: Record<string, { values: readonly unknown[]; count: number }>;
		readonly keyframes: readonly string[];
		readonly generatedFiles: readonly { file: string; bytes: number }[];
		readonly platforms: Record<string, string>;
	};
	readonly primitives: {
		readonly kinds: readonly ManifestPrimitive[];
	};
	readonly components: {
		readonly kinds: readonly ManifestComponent[];
	};
	readonly recipes?: {
		readonly entries: readonly ManifestRecipe[];
	};
	readonly effects?: {
		readonly definitions: readonly ManifestEffect[];
		readonly categories: readonly string[];
		readonly conflictGroups: Record<string, readonly string[]>;
	};
	readonly svg?: {
		readonly filters: readonly ManifestSvgFilter[];
		readonly blanks: readonly { shape: string; availableFilters: readonly string[] }[];
	};
}

let cachedManifest: UnifiedManifest | null = null;

/**
 * Build the manifest from ColdLight's primitive catalog (cached).
 * Async and nullable as the scanned manifest's loader was.
 */
export async function loadManifest(): Promise<UnifiedManifest | null> {
	if (cachedManifest) return cachedManifest;
	cachedManifest = {
		generatedAt: new Date().toISOString(),
		primitives: { kinds: PRIMITIVES.map(toManifestPrimitive) },
		components: { kinds: PRIMITIVES.map(toManifestComponent) },
	};
	return cachedManifest;
}

/**
 * Clear the cached manifest — useful after re-builds.
 */
export function clearManifestCache(): void {
	cachedManifest = null;
}

/**
 * Get the primitive contract for a given kind from the manifest.
 */
export function getPrimitiveFromManifest(
	manifest: UnifiedManifest,
	kind: string,
): ManifestPrimitive | undefined {
	return manifest.primitives.kinds.find((p) => p.kind === kind);
}

/**
 * Get the component contract for a given kind from the manifest.
 */
export function getComponentFromManifest(
	manifest: UnifiedManifest,
	kind: string,
): ManifestComponent | undefined {
	return manifest.components.kinds.find((c) => c.kind === kind);
}

/**
 * Get all recipes for a given kind from the manifest.
 */
export function getRecipesFromManifest(manifest: UnifiedManifest, kind: string): ManifestRecipe[] {
	return manifest.recipes?.entries.filter((r) => r.kind === kind) ?? [];
}

/**
 * Get all effects in a given category from the manifest.
 */
export function getEffectsFromManifest(
	manifest: UnifiedManifest,
	category: string,
): ManifestEffect[] {
	return manifest.effects?.definitions.filter((e) => e.category === category) ?? [];
}

/**
 * Get an encoding category by code (s, z, d, b, g, f, m, t).
 */
export function getEncodingCategory(
	manifest: UnifiedManifest,
	code: string,
): NonNullable<UnifiedManifest["tokens"]>["encodingCategories"][number] | undefined {
	return manifest.tokens?.encodingCategories.find((c) => c.code === code);
}
