/**
 * @file Avatar — public API
 * @kind avatar
 */

export { default as Avatar } from "./Avatar.svelte";
export type {
	AvatarLoadStatus,
	AvatarPreset,
	AvatarProps,
	AvatarStatusChangeDetails,
} from "./avatar.types.js";
export { AvatarSchema, type AvatarSchemaProps, CATEGORY } from "./schema.js";
export { avatarTokens } from "./tokens.js";
