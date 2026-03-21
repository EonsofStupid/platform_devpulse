import type { RecipeLegend } from "../../types.js";
export const avatarGroupRecipeIds = ["avatar-group.glass.void"] as const;
export type AvatarGroupRecipeId = (typeof avatarGroupRecipeIds)[number];
export const avatarGroupRecipes: RecipeLegend = { kind: "avatar-group", defaultId: "avatar-group.glass.void", ids: avatarGroupRecipeIds };
