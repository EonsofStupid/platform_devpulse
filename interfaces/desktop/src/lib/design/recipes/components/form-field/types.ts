import type { RecipeLegend } from "../../types.js";

export const formFieldRecipeIds = ["form-field.glass.void"] as const;

export type FormFieldRecipeId = (typeof formFieldRecipeIds)[number];

export const formFieldRecipes: RecipeLegend = {
	kind: "form-field",
	defaultId: "form-field.glass.void",
	ids: formFieldRecipeIds,
};
