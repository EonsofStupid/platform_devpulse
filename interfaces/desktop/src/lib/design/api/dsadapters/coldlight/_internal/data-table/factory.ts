/**
 * @file builders/data-table/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DataTable builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Complex data grid: `role="grid"`, `aria-rowcount`, `aria-colcount`.
 * Sorting: `aria-sort` on head cells.
 * Selection: `aria-selected` on rows.
 * Rows: `aria-rowindex`. Cells: `aria-colindex`.
 *
 * Slots: root, table, header, body, row, cell, caption.
 *
 * Contract: primitives/data-table/contract.ts
 */

import { Synced } from "../../builders/synced.svelte.js";
import { createBuilderMetadata } from "../../builders/index.js";
import type { DataTableProps, AriaSort } from "./types.js";

// ============================================================================
// Metadata
// ============================================================================

const metadata = createBuilderMetadata("data-table", [
	"root",
	"table",
	"header",
	"body",
	"row",
	"cell",
	"caption",
] as const);

// ============================================================================
// Builder
// ============================================================================

/**
 * ColdLight DataTable builder.
 *
 * Provides ARIA-compliant attribute objects for a complex data grid.
 * Uses `role="grid"` with `aria-rowcount`, `aria-colcount` for virtualized
 * or paginated data sets. Supports sorting via `aria-sort` on head cells
 * and selection via `aria-selected` on rows.
 *
 * @example
 * ```ts
 * const dt = createDataTable({ label: "Users", rowCount: 1000, colCount: 5 });
 * // <div {...dt.root}>
 * //   <table {...dt.table}>
 * //     <thead {...dt.header}>
 * //       <tr {...dt.getRow()}>
 * //         <th {...dt.getHeadCell({ sort: "ascending", colIndex: 1 })}>Name</th>
 * //       </tr>
 * //     </thead>
 * //     <tbody {...dt.body}>
 * //       <tr {...dt.getRow({ selected: true, rowIndex: 1 })}>
 * //         <td {...dt.getCell({ colIndex: 1 })}>Alice</td>
 * //       </tr>
 * //     </tbody>
 * //   </table>
 * // </div>
 * ```
 */
export class DataTable {
	/** Unique IDs for each slot of this data-table instance. */
	readonly ids: Record<"root" | "table" | "header" | "body" | "row" | "cell" | "caption", string> =
		metadata.createIds();

	#label: Synced<string | undefined>;
	#labelledBy: Synced<string | undefined>;
	#rowCount: Synced<number | undefined>;
	#colCount: Synced<number | undefined>;

	/**
	 * Create a new DataTable builder instance.
	 * @param props - Configuration options for the data table.
	 */
	constructor(props: DataTableProps = {}) {
		this.#label = new Synced<string | undefined>({
			value: props.label,
			defaultValue: undefined,
		});
		this.#labelledBy = new Synced<string | undefined>({
			value: props.labelledBy,
			defaultValue: undefined,
		});
		this.#rowCount = new Synced<number | undefined>({
			value: props.rowCount,
			defaultValue: undefined,
		});
		this.#colCount = new Synced<number | undefined>({
			value: props.colCount,
			defaultValue: undefined,
		});
	}

	// ========================================================================
	// Reactive state
	// ========================================================================

	/** The accessible label for the data table. */
	get label(): string | undefined {
		return this.#label.current;
	}

	/** The ID of the element that labels the data table. */
	get labelledBy(): string | undefined {
		return this.#labelledBy.current;
	}

	/** Total number of rows (including those not currently rendered). */
	get rowCount(): number | undefined {
		return this.#rowCount.current;
	}

	/** Total number of columns. */
	get colCount(): number | undefined {
		return this.#colCount.current;
	}

	// ========================================================================
	// Slot attribute getters
	// ========================================================================

	/** Outer wrapper `<div>` attributes. Spread onto the container element. */
	get root() {
		return {
			[metadata.dataAttrs.root]: "" as const,
			id: this.ids.root,
		};
	}

	/** Inner `<table>` attributes with `role="grid"`. Spread onto the `<table>` element. */
	get table() {
		return {
			[metadata.dataAttrs.table]: "" as const,
			id: this.ids.table,
			role: "grid" as const,
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
			"aria-rowcount": this.rowCount,
			"aria-colcount": this.colCount,
		};
	}

	/** `<thead>` attributes. Spread onto the `<thead>` element. */
	get header() {
		return {
			[metadata.dataAttrs.header]: "" as const,
			id: this.ids.header,
		};
	}

	/** `<tbody>` attributes. Spread onto the `<tbody>` element. */
	get body() {
		return {
			[metadata.dataAttrs.body]: "" as const,
			id: this.ids.body,
		};
	}

	/** `<caption>` attributes. Spread onto the `<caption>` element. */
	get caption() {
		return {
			[metadata.dataAttrs.caption]: "" as const,
			id: this.ids.caption,
		};
	}

	// ========================================================================
	// Helper methods
	// ========================================================================

	/**
	 * Get attributes for a `<tr>` row element.
	 * @param opts - Row options.
	 * @param opts.selected - Whether the row is selected (sets `aria-selected`).
	 * @param opts.rowIndex - 1-based `aria-rowindex` (position in full dataset).
	 * @returns Attribute object to spread onto a `<tr>`.
	 */
	getRow(opts?: { selected?: boolean; rowIndex?: number }) {
		return {
			[metadata.dataAttrs.row]: "" as const,
			"aria-selected": opts?.selected,
			"aria-rowindex": opts?.rowIndex,
		};
	}

	/**
	 * Get attributes for a `<td>` cell element.
	 * @param opts - Cell options.
	 * @param opts.colIndex - 1-based `aria-colindex`.
	 * @returns Attribute object to spread onto a `<td>`.
	 */
	getCell(opts?: { colIndex?: number }) {
		return {
			[metadata.dataAttrs.cell]: "" as const,
			"aria-colindex": opts?.colIndex,
		};
	}

	/**
	 * Get attributes for a `<th>` head cell element.
	 * @param opts - Head cell options.
	 * @param opts.sort - Sort direction for this column.
	 * @param opts.colIndex - 1-based `aria-colindex`.
	 * @returns Attribute object to spread onto a `<th>`.
	 */
	getHeadCell(opts?: { sort?: AriaSort; colIndex?: number }) {
		return {
			[metadata.dataAttrs.cell]: "" as const,
			"aria-sort": opts?.sort,
			"aria-colindex": opts?.colIndex,
		};
	}
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Factory function for creating a DataTable builder — preferred API.
 * @param props - Configuration options for the data table.
 * @returns A new `DataTable` builder instance.
 */
export function createDataTable(props?: DataTableProps): DataTable {
	return new DataTable(props);
}
