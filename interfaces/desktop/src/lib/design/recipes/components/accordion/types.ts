import type { RecipeLegend } from "../../types.js";

export const accordionRecipeIds = ["accordion.glass.void"] as const;

export type AccordionRecipeId = (typeof accordionRecipeIds)[number];

export const accordionRecipes: RecipeLegend = {
	kind: "accordion",
	defaultId: "accordion.glass.void",
	ids: accordionRecipeIds,
};
