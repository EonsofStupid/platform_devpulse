/**
 * @file Text Types
 * @kind text
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";
export type TextPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold";

export interface TextProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children" | "class"> {
	/** Style preset preset */
	preset?: TextPreset;
	/** Semantic HTML element */
	as?: TextAs;
	/** Text size — structural class */
	size?: TextSize;
	/** Font weight — structural class */
	weight?: TextWeight;
}
