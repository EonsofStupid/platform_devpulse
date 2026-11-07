import type { RecipeLegend } from "../../types.js";

export const calloutRecipeIds = ["callout.glass.void"] as const;

export type CalloutRecipeId = (typeof calloutRecipeIds)[number];

export const calloutRecipes: RecipeLegend = {
	kind: "callout",
	defaultId: "callout.glass.void",
	ids: calloutRecipeIds,
};
