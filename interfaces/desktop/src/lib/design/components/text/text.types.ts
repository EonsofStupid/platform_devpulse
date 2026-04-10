/**
 * @file Text Types
 * @kind text
 */

import type { TextPrimitiveProps } from "$lib/design/behaviors/display/text/index.js";

export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";
export type TextPreset = "default" | "stark" | "glass" | "flat" | "matte";
export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold";

export interface TextProps extends Omit<TextPrimitiveProps, "as"> {
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: TextPreset;
	/** Semantic HTML element. Default: "span" */
	as?: TextAs;
	/** Text size class. Default: "base" */
	size?: TextSize;
	/** Font weight class. Default: "normal" */
	weight?: TextWeight;
}
