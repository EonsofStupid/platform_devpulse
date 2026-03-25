/**
 * @file Badge — public API
 * @kind badge
 */

export { default as Badge } from "./Badge.svelte";
export { BadgeSchema, CATEGORY, type BadgeSchemaProps } from "./schema.js";
export { badgeTokens, badgeSizeTokens } from "./tokens.js";
export type {
	BadgeProps,
	BadgeIntent,
	BadgeVariant,
	BadgeFillStyle,
	BadgeSize,
	BadgeOverflowMode,
} from "./badge.types.js";
