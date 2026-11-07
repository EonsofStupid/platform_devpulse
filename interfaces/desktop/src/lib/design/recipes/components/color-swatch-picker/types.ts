import type { RecipeLegend } from "../../types.js";
export const colorSwatchPickerRecipeIds = ["color-swatch-picker.glass.void"] as const;
export type ColorSwatchPickerRecipeId = (typeof colorSwatchPickerRecipeIds)[number];
export const colorSwatchPickerRecipes: RecipeLegend = { kind: "color-swatch-picker", defaultId: "color-swatch-picker.glass.void", ids: colorSwatchPickerRecipeIds };
