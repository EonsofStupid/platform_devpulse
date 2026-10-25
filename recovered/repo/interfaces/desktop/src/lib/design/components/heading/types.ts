/**
 * @file Heading Types
 * @kind heading
 * @layer components
 *
 * DUMB component. Semantic heading element only.
 * Visual treatment via class prop from caller.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface HeadingProps
	extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
	/** CSS classes — structural + visual from caller */
	class?: string;
	/** Children snippet */
	children?: Snippet;
	/** Heading level (1-6) */
	level?: HeadingLevel;
	/** Size — drives recipe structural class */
	size?: HeadingSize;
}
