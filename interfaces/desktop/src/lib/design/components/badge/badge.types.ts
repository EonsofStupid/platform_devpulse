/**
 * @file Badge Types
 * @kind badge
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type BadgeVariant =
	| "neutral"
	| "accent"
	| "informative"
	| "positive"
	| "notice"
	| "negative";

export type BadgeFillStyle = "bold" | "subtle" | "outline";
export type BadgeSize = "sm" | "md" | "lg" | "xl";
export type BadgeOverflowMode = "wrap" | "truncate";

export interface BadgeProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class"> {
	/** Semantic color variant — maps to styleId */
	variant?: BadgeVariant;
	/** Fill style */
	fillStyle?: BadgeFillStyle;
	/** Size — structural class */
	size?: BadgeSize;
	/** Text overflow behavior */
	overflowMode?: BadgeOverflowMode;
	/** Whether the badge is purely decorative (aria-hidden) */
	decorative?: boolean;
}
