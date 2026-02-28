/**
 * @file Block Factory — Create BlockNodes
 * @layer blocks
 * @package @devpulse/coldlight
 *
 * Factory function for creating new BlockNode instances.
 * Looks up the recipe registry, applies defaults, generates unique IDs.
 */

import { idGen } from "$lib/design/utils/idGen.js";
import { getRecipe, getRecipesForKind } from "$lib/design/recipes/index.js";
import type { BlockNode } from "./schema.js";

/**
 * Create a new BlockNode for a given kind.
 * Uses the specified recipe or falls back to the first available recipe for the kind.
 */
export function createBlockNode(kind: string, recipeId?: string): BlockNode {
	const recipes = getRecipesForKind(kind);
	const recipe = recipeId ? getRecipe(recipeId) : recipes[0];

	if (!recipe) {
		throw new Error(
			`[VPB] No recipe found for kind "${kind}"${recipeId ? ` (tried "${recipeId}")` : ""}`,
		);
	}

	return {
		id: idGen("blk"),
		kind,
		recipe: recipe.id,
		props: { ...recipe.defaults },
	};
}

/**
 * Create an empty BlockDocument.
 */
export function createBlockDocument(label = "Untitled"): {
	id: string;
	version: 1;
	label: string;
	root: BlockNode[];
	createdAt: string;
	updatedAt: string;
} {
	const now = new Date().toISOString();
	return {
		id: idGen("doc"),
		version: 1,
		label,
		root: [],
		createdAt: now,
		updatedAt: now,
	};
}
