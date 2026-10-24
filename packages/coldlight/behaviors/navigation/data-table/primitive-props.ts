import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

/** Sort direction for data table columns */
export type DataTableSortDirection = "ascending" | "descending" | "none";

/** Row selection mode */
export type DataTableSelectionMode = "none" | "single" | "multiple";

/**
 * Structural props for the DataTable primitive.
 *
 * A data table extends the basic table with sorting, filtering,
 * row selection, and pagination. For simple static tables, use Table.
 * For spreadsheet-like editing, build on GridList instead.
 *
 * @example
 * ```svelte
 * <div {...dataTableAnatomy.attrs.root}>
 *   <div {...dataTableAnatomy.attrs.toolbar} role="toolbar">
 *     <!-- filters, search -->
 *   </div>
 *   <table {...dataTableAnatomy.attrs.table} aria-label="Users">
 *     <thead {...dataTableAnatomy.attrs.header}>
 *       <tr {...dataTableAnatomy.attrs.row}>
 *         <th {...dataTableAnatomy.attrs["column-header"]} aria-sort="ascending">Name</th>
 *       </tr>
 *     </thead>
 *     <tbody {...dataTableAnatomy.attrs.body}>
 *       <tr {...dataTableAnatomy.attrs.row}>
 *         <td {...dataTableAnatomy.attrs.cell}>Alice</td>
 *       </tr>
 *     </tbody>
 *   </table>
 *   <nav {...dataTableAnatomy.attrs.pagination} aria-label="Table pagination" />
 * </div>
 * ```
 */
export interface DataTablePrimitiveProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
	/** Snippet content rendered inside the data table */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Row selection mode. Default: "none" */
	selectionMode?: DataTableSelectionMode;
	/** Currently selected row keys */
	selectedKeys?: Set<string>;
	/** Callback when selection changes */
	onSelectionChange?: (keys: Set<string>) => void;
	/** Current sort column */
	sortColumn?: string;
	/** Current sort direction */
	sortDirection?: DataTableSortDirection;
	/** Callback when sort changes */
	onSortChange?: (column: string, direction: DataTableSortDirection) => void;
	/** Current page (1-indexed) */
	page?: number;
	/** Rows per page */
	pageSize?: number;
	/** Total row count (for server-side pagination) */
	totalRows?: number;
	/** Callback when page changes */
	onPageChange?: (page: number) => void;
}
