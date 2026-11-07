import type { RecipeLegend } from "../../types.js";

export const inputGroupRecipeIds = ["input-group.glass.void"] as const;

export type InputGroupRecipeId = (typeof inputGroupRecipeIds)[number];

export const inputGroupRecipes: RecipeLegend = {
	kind: "input-group",
	defaultId: "input-group.glass.void",
	ids: inputGroupRecipeIds,
};
