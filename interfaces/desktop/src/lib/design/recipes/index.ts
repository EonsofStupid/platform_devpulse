/**
 * @file Recipe Registry
 * @description Central registry for ColdLight styling recipes.
 */

import type { RecipeDefinition } from "./types.js";

const recipes = new Map<string, RecipeDefinition>();

export function registerRecipe(recipe: RecipeDefinition): void {
  recipes.set(recipe.id, recipe);
}

export function getRecipe(id: string): RecipeDefinition | undefined {
  return recipes.get(id);
}

export function getRecipesForKind(kind: string): RecipeDefinition[] {
  return Array.from(recipes.values()).filter((r) => r.kind === kind);
}

export type { RecipeDefinition, DsSurfaceProps } from "./types.js";
