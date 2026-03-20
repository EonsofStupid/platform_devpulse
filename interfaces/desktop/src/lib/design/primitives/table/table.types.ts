import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export type SortDirection = "ascending" | "descending" | "none";

export interface UseTableProps {
	/** Total number of rows (for aria-rowcount with virtualization). */
	rowCount?: number;
	/** Total number of columns. */
	colCount?: number;
	/** Whether rows are selectable. */
	selectable?: boolean;
	/** Currently selected row keys. */
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	"aria-label"?: string;
}

export interface TableRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "grid";
	"aria-label": string | undefined;
	"aria-rowcount": number | undefined;
	"aria-colcount": number | undefined;
	"aria-multiselectable": boolean | undefined;
}

export interface TableHeaderAttrs extends ColdLightDataAttrs {
	"data-slot": "header";
	role: "rowgroup";
}

export interface TableBodyAttrs extends ColdLightDataAttrs {
	"data-slot": "body";
	role: "rowgroup";
}

export interface TableRowAttrs extends ColdLightDataAttrs {
	"data-slot": "row";
	role: "row";
	"aria-selected": boolean | undefined;
	"aria-disabled": boolean | undefined;
	"data-key": string;
	"data-selected": "" | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface TableCellAttrs extends ColdLightDataAttrs {
	"data-slot": "cell";
	role: "gridcell";
}

export interface TableColumnHeaderAttrs extends ColdLightDataAttrs {
	"data-slot": "column-header";
	role: "columnheader";
	"aria-sort": "ascending" | "descending" | undefined;
	"data-sort": SortDirection;
	onclick: (e: MouseEvent) => void;
}

export interface UseTableReturn {
	readonly root: TableRootAttrs;
	readonly header: TableHeaderAttrs;
	readonly body: TableBodyAttrs;
	getRow(key: string, options?: { disabled?: boolean }): TableRowAttrs;
	getCell(): TableCellAttrs;
	getColumnHeader(options?: {
		sortDirection?: SortDirection;
		onSort?: () => void;
	}): TableColumnHeaderAttrs;
}
