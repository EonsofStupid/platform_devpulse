/**
 * @file Grid Component Types
 * @kind grid
 * @layer components
 *
 * ZERO visual. Layout vocab types kept for recipe/ui consumption.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type GridColumns = "1" | "2" | "3" | "4" | "5" | "6" | "12" | "none";
export type GridGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type GridRows = "1" | "2" | "3" | "4" | "5" | "6" | "none";

export interface GridComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
