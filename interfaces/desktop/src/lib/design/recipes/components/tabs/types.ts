import type { RecipeLegend } from "../../types.js";

export const tabsRecipeIds = ["tabs.glass.void"] as const;

export type TabsRecipeId = (typeof tabsRecipeIds)[number];

export const tabsRecipes: RecipeLegend = {
	kind: "tabs",
	defaultId: "tabs.glass.void",
	ids: tabsRecipeIds,
};
