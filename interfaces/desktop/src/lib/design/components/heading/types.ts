/**
 * @file Heading Component Types
 * @kind heading
 * @layer components
 *
 * Semantic heading component with level (1-6) and visual size decoupled.
 * Builder sets role="heading" + aria-level. Component adds recipe styling.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

/** Heading component props — semantic heading with visual size */
export interface HeadingComponentProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Semantic heading level (1-6) — determines HTML tag */
	level?: HeadingLevel;
	/** Visual size — decoupled from semantic level */
	size?: HeadingSize;
}
