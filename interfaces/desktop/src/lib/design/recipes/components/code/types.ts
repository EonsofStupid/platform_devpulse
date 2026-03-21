import type { RecipeLegend } from "../../types.js";

export const codeRecipeIds = ["code.glass.void"] as const;

export type CodeRecipeId = (typeof codeRecipeIds)[number];

export const codeRecipes: RecipeLegend = {
	kind: "code",
	defaultId: "code.glass.void",
	ids: codeRecipeIds,
};
