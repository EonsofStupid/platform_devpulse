/**
 * @file Grid Component Types
 * @kind grid
 * @layer components
 *
 * CSS Grid layout container with columns, gap, rows props.
 * Component layer owns layout — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type GridColumns = "1" | "2" | "3" | "4" | "5" | "6" | "12" | "none";
export type GridGap = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "10" | "12";
export type GridRows = "1" | "2" | "3" | "4" | "5" | "6" | "none";

/** Grid component props — CSS Grid layout + ColdLight 8-axis */
export interface GridComponentProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	/** Number of columns */
	columns?: GridColumns;
	/** Gap between items */
	gap?: GridGap;
	/** Number of rows */
	rows?: GridRows;
}
