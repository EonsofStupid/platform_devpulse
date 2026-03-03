/**
 * @file Stack Component Types
 * @kind stack
 * @layer components
 *
 * ZERO visual. Layout vocab types kept for recipe/ui consumption.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type StackGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type StackAlign = "start" | "center" | "end" | "stretch";

export interface StackComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
