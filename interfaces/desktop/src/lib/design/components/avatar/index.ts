/**
 * @file Avatar — public API
 * @kind avatar
 */

export { default as Avatar } from "./Avatar.svelte";
export { AvatarSchema, CATEGORY, type AvatarSchemaProps } from "./schema.js";
export { avatarTokens } from "./tokens.js";
export type {
	AvatarProps,
	AvatarLoadStatus,
	AvatarStatusChangeDetails,
	AvatarPreset,
} from "./avatar.types.js";
