import type { RecipeLegend } from "../../types.js";

export const dialogRecipeIds = ["dialog.glass.void"] as const;

export type DialogRecipeId = (typeof dialogRecipeIds)[number];

export const dialogRecipes: RecipeLegend = {
	kind: "dialog",
	defaultId: "dialog.glass.void",
	ids: dialogRecipeIds,
};
