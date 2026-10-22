/**
 * @file Manifest Reader — Loads ColdLight Unified Manifest for VPB
 * @layer vpb
 * @package @devpulse/sys
 *
 * Loads ColdLight's generated `coldlight.manifest.json`. The scanned
 * manifest holds primitives, components, recipes, effects and SVG —
 * produced by `pnpm ds:build:full` while the contract scanner existed.
 *
 * Returns null when the manifest lacks the scanned sections (the one
 * generated today does: the scanner was deleted in 31dfab89).
 * Provides typed accessors for VPB panels.
 */

import type {
	ManifestComponent,
	ManifestEffect,
	ManifestPrimitive,
	ManifestRecipe,
	ManifestSvgFilter,
} from "./manifest.types.js";

/**
 * Unified manifest shape — produced by ds:build:full.
 * Combines token data (from SD5) + scanner data (primitives, components, recipes, effects, SVG).
 */
export interface UnifiedManifest {
	readonly $schema: string;
	readonly version: string;
	readonly generatedAt: string;
	readonly config: {
		readonly framework: string;
		readonly adapter: string;
		readonly ariaStateProvider: string;
	};
	readonly tokens: {
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
	readonly recipes: {
		readonly entries: readonly ManifestRecipe[];
	};
	readonly effects: {
		readonly definitions: readonly ManifestEffect[];
		readonly categories: readonly string[];
		readonly conflictGroups: Record<string, readonly string[]>;
	};
	readonly svg: {
		readonly filters: readonly ManifestSvgFilter[];
		readonly blanks: readonly { shape: string; availableFilters: readonly string[] }[];
	};
}

let cachedManifest: UnifiedManifest | null = null;

/**
 * Load the scanned ColdLight manifest.
 * Returns null if it is missing or lacks the scanned sections.
 */
export async function loadManifest(): Promise<UnifiedManifest | null> {
	if (cachedManifest) return cachedManifest;

	try {
		const mod = await import("@devpulse/coldlight/generated/coldlight.manifest.json");
		const manifest: unknown = mod.default;
		if (!isUnifiedManifest(manifest)) return null;
		cachedManifest = manifest;
		return cachedManifest;
	} catch {
		return null;
	}
}

/** Whether a manifest carries the sections the contract scanner wrote. */
function isUnifiedManifest(value: unknown): value is UnifiedManifest {
	const m = value as Partial<UnifiedManifest> | null;
	return (
		m !== null &&
		typeof m === "object" &&
		Array.isArray(m.primitives?.kinds) &&
		Array.isArray(m.components?.kinds)
	);
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
	return manifest.recipes.entries.filter((r) => r.kind === kind);
}

/**
 * Get all effects in a given category from the manifest.
 */
export function getEffectsFromManifest(
	manifest: UnifiedManifest,
	category: string,
): ManifestEffect[] {
	return manifest.effects.definitions.filter((e) => e.category === category);
}

/**
 * Get an encoding category by code (s, z, d, b, g, f, m, t).
 */
export function getEncodingCategory(
	manifest: UnifiedManifest,
	code: string,
): UnifiedManifest["tokens"]["encodingCategories"][number] | undefined {
	return manifest.tokens.encodingCategories.find((c) => c.code === code);
}
