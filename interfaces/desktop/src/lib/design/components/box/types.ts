/**
 * @file Box Types
 * @kind box
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type BoxPadding = "none" | "sm" | "md" | "lg" | "xl";
export type BoxRadius = "none" | "sm" | "md" | "lg" | "full";

export interface BoxProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, Omit<ColdLightProps, "radius"> {
	children?: Snippet;
	as?: "div" | "section" | "article" | "aside" | "main" | "header" | "footer" | "nav" | "span";
	padding?: BoxPadding;
	radius?: BoxRadius;
}
