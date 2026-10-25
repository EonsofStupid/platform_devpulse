/**
 * @file Text Types
 * @kind text
 * @layer components
 *
 * DUMB component. Typography + semantic element only.
 * Visual treatment via class prop from caller.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold";
export type TextColor = "primary" | "secondary" | "muted" | "accent" | "inherit";

export interface TextProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Semantic HTML element */
	as?: TextAs;
	/** Text size — drives recipe structural class */
	size?: TextSize;
	/** Font weight — drives recipe structural class */
	weight?: TextWeight;
	/** Text color — drives recipe structural class */
	color?: TextColor;
}
