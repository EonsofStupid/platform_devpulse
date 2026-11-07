/**
 * @file CSS Pass
 * @layer compositor/compiler
 * @package @devpulse/coldlight
 *
 * Merges baseStyles + effect classes into unified class strings.
 * Produces static classes (trigger: "always") and conditional
 * class groups (keyed by trigger type).
 */

import type { CompositorNode, EffectTrigger } from "../../effects/_schema/types.js";
import { getEffect } from "../../effects/registry.js";
import type { ColdLightManifest } from "../../manifest.js";
import { deduplicateClasses } from "./conflict-resolver.js";

export interface CssPassOutput {
	/** Static classes — always applied */
	readonly staticClasses: string;
	/** Conditional classes keyed by trigger */
	readonly conditionalClasses: Readonly<Partial<Record<EffectTrigger, string>>>;
	/** CSS custom properties to set (from effect cssProperties) */
	readonly cssProperties: Readonly<Record<string, string>>;
	/** Warnings generated during CSS pass */
	readonly warnings: readonly string[];
}

/**
 * Run the CSS pass on a compositor node.
 * Collects all static and conditional classes from base styles + effects.
 */
export function cssPass(node: CompositorNode, _manifest: ColdLightManifest): CssPassOutput {
	const staticClassList: string[] = [...node.baseStyles];
	const conditionalMap = new Map<EffectTrigger, string[]>();
	const cssProperties: Record<string, string> = {};
	const warnings: string[] = [];

	// Process each composed effect — resolve from runtime registry (has full type info)
	node.composedEffects.forEach((effect) => {
		const def = getEffect(effect.effectId);

		if (!def) {
			warnings.push(`Effect "${effect.effectId}" not found in registry — skipped`);
			return;
		}

		// Determine which classes to use (override or definition default)
		const classes = effect.tailwindClasses ?? def.classes;

		// Collect CSS custom properties from the effect definition
		if (def.cssProperties) {
			Object.entries(def.cssProperties).forEach(([key, value]) => {
				cssProperties[key] = value;
			});
		}

		// Route classes to static or conditional based on trigger
		if (effect.trigger === "always") {
			staticClassList.push(...classes);
		} else {
			let triggerList = conditionalMap.get(effect.trigger);
			if (!triggerList) {
				triggerList = [];
				conditionalMap.set(effect.trigger, triggerList);
			}
			triggerList.push(...classes);
		}
	});

	// Build conditional classes output
	const conditionalClasses: Partial<Record<EffectTrigger, string>> = {};
	conditionalMap.forEach((classes, trigger) => {
		conditionalClasses[trigger] = deduplicateClasses(classes);
	});

	return {
		staticClasses: deduplicateClasses(staticClassList),
		conditionalClasses,
		cssProperties,
		warnings,
	};
}
