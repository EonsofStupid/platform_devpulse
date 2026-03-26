export interface UseDataTableOptions { label?: string; rowCount?: number; colCount?: number; }
export function useDataTable(opts: UseDataTableOptions) {
	return { root: { role: "grid" as const, "aria-label": opts.label, "aria-rowcount": opts.rowCount, "aria-colcount": opts.colCount } };
}
