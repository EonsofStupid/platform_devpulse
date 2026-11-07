import type { RecipeLegend } from "../../types.js";

export const tagsInputRecipeIds = ["tags-input.glass.void"] as const;

export type TagsInputRecipeId = (typeof tagsInputRecipeIds)[number];

export const tagsInputRecipes: RecipeLegend = {
	kind: "tags-input",
	defaultId: "tags-input.glass.void",
	ids: tagsInputRecipeIds,
};
