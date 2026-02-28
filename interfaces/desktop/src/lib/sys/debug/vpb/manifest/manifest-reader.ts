/**
 * @file Manifest Reader — Loads ColdLight Manifest for VPB
 * @layer vpb
 * @package @devpulse/sys
 *
 * Loads coldlight.manifest.json from the generated output path.
 * Falls back gracefully if manifest not yet generated.
 * Provides typed accessors for VPB panels.
 */

import type {
	ColdLightManifest,
	ManifestPrimitive,
	ManifestComponent,
	ManifestRecipe,
} from "$lib/design/scanner.types.js";

let cachedManifest: ColdLightManifest | null = null;

/**
 * Load the ColdLight manifest.
 * Uses Vite's glob import to find the generated manifest file.
 * Returns null if the manifest hasn't been generated yet.
 */
export async function loadManifest(): Promise<ColdLightManifest | null> {
	if (cachedManifest) return cachedManifest;

	try {
		const modules = import.meta.glob("$lib/design/.generated/coldlight.manifest.json", {
			eager: false,
		});
		const paths = Object.keys(modules);
		if (paths.length === 0) return null;

		const mod = (await modules[paths[0]]()) as { default: ColdLightManifest };
		cachedManifest = mod.default;
		return cachedManifest;
	} catch {
		return null;
	}
}

/**
 * Clear the cached manifest — useful after scanner re-runs.
 */
export function clearManifestCache(): void {
	cachedManifest = null;
}

/**
 * Get the primitive contract for a given kind from the manifest.
 */
export function getPrimitiveFromManifest(
	manifest: ColdLightManifest,
	kind: string,
): ManifestPrimitive | undefined {
	return manifest.categories.primitives.kinds.find((p) => p.kind === kind);
}

/**
 * Get the component contract for a given kind from the manifest.
 */
export function getComponentFromManifest(
	manifest: ColdLightManifest,
	kind: string,
): ManifestComponent | undefined {
	return manifest.categories.components.kinds.find((c) => c.kind === kind);
}

/**
 * Get all recipes for a given kind from the manifest.
 */
export function getRecipesFromManifest(
	manifest: ColdLightManifest,
	kind: string,
): ManifestRecipe[] {
	return manifest.categories.recipes.entries.filter((r) => r.kind === kind);
}
