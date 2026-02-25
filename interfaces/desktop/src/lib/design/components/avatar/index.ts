/**
 * @file Avatar Component Barrel
 * @kind avatar
 * @layer components
 */

export { default as Avatar } from "./Avatar.svelte";
export { contract as avatarComponentContract } from "./contract.js";
export { avatarRootRecipe, avatarImageRecipe, avatarFallbackRecipe } from "./recipe.js";
export type { AvatarComponentProps, AvatarSize, AvatarLoadState } from "./types.js";
