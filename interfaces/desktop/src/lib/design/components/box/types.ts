/**
 * @file Box Component Types
 * @kind box
 * @layer components
 *
 * Extends primitive with padding, border-radius styling props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type BoxPadding = "none" | "sm" | "md" | "lg" | "xl";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "full";

/** Box component props — layout container with padding + radius + ColdLight 8-axis */
export interface BoxComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, Omit<ColdLightProps, "radius"> {
	children?: Snippet;
	/** Padding variant */
	padding?: BoxPadding;
	/** Border radius variant */
	radius?: BoxRadius;
	/** Polymorphic element tag */
	as?: "div" | "section" | "article" | "aside" | "main" | "header" | "footer" | "nav" | "span";
}
