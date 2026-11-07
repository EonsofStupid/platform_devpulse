import type { RecipeLegend } from "../../types.js";
export const colorSwatchRecipeIds = ["color-swatch.glass.void"] as const;
export type ColorSwatchRecipeId = (typeof colorSwatchRecipeIds)[number];
export const colorSwatchRecipes: RecipeLegend = { kind: "color-swatch", defaultId: "color-swatch.glass.void", ids: colorSwatchRecipeIds };
