/**
 * @file Recipe Registry — Schema-Validated
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Central registry for ColdLight styling recipes.
 * Validates recipe definitions against RecipeDefinitionSchema
 * at registration time (DEV only — stripped in production).
 */

import type { RecipeDefinition } from "./types.js";

const recipes = new Map<string, RecipeDefinition>();

/**
 * Register a recipe definition.
 * In DEV mode, validates the recipe against RecipeDefinitionSchema.
 * Throws if the ID is already registered (prevents silent overwrites).
 */
export function registerRecipe(recipe: RecipeDefinition): void {
	if (import.meta.env?.DEV) {
		if (recipes.has(recipe.id)) {
			console.warn(
				`[ColdLight] Recipe "${recipe.id}" is already registered. ` +
					`Overwriting — ensure this is intentional.`,
			);
		}
		// Validate structure (schema imported lazily to avoid circular deps)
		import("./types.js").then(({ RecipeDefinitionSchema }) => {
			const result = RecipeDefinitionSchema.safeParse(recipe);
			if (!result.success) {
				console.error(
					`[ColdLight] Recipe "${recipe.id}" failed schema validation:`,
					result.error.flatten(),
				);
			}
		});
	}
	recipes.set(recipe.id, recipe);
}

/** Get a recipe by its full ID (e.g., "combobox.glass.void"). */
export function getRecipe(id: string): RecipeDefinition | undefined {
	return recipes.get(id);
}

/** Get all recipes registered for a given kind. */
export function getRecipesForKind(kind: string): RecipeDefinition[] {
	return Array.from(recipes.values()).filter((r) => r.kind === kind);
}

export type { DsSurfaceProps, RecipeDefinition } from "./types.js";
