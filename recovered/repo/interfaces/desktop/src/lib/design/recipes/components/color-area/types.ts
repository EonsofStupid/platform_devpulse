import type { RecipeLegend } from "../../types.js";
export const colorAreaRecipeIds = ["color-area.glass.void"] as const;
export type ColorAreaRecipeId = (typeof colorAreaRecipeIds)[number];
export const colorAreaRecipes: RecipeLegend = { kind: "color-area", defaultId: "color-area.glass.void", ids: colorAreaRecipeIds };
