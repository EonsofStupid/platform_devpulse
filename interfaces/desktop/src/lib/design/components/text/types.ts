/**
 * @file Text Component Types
 * @kind text
 * @layer components
 *
 * Typography text component with size, weight, color, and polymorphic element.
 * Component layer owns styling — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor = "default" | "muted" | "accent" | "inherit";
export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";

/** Text component props — typography */
export interface TextComponentProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Font size variant */
	size?: TextSize;
	/** Font weight variant */
	weight?: TextWeight;
	/** Text color variant */
	color?: TextColor;
	/** Polymorphic element tag */
	as?: TextAs;
}
