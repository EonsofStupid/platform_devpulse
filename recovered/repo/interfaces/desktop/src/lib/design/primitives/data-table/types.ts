/**
 * @file primitives/data-table/types.ts
 * @kind data-table
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * DataTable primitive — enhanced table with sorting, filtering, pagination (wraps tanstack-table).
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const dataTableSlots = ["root", "table", "toolbar", "header", "body", "footer", "row", "head-cell", "cell", "caption", "pagination", "empty"] as const;
export type DataTableSlot = (typeof dataTableSlots)[number];

export const dataTableStateTokens = ["selected", "hover", "loading"] as const satisfies readonly StateToken[];
export type DataTableState = (typeof dataTableStateTokens)[number];

export const dataTableSlotStates = {
	root: ["loading"],
	table: [],
	toolbar: [],
	header: [],
	body: [],
	footer: [],
	row: ["selected", "hover"],
	"head-cell": [],
	cell: [],
	caption: [],
	pagination: [],
	empty: [],
} as const satisfies SlotStateMap<DataTableSlot, DataTableState>;

export interface DataTableProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
