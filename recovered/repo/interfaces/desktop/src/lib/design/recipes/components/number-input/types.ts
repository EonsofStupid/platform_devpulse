import type { RecipeLegend } from "../../types.js";

export const numberInputRecipeIds = ["number-input.glass.void"] as const;

export type NumberInputRecipeId = (typeof numberInputRecipeIds)[number];

export const numberInputRecipes: RecipeLegend = {
	kind: "number-input",
	defaultId: "number-input.glass.void",
	ids: numberInputRecipeIds,
};
