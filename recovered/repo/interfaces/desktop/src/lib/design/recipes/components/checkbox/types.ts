import type { RecipeLegend } from "../../types.js";

export const checkboxRecipeIds = ["checkbox.glass.void"] as const;

export type CheckboxRecipeId = (typeof checkboxRecipeIds)[number];

export const checkboxRecipes: RecipeLegend = {
	kind: "checkbox",
	defaultId: "checkbox.glass.void",
	ids: checkboxRecipeIds,
};
