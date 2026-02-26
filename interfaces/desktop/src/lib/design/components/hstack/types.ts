/**
 * @file HStack Component Types
 * @kind hstack
 * @layer components
 *
 * Horizontal flex shorthand with gap and alignment props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type HStackGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type HStackAlign = "start" | "center" | "end" | "stretch" | "baseline";

/** HStack component props — horizontal flex layout */
export interface HStackComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Gap between items */
	gap?: HStackGap;
	/** Cross-axis alignment */
	align?: HStackAlign;
}
