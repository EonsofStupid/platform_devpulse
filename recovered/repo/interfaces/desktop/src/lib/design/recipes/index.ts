/**
 * @file Recipe Registry — Schema-Validated
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Central registry for ColdLight recipe definitions.
 * EVERY recipe is validated against RecipeDefinitionSchema at registration.
 * EVERY recipe must declare slots with structural classes + visual mode.
 * The engine (resolveRecipe) produces final classes — recipes are DATA, not functions.
 */

import { type RecipeDefinition, RecipeDefinitionSchema } from "./types.js";

const recipes = new Map<string, RecipeDefinition>();

/**
 * Register a recipe definition.
 * Validates against RecipeDefinitionSchema. Throws if invalid.
 * Warns on duplicate IDs (allows overwrite for hot-reload).
 */
export function registerRecipe(recipe: RecipeDefinition): void {
	// Schema validation — ALWAYS, not just DEV.
	// This is foundation code. Invalid recipes must fail loudly.
	const result = RecipeDefinitionSchema.safeParse(recipe);
	if (!result.success) {
		const errors = result.error.flatten();
		console.error(
			`[ColdLight] Recipe "${recipe.id}" FAILED schema validation:`,
			errors.fieldErrors,
		);
		if (import.meta.env?.DEV) {
			throw new Error(
				`Recipe "${recipe.id}" failed validation: ${JSON.stringify(errors.fieldErrors)}`,
			);
		}
		return;
	}

	if (import.meta.env?.DEV && recipes.has(recipe.id)) {
		console.warn(`[ColdLight] Recipe "${recipe.id}" already registered. Overwriting.`);
	}

	recipes.set(recipe.id, recipe);
}

/** Get a recipe by its full ID (e.g., "widget.glass.void"). */
export function getRecipe(id: string): RecipeDefinition | undefined {
	return recipes.get(id);
}

/** Get all recipes registered for a given kind. */
export function getRecipesForKind(kind: string): RecipeDefinition[] {
	return Array.from(recipes.values()).filter((r) => r.kind === kind);
}

/** Get all registered recipe IDs. */
export function getRecipeIds(): string[] {
	return Array.from(recipes.keys());
}

export { mergeDefaults, resolveRecipe } from "./engine.js";
// Re-exports
export type { DsSurfaceProps, RecipeDefinition, SlotDefinition } from "./types.js";
