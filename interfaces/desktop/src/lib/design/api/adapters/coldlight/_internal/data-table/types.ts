/**
 * @file builders/data-table/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the DataTable builder.
 * Complex data grid with sorting, selection, pagination ARIA.
 * `role="grid"`, `aria-rowcount`, `aria-colcount`, `aria-sort`, `aria-selected`.
 */

import type { MaybeGetter } from "../../builders/types.js";

/**
 * Sort direction for a column header.
 *
 * Maps directly to the `aria-sort` attribute values.
 * - `"ascending"` — sorted in ascending order
 * - `"descending"` — sorted in descending order
 * - `"none"` — column is sortable but not currently sorted
 * - `"other"` — sorted in a non-standard order
 */
export type AriaSort = "ascending" | "descending" | "none" | "other";

/**
 * Constructor config for the DataTable builder.
 *
 * All props support `MaybeGetter<T>` for controlled/uncontrolled patterns.
 */
export type DataTableProps = {
	/**
	 * Accessible label for the data table.
	 * Sets `aria-label` on the inner `<table>` element.
	 * @default undefined
	 */
	label?: MaybeGetter<string | undefined>;

	/**
	 * ID of element that labels the data table.
	 * Sets `aria-labelledby` on the inner `<table>` element.
	 * @default undefined
	 */
	labelledBy?: MaybeGetter<string | undefined>;

	/**
	 * Total number of rows (including those not currently rendered).
	 * Sets `aria-rowcount` on the grid for virtualized or paginated data.
	 * @default undefined
	 */
	rowCount?: MaybeGetter<number | undefined>;

	/**
	 * Total number of columns.
	 * Sets `aria-colcount` on the grid.
	 * @default undefined
	 */
	colCount?: MaybeGetter<number | undefined>;
};
