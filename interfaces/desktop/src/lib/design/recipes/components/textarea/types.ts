import type { RecipeLegend } from "../../types.js";

export const textareaRecipeIds = ["textarea.glass.void"] as const;

export type TextareaRecipeId = (typeof textareaRecipeIds)[number];

export const textareaRecipes: RecipeLegend = {
	kind: "textarea",
	defaultId: "textarea.glass.void",
	ids: textareaRecipeIds,
};
