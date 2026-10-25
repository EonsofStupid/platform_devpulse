import type { RecipeLegend } from "../../types.js";
export const colorWheelRecipeIds = ["color-wheel.glass.void"] as const;
export type ColorWheelRecipeId = (typeof colorWheelRecipeIds)[number];
export const colorWheelRecipes: RecipeLegend = { kind: "color-wheel", defaultId: "color-wheel.glass.void", ids: colorWheelRecipeIds };
