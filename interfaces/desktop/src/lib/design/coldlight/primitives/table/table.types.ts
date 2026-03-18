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

export interface UseTableReturn {
	readonly root: Record<string, unknown>;
	readonly header: Record<string, unknown>;
	readonly body: Record<string, unknown>;
	getRow(key: string, options?: { disabled?: boolean }): Record<string, unknown>;
	getCell(): Record<string, unknown>;
	getColumnHeader(options?: {
		sortDirection?: SortDirection;
		onSort?: () => void;
	}): Record<string, unknown>;
}
