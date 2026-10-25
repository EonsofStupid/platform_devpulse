import type { RecipeLegend } from "../../types.js";
export const colorSliderRecipeIds = ["color-slider.glass.void"] as const;
export type ColorSliderRecipeId = (typeof colorSliderRecipeIds)[number];
export const colorSliderRecipes: RecipeLegend = { kind: "color-slider", defaultId: "color-slider.glass.void", ids: colorSliderRecipeIds };
