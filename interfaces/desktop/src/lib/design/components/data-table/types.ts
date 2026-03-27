/**
 * @file DataTable Component Types
 * @kind data-table
 * @layer components
 *
 * Extends primitive with ARIA grid props, sorting, selection, and sizing.
 * Component layer owns ARIA — primitive is structureless.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type DataTableSize = "sm" | "md" | "lg";
export type DataTableVariant = "default" | "striped" | "bordered";
export type DataTablePreset = "default" | "stark" | "glass" | "flat" | "matte";

/** DataTable component props — ColdLight 8-axis + ARIA + composition + primitive */
export interface DataTableComponentProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ComponentProps {
	children?: Snippet;
	/** Style preset. Default: "default". */
	preset?: DataTablePreset;
	/** Size variant — controls cell padding and font size */
	size?: DataTableSize;
	/** Visual variant — controls border and striping */
	variant?: DataTableVariant;
	/** Accessible label for the data table */
	label?: string;
	/** Total number of rows (including those not currently rendered) */
	rowCount?: number;
	/** Total number of columns */
	colCount?: number;
}
