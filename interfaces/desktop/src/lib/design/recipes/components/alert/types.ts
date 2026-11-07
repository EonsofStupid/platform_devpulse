import type { RecipeLegend } from "../../types.js";

export const alertRecipeIds = ["alert.glass.void"] as const;

export type AlertRecipeId = (typeof alertRecipeIds)[number];

export const alertRecipes: RecipeLegend = {
	kind: "alert",
	defaultId: "alert.glass.void",
	ids: alertRecipeIds,
};
