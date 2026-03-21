import type { RecipeLegend } from "../../types.js";
export const collapsibleRecipeIds = ["collapsible.glass.void"] as const;
export type CollapsibleRecipeId = (typeof collapsibleRecipeIds)[number];
export const collapsibleRecipes: RecipeLegend = { kind: "collapsible", defaultId: "collapsible.glass.void", ids: collapsibleRecipeIds };
