/**
 * @file Avatar — public API
 * @kind avatar
 */

export { default as Avatar } from "./Avatar.svelte";
export { avatarDef } from "./avatar.def.js";
export { AvatarSchema, CATEGORY, type AvatarSchemaProps } from "./schema.js";
export { avatarTokens } from "./tokens.js";
export { avatarRecipes } from "./recipe.js";
export type {
	AvatarProps,
	AvatarLoadStatus,
	AvatarStatusChangeDetails,
} from "./avatar.types.js";
