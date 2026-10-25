/**
 * @file Resolve Classes — BlockNode + Recipe Registry = Class Strings
 * @layer renderers
 * @package @devpulse/coldlight
 *
 * The critical bridge between block data and visual output.
 * Merges recipe defaults with node prop overrides, calls recipe.classes?.(),
 * and returns per-slot shortcode class strings.
 */

import type { BlockNode } from "$lib/design/blocks/schema.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import type { DsSurfaceProps } from "$lib/design/recipes/types.js";

/**
 * Resolve a BlockNode to its per-slot class strings.
 * Merges recipe defaults with node prop overrides.
 *
 * @returns Record<slotName, classString> — e.g. { content: "dialog-content v-void s-glass e-3 sz-md" }
 */
export function resolveClasses(node: BlockNode): Record<string, string> {
	const recipe = getRecipe(node.recipe);
	if (!recipe) {
		if (import.meta.env?.DEV) {
			console.warn(`[Renderer] Unknown recipe: "${node.recipe}" for kind "${node.kind}"`);
		}
		return {};
	}

	const mergedProps = {
		...recipe.defaults,
		...node.props,
	} as unknown as DsSurfaceProps;

	return recipe.classes?.(mergedProps) ?? {};
}
