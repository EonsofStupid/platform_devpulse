/**
 * @file Table Component Types
 * @kind table
 * @layer components
 *
 * Extends TablePrimitiveProps with visual preset and sizing.
 */

import type { TablePrimitiveProps } from "$lib/design/primitives/table/index.js";

export type TableSize = "sm" | "md" | "lg";

export type TablePreset = "default" | "stark" | "glass" | "flat" | "matte";
export type TableVariant = "default" | "striped" | "bordered";

/** Table component props — primitive + ColdLight visual */
export interface TableComponentProps extends TablePrimitiveProps {
	/** Size variant — controls cell padding and font size */
	size?: TableSize;
	/** Visual variant — controls border and striping */
	variant?: TableVariant;
	/** Accessible label for the table */
	label?: string;
	/** Style preset. Default: "default". */
	preset?: TablePreset;
}
