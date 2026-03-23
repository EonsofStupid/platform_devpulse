/**
 * @file Badge — public API
 * @kind badge
 */

export { default as Badge } from "./Badge.svelte";
export { badgeDef } from "./badge.def.js";
export { BadgeSchema, CATEGORY, type BadgeSchemaProps } from "./schema.js";
export { badgeTokens, badgeSizeTokens } from "./tokens.js";
export { badgeRecipes } from "./composition.js";
export type {
	BadgeProps,
	BadgeVariant,
	BadgeFillStyle,
	BadgeSize,
	BadgeOverflowMode,
} from "./badge.types.js";
