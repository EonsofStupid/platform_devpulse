/**
 * @file Heading Component Types
 * @kind heading
 * @layer components
 *
 * ARIA + behavioral props only. ZERO visual.
 * Visual props (size, ColdLightProps) belong in ui/heading/.
 * Vocabulary types (HeadingLevel, HeadingSize) exported for recipe + ui/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

/** Heading component props — ARIA + behavioral. ZERO visual. */
export interface HeadingComponentProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic heading level (1-6) — determines HTML tag */
	level?: HeadingLevel;
}
