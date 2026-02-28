import type { RecipeLegend } from "../../types.js";

export const colorInputRecipeIds = ["color-input.glass.void"] as const;

export type ColorInputRecipeId = (typeof colorInputRecipeIds)[number];

export const colorInputRecipes: RecipeLegend = {
	kind: "color-input",
	defaultId: "color-input.glass.void",
	ids: colorInputRecipeIds,
};
