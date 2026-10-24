/**
 * @file Badge — public API
 * @kind badge
 */

export { default as Badge } from "./Badge.svelte";
export type {
	BadgeFillStyle,
	BadgeOverflowMode,
	BadgePreset,
	BadgeProps,
	BadgeSize,
	BadgeVariant,
} from "./badge.types.js";
export { BadgeSchema, type BadgeSchemaProps, CATEGORY } from "./schema.js";
export { badgeSizeTokens, badgeTokens } from "./tokens.js";
