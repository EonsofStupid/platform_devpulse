import type { RecipeLegend } from "../../types.js";
export const avatarRecipeIds = ["avatar.glass.void"] as const;
export type AvatarRecipeId = (typeof avatarRecipeIds)[number];
export const avatarRecipes: RecipeLegend = { kind: "avatar", defaultId: "avatar.glass.void", ids: avatarRecipeIds };
