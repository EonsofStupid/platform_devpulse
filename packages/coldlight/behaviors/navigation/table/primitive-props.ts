import type { Snippet } from "svelte";
import type { HTMLTableAttributes } from "svelte/elements";

/** Sort direction for table columns */
export type TableSortDirection = "ascending" | "descending" | "none";

/** Selection mode for table rows */
export type TableSelectionMode = "none" | "single" | "multiple";

/**
 * Structural props for the Table primitive.
 *
 * A table displays structured data in rows and columns with optional
 * sorting and row selection. For unstructured item grids, use GridList.
 * For key-value pairs, use a definition list instead.
 *
 * @example
 * ```svelte
 * <table {...tableAnatomy.attrs.root} aria-label="Users">
 *   <thead {...tableAnatomy.attrs.header}>
 *     <tr {...tableAnatomy.attrs.row}>
 *       <th {...tableAnatomy.attrs["column-header"]} aria-sort="ascending">Name</th>
 *       <th {...tableAnatomy.attrs["column-header"]}>Email</th>
 *     </tr>
 *   </thead>
 *   <tbody {...tableAnatomy.attrs.body}>
 *     <tr {...tableAnatomy.attrs.row}>
 *       <td {...tableAnatomy.attrs.cell}>Alice</td>
 *       <td {...tableAnatomy.attrs.cell}>alice@example.com</td>
 *     </tr>
 *   </tbody>
 * </table>
 * ```
 */
export interface TablePrimitiveProps extends Omit<HTMLTableAttributes, "children"> {
	/** Snippet content rendered inside the table */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** Whether columns are sortable. Default: false */
	sortable?: boolean;
	/** Row selection mode. Default: "none" */
	selectionMode?: TableSelectionMode;
	/** Currently selected row keys */
	selectedKeys?: Set<string>;
	/** Callback when row selection changes */
	onSelectionChange?: (keys: Set<string>) => void;
	/** Current sort column key */
	sortColumn?: string;
	/** Current sort direction */
	sortDirection?: TableSortDirection;
	/** Callback when sort changes */
	onSortChange?: (column: string, direction: TableSortDirection) => void;
}
