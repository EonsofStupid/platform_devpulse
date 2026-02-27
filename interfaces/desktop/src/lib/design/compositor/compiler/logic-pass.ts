/**
 * @file Logic Pass
 * @layer compositor/compiler
 * @package @devpulse/coldlight
 *
 * Wires customJS effect modules to Svelte actions.
 * Inspects each composed effect — if the effect definition has
 * customJS, produces a CompiledAction for the renderer to wire.
 */

import type { ColdLightManifest } from "../../scanner.types.js";
import type { CompositorNode, CompiledAction } from "../../effects/_schema/types.js";
import { getEffect } from "../../effects/registry.js";

export interface LogicPassOutput {
	/** Svelte actions to wire onto the element */
	readonly actions: readonly CompiledAction[];
	/** Warnings generated during logic pass */
	readonly warnings: readonly string[];
}

/**
 * Run the logic pass on a compositor node.
 * Collects all customJS modules from composed effects and produces
 * CompiledAction entries for the renderer.
 */
export function logicPass(
	node: CompositorNode,
	manifest: ColdLightManifest,
): LogicPassOutput {
	const actions: CompiledAction[] = [];
	const warnings: string[] = [];

	node.composedEffects.forEach((effect) => {
		// Resolve from runtime registry — ManifestEffect strips customJS detail
		const def = getEffect(effect.effectId);

		if (!def) return; // Already warned in CSS pass

		// Check for customJS on the definition
		if (def.customJS) {
			// Use effect-level override params if provided, else definition defaults
			const params = effect.customJS?.params ?? def.customJS.defaultParams;
			const module = effect.customJS?.module ?? def.customJS.module;

			actions.push({
				action: deriveActionName(module),
				module,
				params: { ...params },
			});
		}
	});

	return { actions, warnings };
}

/**
 * Derive a Svelte action name from the module path.
 * "effects/actions/intersection-reveal" → "useIntersectionReveal"
 */
function deriveActionName(modulePath: string): string {
	const segments = modulePath.split("/");
	const filename = segments[segments.length - 1];
	const parts = filename.split("-");
	const camelCase = parts
		.map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
		.join("");
	return `use${camelCase.charAt(0).toUpperCase()}${camelCase.slice(1)}`;
}
