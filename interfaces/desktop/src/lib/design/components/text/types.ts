/**
 * @file Text Component Types
 * @kind text
 * @layer components
 *
 * ARIA + behavioral props only. ZERO visual.
 * Visual props (size, weight, color, ColdLightProps) belong in ui/text/.
 * Vocabulary types (TextSize, TextWeight, etc.) exported for recipe + ui/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor = "primary" | "secondary" | "muted" | "accent" | "inherit";
export type TextAs = "span" | "p" | "div" | "label" | "strong" | "em" | "small";

/** Text component props — ARIA + behavioral. ZERO visual. */
export interface TextComponentProps extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Polymorphic element tag */
	as?: TextAs;
}
