/**
 * @file HStack Component Types
 * @kind hstack
 * @layer components
 *
 * ZERO visual. Layout vocab types kept for recipe/ui consumption.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type HStackGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type HStackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type HStackJustify = "start" | "center" | "end" | "between";

export interface HStackComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
