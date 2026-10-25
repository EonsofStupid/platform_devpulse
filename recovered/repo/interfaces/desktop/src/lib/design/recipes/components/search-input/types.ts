import type { RecipeLegend } from "../../types.js";

export const searchInputRecipeIds = ["search-input.glass.void"] as const;

export type SearchInputRecipeId = (typeof searchInputRecipeIds)[number];

export const searchInputRecipes: RecipeLegend = {
	kind: "search-input",
	defaultId: "search-input.glass.void",
	ids: searchInputRecipeIds,
};
