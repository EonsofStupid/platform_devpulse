import type { RecipeLegend } from "../../types.js";

export const labelRecipeIds = ["label.glass.void"] as const;

export type LabelRecipeId = (typeof labelRecipeIds)[number];

export const labelRecipes: RecipeLegend = {
	kind: "label",
	defaultId: "label.glass.void",
	ids: labelRecipeIds,
};
