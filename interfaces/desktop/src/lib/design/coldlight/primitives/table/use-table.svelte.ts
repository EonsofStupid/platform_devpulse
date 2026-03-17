/**
 * useTable — ColdLight table/grid primitive hook.
 *
 * Accessible grid with row selection, column sorting, and keyboard navigation.
 * Parts: root (grid), header (rowgroup), body (rowgroup), row (parameterized),
 * cell, column-header (parameterized).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import { uid } from "../../_internal/utils/uid.js";
import { dataAttr } from "../../_internal/utils/data-attr.js";
import { tableAnatomy } from "./table.anatomy.js";
import type { UseTableProps, UseTableReturn, SortDirection } from "./table.types.js";

export function useTable(props: UseTableProps = {}): UseTableReturn {
	const id = uid("table");
	const selectable = props.selectable ?? false;

	const root = $derived({
		...tableAnatomy.attrs.root,
		id,
		role: "grid" as const,
		"aria-label": props["aria-label"],
		"aria-rowcount": props.rowCount,
		"aria-colcount": props.colCount,
		"aria-multiselectable": selectable || undefined,
	});

	const header = $derived({ ...tableAnatomy.attrs.header, role: "rowgroup" as const });
	const body = $derived({ ...tableAnatomy.attrs.body, role: "rowgroup" as const });

	return {
		get root() { return root; },
		get header() { return header; },
		get body() { return body; },

		getRow(key: string, options?: { disabled?: boolean }) {
			const selected = props.selectedKeys?.has(key) ?? false;
			const isDisabled = options?.disabled ?? false;
			return {
				...tableAnatomy.attrs.row,
				role: "row" as const,
				"aria-selected": selectable ? selected : undefined,
				"aria-disabled": isDisabled || undefined,
				"data-key": key,
				"data-selected": selected ? ("" as const) : undefined,
				"data-disabled": isDisabled ? ("" as const) : undefined,
				onclick: () => {
					if (!selectable || isDisabled) return;
					const keys = new Set(props.selectedKeys ?? []);
					if (keys.has(key)) keys.delete(key);
					else keys.add(key);
					props.onSelectionChange?.(keys);
				},
			};
		},

		getCell() {
			return {
				...tableAnatomy.attrs.cell,
				role: "gridcell" as const,
			};
		},

		getColumnHeader(options?: { sortDirection?: SortDirection; onSort?: () => void }) {
			const sort = options?.sortDirection ?? "none";
			return {
				...tableAnatomy.attrs["column-header"],
				role: "columnheader" as const,
				"aria-sort": sort !== "none" ? sort : undefined,
				"data-sort": sort,
				onclick: () => options?.onSort?.(),
			};
		},
	};
}
