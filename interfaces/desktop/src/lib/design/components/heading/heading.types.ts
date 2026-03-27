/**
 * @file Heading Types
 * @kind heading
 */

import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type HeadingPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface HeadingProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children" | "class"> {
	/** Style preset preset */
	preset?: HeadingPreset;
	/** Heading level (1-6) */
	level?: HeadingLevel;
	/** Size — structural class */
	size?: HeadingSize;
}
