import type { RecipeLegend } from "../../types.js";

export const toggleGroupRecipeIds = ["toggle-group.glass.void"] as const;

export type ToggleGroupRecipeId = (typeof toggleGroupRecipeIds)[number];

export const toggleGroupRecipes: RecipeLegend = {
	kind: "toggle-group",
	defaultId: "toggle-group.glass.void",
	ids: toggleGroupRecipeIds,
};
