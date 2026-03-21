/**
 * @file Badge Component Types
 * @kind badge
 * @layer components
 *
 * DUMB component. Structural presentational label.
 * Visual treatment via class prop from caller.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

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
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Element ID */
	id?: string;
	/** Semantic color variant — drives recipe structural class */
	variant?: BadgeVariant;
	/** Fill style — drives recipe structural class */
	fillStyle?: BadgeFillStyle;
	/** Size — drives recipe structural class */
	size?: BadgeSize;
	/** Text overflow behavior */
	overflowMode?: BadgeOverflowMode;
	/** Whether the badge is purely decorative (aria-hidden) */
	decorative?: boolean;
	/** Text/writing direction */
	dir?: "ltr" | "rtl";
}
