import type { RecipeLegend } from "../../types.js";

export const inputRecipeIds = ["input.glass.void"] as const;

export type InputRecipeId = (typeof inputRecipeIds)[number];

export const inputRecipes: RecipeLegend = {
	kind: "input",
	defaultId: "input.glass.void",
	ids: inputRecipeIds,
};
