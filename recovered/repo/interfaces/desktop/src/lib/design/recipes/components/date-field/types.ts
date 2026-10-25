import type { RecipeLegend } from "../../types.js";
export const dateFieldRecipeIds = ["date-field.glass.void"] as const;
export type DateFieldRecipeId = (typeof dateFieldRecipeIds)[number];
export const dateFieldRecipes: RecipeLegend = { kind: "date-field", defaultId: "date-field.glass.void", ids: dateFieldRecipeIds };
