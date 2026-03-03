/**
 * @file Box Component Types
 * @kind box
 * @layer components
 *
 * ZERO visual. Keeps polymorphic `as` prop (semantic element choice).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type BoxPadding = "none" | "sm" | "md" | "lg" | "xl";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "full";

export interface BoxComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Polymorphic element tag — semantic choice stays in component layer */
	as?: "div" | "section" | "article" | "aside" | "main" | "header" | "footer" | "nav" | "span";
}
