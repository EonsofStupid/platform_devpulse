import type { RecipeLegend } from "../../types.js";

export const cardRecipeIds = ["card.glass.void"] as const;

export type CardRecipeId = (typeof cardRecipeIds)[number];

export const cardRecipes: RecipeLegend = {
	kind: "card",
	defaultId: "card.glass.void",
	ids: cardRecipeIds,
};
