/**
 * @file Badge Types
 * @kind badge
 */

import type { BadgePrimitiveProps } from "#coldlight/behaviors/display/badge/index.js";

export type BadgeVariant =
	| "neutral"
	| "accent"
	| "informative"
	| "positive"
	| "notice"
	| "negative";

export type BadgePreset = "default" | "stark" | "glass" | "flat" | "matte";
export type BadgeFillStyle = "bold" | "subtle" | "outline";
export type BadgeSize = "sm" | "md" | "lg" | "xl";
export type BadgeOverflowMode = "wrap" | "truncate";

export interface BadgeProps extends BadgePrimitiveProps {
	/** Semantic color variant — maps to styleId */
	variant?: BadgeVariant;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: BadgePreset;
	/** Fill style */
	fillStyle?: BadgeFillStyle;
	/** Size class. Default: "md" */
	size?: BadgeSize;
	/** Text overflow behavior */
	overflowMode?: BadgeOverflowMode;
	/** Whether the badge is purely decorative (aria-hidden) */
	decorative?: boolean;
}
