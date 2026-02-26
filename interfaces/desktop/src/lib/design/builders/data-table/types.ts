/**
 * @file builders/data-table/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the DataTable builder.
 * Complex data grid with sorting, selection, pagination ARIA.
 * role="grid", aria-rowcount, aria-colcount, aria-sort, aria-selected.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Sort direction for a column header. */
export type AriaSort = "ascending" | "descending" | "none" | "other";

/** Constructor config for DataTable. MaybeGetter for controlled/uncontrolled. */
export type DataTableProps = {
	/** Accessible label for the data table. */
	label?: MaybeGetter<string | undefined>;
	/** ID of element that labels the data table. */
	labelledBy?: MaybeGetter<string | undefined>;
	/** Total number of rows (including those not currently rendered). */
	rowCount?: MaybeGetter<number | undefined>;
	/** Total number of columns. */
	colCount?: MaybeGetter<number | undefined>;
};
