import type { RecipeLegend } from "../../types.js";

export const selectRecipeIds = ["select.glass.void"] as const;

export type SelectRecipeId = (typeof selectRecipeIds)[number];

export const selectRecipes: RecipeLegend = {
	kind: "select",
	defaultId: "select.glass.void",
	ids: selectRecipeIds,
};
