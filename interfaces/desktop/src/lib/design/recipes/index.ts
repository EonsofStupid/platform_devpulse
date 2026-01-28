/**
 * @file design/recipes/index.ts
 * @description Recipe registry - styling patterns for blocks
 *
 * Recipes map block kinds to CSS class compositions.
 * TODO: Implement recipe system
 */

import type { BlockKind } from "$lib/design/taxonomy/vpb";

/** Recipe definition */
export interface RecipeDefinition {
  id: string;
  kind: BlockKind;
  label: string;
  classes: Record<string, string>;
}

/** Recipe registry (stub) */
const recipes = new Map<string, RecipeDefinition>();

/** Get recipe by ID */
export function getRecipe(id: string): RecipeDefinition | undefined {
  return recipes.get(id);
}

/** Get all recipes for a kind */
export function getRecipesForKind(kind: BlockKind): RecipeDefinition[] {
  return Array.from(recipes.values()).filter((r) => r.kind === kind);
}

/** Register a recipe */
export function registerRecipe(recipe: RecipeDefinition): void {
  recipes.set(recipe.id, recipe);
}
