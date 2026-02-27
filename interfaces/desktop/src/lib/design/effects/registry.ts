/**
 * @file Effect Registry
 * @layer effects
 * @package @devpulse/coldlight
 *
 * Map-based registry for composable visual effect definitions.
 * Effects are registered at module load time (side-effect imports
 * from category folders) and queried by the compositor compiler
 * and VPB at runtime.
 *
 * Pattern mirrors the primitive contract registry:
 * - registerEffect() validates via Zod in DEV mode
 * - getEffect() is O(1) lookup
 * - getEffectsForCategory() returns all effects in a category
 * - getAllEffects() returns the full registry for manifest serialization
 */

import type {
	EffectCategory,
	EffectDefinition,
	ManifestEffect,
	ManifestEffectCategory,
} from "./_schema/types.js";
import { EffectDefinitionSchema } from "./_schema/schema.js";

// =============================================================================
// REGISTRY STATE
// =============================================================================

const registry = new Map<string, EffectDefinition>();
const categoryIndex = new Map<EffectCategory, Set<string>>();
const conflictGroupIndex = new Map<string, Set<string>>();

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register an effect definition.
 * Validates against EffectDefinitionSchema in DEV mode.
 * Throws on duplicate IDs or schema violations.
 */
export function registerEffect(definition: EffectDefinition): void {
	// DEV-mode schema validation
	if (import.meta.env?.DEV) {
		const result = EffectDefinitionSchema.safeParse(definition);
		if (!result.success) {
			throw new Error(
				`[ColdLight] Invalid effect definition "${definition.id}": ${result.error.message}`,
			);
		}
	}

	// Duplicate check
	if (registry.has(definition.id)) {
		throw new Error(
			`[ColdLight] Duplicate effect ID: "${definition.id}" — IDs must be unique across all categories`,
		);
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

	// Index by conflict group
	if (definition.conflictGroup) {
		let groupSet = conflictGroupIndex.get(definition.conflictGroup);
		if (!groupSet) {
			groupSet = new Set();
			conflictGroupIndex.set(definition.conflictGroup, groupSet);
		}
		groupSet.add(definition.id);
	}
}

// =============================================================================
// QUERIES
// =============================================================================

/** Get a single effect definition by ID. O(1). */
export function getEffect(id: string): EffectDefinition | undefined {
	return registry.get(id);
}

/** Get all effect IDs in a category. */
export function getEffectsForCategory(category: EffectCategory): readonly EffectDefinition[] {
	const ids = categoryIndex.get(category);
	if (!ids) return [];
	const results: EffectDefinition[] = [];
	ids.forEach((id) => {
		const def = registry.get(id);
		if (def) results.push(def);
	});
	return results;
}

/** Get all effect IDs in a conflict group. */
export function getConflictGroup(groupName: string): readonly string[] {
	const ids = conflictGroupIndex.get(groupName);
	return ids ? [...ids] : [];
}

/** Check if two effects conflict (belong to same conflict group). */
export function effectsConflict(idA: string, idB: string): boolean {
	const defA = registry.get(idA);
	const defB = registry.get(idB);
	if (!defA?.conflictGroup || !defB?.conflictGroup) return false;
	return defA.conflictGroup === defB.conflictGroup;
}

/** Get total count of registered effects. */
export function getEffectCount(): number {
	return registry.size;
}

// =============================================================================
// MANIFEST SERIALIZATION
// =============================================================================

/** Get all effects as manifest entries (for JSON serialization). */
export function getAllEffectsForManifest(): readonly ManifestEffect[] {
	const results: ManifestEffect[] = [];
	registry.forEach((def) => {
		results.push({
			id: def.id,
			category: def.category,
			label: def.label,
			description: def.description,
			supportedTriggers: [...def.supportedTriggers],
			classes: [...def.classes],
			shadowLayer: def.shadowLayer,
			conflictGroup: def.conflictGroup,
			hasCustomJS: !!def.customJS,
		});
	});
	return results;
}

/** Get per-category manifest entries. */
export function getCategoryManifests(): readonly ManifestEffectCategory[] {
	const results: ManifestEffectCategory[] = [];

	categoryIndex.forEach((ids, category) => {
		const conflictGroups: Record<string, string[]> = {};

		ids.forEach((id) => {
			const def = registry.get(id);
			if (def?.conflictGroup) {
				if (!conflictGroups[def.conflictGroup]) {
					conflictGroups[def.conflictGroup] = [];
				}
				conflictGroups[def.conflictGroup].push(id);
			}
		});

		results.push({
			category,
			effectIds: [...ids],
			conflictGroups,
		});
	});

	return results;
}

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/** Clear the registry. For testing only. */
export function _clearRegistry(): void {
	registry.clear();
	categoryIndex.clear();
	conflictGroupIndex.clear();
}
