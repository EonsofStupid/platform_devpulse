import type { RecipeLegend } from "../../types.js";
export const colorFieldRecipeIds = ["color-field.glass.void"] as const;
export type ColorFieldRecipeId = (typeof colorFieldRecipeIds)[number];
export const colorFieldRecipes: RecipeLegend = { kind: "color-field", defaultId: "color-field.glass.void", ids: colorFieldRecipeIds };
