/**
 * @file Conflict Resolver
 * @layer compositor/compiler
 * @package @devpulse/coldlight
 *
 * Detects and resolves CSS class conflicts on compositor nodes.
 * Handles both effect-level conflicts (via conflictGroup) and
 * Tailwind utility conflicts (e.g., competing padding classes).
 */

import type { ComposedEffect } from "../../effects/_schema/types.js";
import type { ColdLightManifest } from "../../manifest.js";

/**
 * Check if two effects conflict via conflictGroup.
 * Returns the conflict group name, or null if no conflict.
 */
export function findEffectConflict(
	effectA: string,
	effectB: string,
	manifest: ColdLightManifest,
): string | null {
	const defs = manifest.categories.effects.definitions;
	const defA = defs.find((d) => d.id === effectA);
	const defB = defs.find((d) => d.id === effectB);

	if (!defA?.conflictGroup || !defB?.conflictGroup) return null;
	if (defA.conflictGroup === defB.conflictGroup) return defA.conflictGroup;
	return null;
}

/**
 * Given a list of composed effects, detect all conflicts.
 * Returns an array of conflict descriptions (for warnings).
 */
export function detectConflicts(
	effects: readonly ComposedEffect[],
	manifest: ColdLightManifest,
): readonly string[] {
	const conflicts: string[] = [];
	const seen = new Map<string, string>();

	effects.forEach((effect) => {
		const def = manifest.categories.effects.definitions.find((d) => d.id === effect.effectId);
		if (!def?.conflictGroup) return;

		const existing = seen.get(def.conflictGroup);
		if (existing) {
			conflicts.push(
				`Conflict: "${existing}" and "${effect.effectId}" in group "${def.conflictGroup}" — last wins`,
			);
		}
		seen.set(def.conflictGroup, effect.effectId);
	});

	return conflicts;
}

/**
 * Deduplicate CSS classes, preserving order.
 * Later occurrences win over earlier ones for conflicting Tailwind utilities.
 */
export function deduplicateClasses(classes: readonly string[]): string {
	const seen = new Set<string>();
	const result: string[] = [];

	// Process in reverse so last occurrence wins
	for (let i = classes.length - 1; i >= 0; i--) {
		const cls = classes[i].trim();
		if (cls && !seen.has(cls)) {
			seen.add(cls);
			result.unshift(cls);
		}
	}

	return result.join(" ");
}
