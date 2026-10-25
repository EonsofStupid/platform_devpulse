import type { RecipeLegend } from "../../types.js";

export const badgeRecipeIds = ["badge.glass.void"] as const;

export type BadgeRecipeId = (typeof badgeRecipeIds)[number];

export const badgeRecipes: RecipeLegend = {
	kind: "badge",
	defaultId: "badge.glass.void",
	ids: badgeRecipeIds,
};
