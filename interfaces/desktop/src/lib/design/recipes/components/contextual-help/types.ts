import type { RecipeLegend } from "../../types.js";
export const contextualHelpRecipeIds = ["contextual-help.glass.void"] as const;
export type ContextualHelpRecipeId = (typeof contextualHelpRecipeIds)[number];
export const contextualHelpRecipes: RecipeLegend = { kind: "contextual-help", defaultId: "contextual-help.glass.void", ids: contextualHelpRecipeIds };
