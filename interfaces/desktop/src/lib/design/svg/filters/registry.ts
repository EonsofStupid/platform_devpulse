/**
 * @file SVG Filter Registry
 * @layer svg
 * @package @devpulse/coldlight
 *
 * Map-based registry for SVG filter definitions.
 * Filters are registered at module load time (side-effect imports
 * from definitions/) and queried by SvgFilters.svelte and the scanner.
 *
 * Pattern mirrors effects/registry.ts:
 * - registerFilter() validates via Zod in DEV mode
 * - getFilter() is O(1) lookup
 * - getAllFilters() returns the full list for SvgFilters.svelte rendering
 * - getAllFiltersForManifest() serializes for JSON manifest
 */

import { FilterDefSchema } from "../_schema/schema.js";
import type { FilterDef, ManifestSvgFilter, SvgFilterCategory } from "../_schema/types.js";

// =============================================================================
// REGISTRY STATE
// =============================================================================

const registry = new Map<string, FilterDef>();
const categoryIndex = new Map<SvgFilterCategory, Set<string>>();

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register an SVG filter definition.
 * Validates against FilterDefSchema in DEV mode.
 * Throws on duplicate IDs or schema violations.
 */
export function registerFilter(definition: FilterDef): void {
	// DEV-mode schema validation
	if (import.meta.env?.DEV) {
		const result = FilterDefSchema.safeParse(definition);
		if (!result.success) {
			throw new Error(
				`[ColdLight] Invalid SVG filter definition "${definition.id}": ${result.error.message}`,
			);
		}
	}

	// Duplicate check
	if (registry.has(definition.id)) {
		throw new Error(`[ColdLight] Duplicate SVG filter ID: "${definition.id}" — IDs must be unique`);
	}

	// Register in main map
	registry.set(definition.id, definition);

	// Index by category
	let categorySet = categoryIndex.get(definition.category);
	if (!categorySet) {
		categorySet = new Set();
		categoryIndex.set(definition.category, categorySet);
	}
	categorySet.add(definition.id);
}

// =============================================================================
// QUERIES
// =============================================================================

/** Get a single filter definition by ID. O(1). */
export function getFilter(id: string): FilterDef | undefined {
	return registry.get(id);
}

/** Get all filter definitions as an array (for SvgFilters.svelte rendering). */
export function getAllFilters(): readonly FilterDef[] {
	return [...registry.values()];
}

/** Get all filter IDs in a category. */
export function getFiltersForCategory(category: SvgFilterCategory): readonly FilterDef[] {
	const ids = categoryIndex.get(category);
	if (!ids) return [];
	const results: FilterDef[] = [];
	ids.forEach((id) => {
		const def = registry.get(id);
		if (def) results.push(def);
	});
	return results;
}

/** Get total count of registered filters. */
export function getFilterCount(): number {
	return registry.size;
}

// =============================================================================
// MANIFEST SERIALIZATION
// =============================================================================

/** Get all filters as manifest entries (for JSON serialization). */
export function getAllFiltersForManifest(): readonly ManifestSvgFilter[] {
	const results: ManifestSvgFilter[] = [];
	registry.forEach((def) => {
		results.push({
			id: def.id,
			category: def.category,
			label: def.label,
			description: def.description,
			cssClass: def.cssClass,
			params: def.params.map((p) => ({
				cssProperty: p.cssProperty,
				defaultValue: p.defaultValue,
			})),
			effectId: def.effectId,
		});
	});
	return results;
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/** Clear the registry. For testing only. */
export function _clearFilterRegistry(): void {
	registry.clear();
	categoryIndex.clear();
}
