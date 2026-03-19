/**
 * @file Text Types
 * @kind text
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold";
export type TextColor = "primary" | "secondary" | "muted" | "accent" | "inherit";

export interface TextProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps,
		Omit<ColdLightProps, "size"> {
	children?: Snippet;
	as?: TextAs;
	size?: TextSize;
	weight?: TextWeight;
	color?: TextColor;
}
