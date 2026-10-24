/**
 * @file DataTable Component Types
 * @kind data-table
 * @layer components
 *
 * Extends DataTablePrimitiveProps with visual preset, sizing, and variant.
 */

import type { DataTablePrimitiveProps } from "#coldlight/behaviors/navigation/data-table/index.js";

export type DataTableSize = "sm" | "md" | "lg";
export type DataTableVariant = "default" | "striped" | "bordered";
export type DataTablePreset = "default" | "stark" | "glass" | "flat" | "matte";

/** DataTable component props — primitive + ColdLight visual */
export interface DataTableComponentProps extends DataTablePrimitiveProps {
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
