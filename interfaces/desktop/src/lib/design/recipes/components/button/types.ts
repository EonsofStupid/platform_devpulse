import type { RecipeLegend } from "../../types.js";

export const buttonRecipeIds = ["button.glass.void"] as const;

export type ButtonRecipeId = (typeof buttonRecipeIds)[number];

export const buttonRecipes: RecipeLegend = {
	kind: "button",
	defaultId: "button.glass.void",
	ids: buttonRecipeIds,
};
