/**
 * @file Avatar Component Barrel
 * @kind avatar
 * @layer components
 */

export { default as Avatar } from "./Avatar.svelte";
export { contract as avatarComponentContract } from "./contract.js";
export { avatarRootRecipe, avatarImageRecipe, avatarFallbackRecipe } from "./recipe.js";
export type { AvatarComponentProps, AvatarLoadState } from "./types.js";
