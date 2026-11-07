import type { RecipeLegend } from "../../types.js";

export const formRecipeIds = ["form.glass.void"] as const;

export type FormRecipeId = (typeof formRecipeIds)[number];

export const formRecipes: RecipeLegend = {
	kind: "form",
	defaultId: "form.glass.void",
	ids: formRecipeIds,
};
