import type { RecipeLegend } from "../../types.js";
export const dateRangePickerRecipeIds = ["date-range-picker.glass.void"] as const;
export type DateRangePickerRecipeId = (typeof dateRangePickerRecipeIds)[number];
export const dateRangePickerRecipes: RecipeLegend = { kind: "date-range-picker", defaultId: "date-range-picker.glass.void", ids: dateRangePickerRecipeIds };
