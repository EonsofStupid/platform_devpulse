import type { RecipeLegend } from "../../types.js";

export const paginationRecipeIds = ["pagination.glass.void"] as const;

export type PaginationRecipeId = (typeof paginationRecipeIds)[number];

export const paginationRecipes: RecipeLegend = {
	kind: "pagination",
	defaultId: "pagination.glass.void",
	ids: paginationRecipeIds,
};
