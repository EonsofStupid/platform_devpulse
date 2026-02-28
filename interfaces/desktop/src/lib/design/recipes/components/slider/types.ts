import type { RecipeLegend } from "../../types.js";

export const sliderRecipeIds = ["slider.glass.void"] as const;

export type SliderRecipeId = (typeof sliderRecipeIds)[number];

export const sliderRecipes: RecipeLegend = {
	kind: "slider",
	defaultId: "slider.glass.void",
	ids: sliderRecipeIds,
};
