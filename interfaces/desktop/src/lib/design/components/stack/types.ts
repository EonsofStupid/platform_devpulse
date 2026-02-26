/**
 * @file Stack Component Types
 * @kind stack
 * @layer components
 *
 * Vertical flex shorthand with gap and alignment props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type StackGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type StackAlign = "start" | "center" | "end" | "stretch";

/** Stack component props — vertical flex layout */
export interface StackComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Gap between items */
	gap?: StackGap;
	/** Cross-axis alignment */
	align?: StackAlign;
}
