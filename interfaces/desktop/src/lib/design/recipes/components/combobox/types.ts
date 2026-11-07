import type { RecipeLegend } from "../../types.js";

export const comboboxRecipeIds = ["combobox.glass.void"] as const;

export type ComboboxRecipeId = (typeof comboboxRecipeIds)[number];

export const comboboxRecipes: RecipeLegend = {
	kind: "combobox",
	defaultId: "combobox.glass.void",
	ids: comboboxRecipeIds,
};
