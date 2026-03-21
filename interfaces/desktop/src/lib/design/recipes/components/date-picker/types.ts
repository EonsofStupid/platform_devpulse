import type { RecipeLegend } from "../../types.js";
export const datePickerRecipeIds = ["date-picker.glass.void"] as const;
export type DatePickerRecipeId = (typeof datePickerRecipeIds)[number];
export const datePickerRecipes: RecipeLegend = { kind: "date-picker", defaultId: "date-picker.glass.void", ids: datePickerRecipeIds };
