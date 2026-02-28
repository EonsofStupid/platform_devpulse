import type { RecipeLegend } from "../../types.js";

export const radioGroupRecipeIds = ["radio-group.glass.void"] as const;

export type RadioGroupRecipeId = (typeof radioGroupRecipeIds)[number];

export const radioGroupRecipes: RecipeLegend = {
	kind: "radio-group",
	defaultId: "radio-group.glass.void",
	ids: radioGroupRecipeIds,
};
