/**
 * @file builders/data-table/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight DataTable builder — Svelte 5 runes-native.
 * Owns all ARIA semantics.
 *
 * Complex data grid: role="grid", aria-rowcount, aria-colcount.
 * Sorting: aria-sort on head cells.
 * Selection: aria-selected on rows.
 * Rows: aria-rowindex. Cells: aria-colindex.
 *
 * Contract: primitives/data-table/contract.ts
 */

import { Synced } from "../_internal/synced.svelte.js";
import {
	createBuilderMetadata,
} from "../_internal/index.js";
import type { SlotAttrs } from "../_internal/types.js";
import type { DataTableProps, AriaSort } from "./types.js";

const metadata = createBuilderMetadata("data-table", [
	"root",
	"table",
	"header",
	"body",
	"row",
	"cell",
	"caption",
] as const);

export class DataTable {
	readonly ids = metadata.createIds();

	#label: Synced<string | undefined>;
	#labelledBy: Synced<string | undefined>;
	#rowCount: Synced<number | undefined>;
	#colCount: Synced<number | undefined>;

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

	// --- Reactive state ---

	get label(): string | undefined {
		return this.#label.current;
	}

	get labelledBy(): string | undefined {
		return this.#labelledBy.current;
	}

	get rowCount(): number | undefined {
		return this.#rowCount.current;
	}

	get colCount(): number | undefined {
		return this.#colCount.current;
	}

	// --- Element attribute getters ---

	/** Outer wrapper <div> attributes. */
	get root(): SlotAttrs {
		return {
			[metadata.dataAttrs.root]: "",
			id: this.ids.root,
		};
	}

	/** Inner <table> attributes with grid role. */
	get table(): SlotAttrs {
		return {
			[metadata.dataAttrs.table]: "",
			id: this.ids.table,
			role: "grid",
			"aria-label": this.label,
			"aria-labelledby": this.labelledBy,
			"aria-rowcount": this.rowCount,
			"aria-colcount": this.colCount,
		};
	}

	/** <thead> attributes. */
	get header(): SlotAttrs {
		return {
			[metadata.dataAttrs.header]: "",
			id: this.ids.header,
		};
	}

	/** <tbody> attributes. */
	get body(): SlotAttrs {
		return {
			[metadata.dataAttrs.body]: "",
			id: this.ids.body,
		};
	}

	/** <caption> attributes. */
	get caption(): SlotAttrs {
		return {
			[metadata.dataAttrs.caption]: "",
			id: this.ids.caption,
		};
	}

	/**
	 * Get attributes for a <tr> row.
	 * @param opts.selected - Whether the row is selected.
	 * @param opts.rowIndex - 1-based aria-rowindex (position in full dataset).
	 */
	getRow(opts?: { selected?: boolean; rowIndex?: number }): SlotAttrs {
		return {
			[metadata.dataAttrs.row]: "",
			"aria-selected": opts?.selected,
			"aria-rowindex": opts?.rowIndex,
		};
	}

	/**
	 * Get attributes for a <td> cell.
	 * @param opts.colIndex - 1-based aria-colindex.
	 */
	getCell(opts?: { colIndex?: number }): SlotAttrs {
		return {
			[metadata.dataAttrs.cell]: "",
			"aria-colindex": opts?.colIndex,
		};
	}

	/**
	 * Get attributes for a <th> head cell.
	 * @param opts.sort - Sort direction for this column.
	 * @param opts.colIndex - 1-based aria-colindex.
	 */
	getHeadCell(opts?: { sort?: AriaSort; colIndex?: number }): SlotAttrs {
		return {
			[metadata.dataAttrs.cell]: "",
			"aria-sort": opts?.sort,
			"aria-colindex": opts?.colIndex,
		};
	}
}

/** Factory function — preferred API. */
export function createDataTable(props?: DataTableProps): DataTable {
	return new DataTable(props);
}
