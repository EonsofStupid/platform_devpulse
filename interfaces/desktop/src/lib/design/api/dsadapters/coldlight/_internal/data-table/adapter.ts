/**
 * @file DataTable Adapter — ColdLight Engine → AdapterResult
 * @package @devpulse/coldlight
 *
 * Wraps the ColdLight DataTable builder into the universal AdapterResult.
 * Components call resolveAdapter(DataTableSchema) and get back
 * { states, attrs, handlers, context }. They never see the builder.
 *
 * Note: The data-table builder exposes helper methods for per-row and per-cell
 * attribute derivation (getRow, getCell, getHeadCell). These are surfaced via
 * context so compound components can call them.
 */

import type { AdapterResult } from "../../../_schema/engine.js";
import { DataTable } from "./factory.svelte.js";
import type { DataTableProps, AriaSort } from "./types.js";

/**
 * Create a DataTable adapter returning the universal AdapterResult.
 *
 * @param props - DataTable configuration (label, labelledBy, rowCount, colCount)
 * @returns Universal AdapterResult — states, attrs, handlers, context
 */
export function createAdapter(props?: DataTableProps): AdapterResult {
	const builder = new DataTable(props);

	return {
		states: {},

		attrs: {
			root: {
				get "data-cl-data-table-root"() { return ""; },
				get id() { return builder.ids.root; },
			},
			table: {
				get "data-cl-data-table-table"() { return ""; },
				get id() { return builder.ids.table; },
				get role() { return "grid" as const; },
				get "aria-label"() { return builder.label; },
				get "aria-labelledby"() { return builder.labelledBy; },
				get "aria-rowcount"() { return builder.rowCount !== undefined ? String(builder.rowCount) : undefined; },
				get "aria-colcount"() { return builder.colCount !== undefined ? String(builder.colCount) : undefined; },
			},
			header: {
				get "data-cl-data-table-header"() { return ""; },
				get id() { return builder.ids.header; },
			},
			body: {
				get "data-cl-data-table-body"() { return ""; },
				get id() { return builder.ids.body; },
			},
			row: {
				get "data-cl-data-table-row"() { return ""; },
			},
			cell: {
				get "data-cl-data-table-cell"() { return ""; },
			},
			caption: {
				get "data-cl-data-table-caption"() { return ""; },
				get id() { return builder.ids.caption; },
			},
		},

		handlers: {},

		context: {
			/** Get row attrs with optional selection and row index. */
			getRow: (opts?: { selected?: boolean; rowIndex?: number }) => builder.getRow(opts),
			/** Get cell attrs with optional column index. */
			getCell: (opts?: { colIndex?: number }) => builder.getCell(opts),
			/** Get head cell attrs with optional sort direction and column index. */
			getHeadCell: (opts?: { sort?: AriaSort; colIndex?: number }) => builder.getHeadCell(opts),
		},
	};
}
