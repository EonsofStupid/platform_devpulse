import type { RecipeLegend } from "../../types.js";

export const toggleRecipeIds = ["toggle.glass.void"] as const;

export type ToggleRecipeId = (typeof toggleRecipeIds)[number];

export const toggleRecipes: RecipeLegend = {
	kind: "toggle",
	defaultId: "toggle.glass.void",
	ids: toggleRecipeIds,
};
