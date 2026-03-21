/**
 * @file Badge Component Types
 * @kind badge
 * @layer components
 *
 * Badge is a structural presentational label — status indicator,
 * count, notification dot. No complex ARIA. role="status" optional.
 *
 * Spectrum pattern: variant (semantic color) × fillStyle (bold/subtle/outline) × size.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

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

export const BADGE_VARIANT_PRESETS: Record<BadgeVariant, string> = {
	neutral: "badge-ghost",
	accent: "badge-accent",
	informative: "badge-signal",
	positive: "badge-accent",
	notice: "badge-signal",
	negative: "badge-signal",
};

export interface BadgeProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class">,
		Omit<PreparedComponentProps, "size"> {
	/** Element ID. */
	id?: string;
	/** Semantic color variant. Default: "neutral". */
	variant?: BadgeVariant;
	/** Fill style: bold (filled), subtle (tinted bg), outline (border only). Default: "bold". */
	fillStyle?: BadgeFillStyle;
	/** Size. Default: "md". */
	size?: BadgeSize;
	/** Text overflow behavior. Default: "wrap". */
	overflowMode?: BadgeOverflowMode;
	/** Whether the badge is purely decorative (aria-hidden). */
	decorative?: boolean;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}
