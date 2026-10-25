import type { RecipeLegend } from "../../types.js";

export const bannerRecipeIds = ["banner.glass.void"] as const;

export type BannerRecipeId = (typeof bannerRecipeIds)[number];

export const bannerRecipes: RecipeLegend = {
	kind: "banner",
	defaultId: "banner.glass.void",
	ids: bannerRecipeIds,
};
