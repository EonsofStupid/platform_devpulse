import type { RecipeLegend } from "../../types.js";

export const switchRecipeIds = ["switch.glass.void"] as const;

export type SwitchRecipeId = (typeof switchRecipeIds)[number];

export const switchRecipes: RecipeLegend = {
	kind: "switch",
	defaultId: "switch.glass.void",
	ids: switchRecipeIds,
};
