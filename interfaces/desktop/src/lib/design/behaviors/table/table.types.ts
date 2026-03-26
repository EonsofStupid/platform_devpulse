import type { HTMLAttributes } from "svelte/elements";

export type SortDirection = "ascending" | "descending" | "none";

export interface UseTableProps {
	rowCount?: number;
	colCount?: number;
	selectable?: boolean;
	selectedKeys?: Set<string>;
	onSelectionChange?: (keys: Set<string>) => void;
	"aria-label"?: string;
}

export type TableRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "root";
};

export type TableHeaderAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "header";
};

export type TableBodyAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "body";
};

export type TableRowAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "row";
	"data-key": string;
	"data-selected"?: "";
	"data-disabled"?: "";
};

export type TableCellAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "cell";
};

export type TableColumnHeaderAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "table";
	"data-slot": "column-header";
	"data-sort": SortDirection;
};

export interface UseTableReturn {
	readonly root: TableRootAttrs;
	readonly header: TableHeaderAttrs;
	readonly body: TableBodyAttrs;
	getRow(key: string, options?: { disabled?: boolean }): TableRowAttrs;
	getCell(): TableCellAttrs;
	getColumnHeader(options?: { sortDirection?: SortDirection; onSort?: () => void }): TableColumnHeaderAttrs;
}
