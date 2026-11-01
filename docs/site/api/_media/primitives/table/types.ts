/**
 * @file primitives/table/types.ts
 * @kind table
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Table primitive — semantic HTML table with proper structure.
 * ariaStateProvider: "coldlight"
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { StateToken, SlotStateMap } from "../_schema/types.js";
import type { BaseProps } from "../types.js";

export const tableSlots = ["root", "header", "body", "footer", "row", "head-cell", "cell", "caption"] as const;
export type TableSlot = (typeof tableSlots)[number];

export const tableStateTokens = ["selected", "hover"] as const satisfies readonly StateToken[];
export type TableState = (typeof tableStateTokens)[number];

export const tableSlotStates = {
	root: [],
	header: [],
	body: [],
	footer: [],
	row: ["selected", "hover"],
	"head-cell": [],
	cell: [],
	caption: [],
} as const satisfies SlotStateMap<TableSlot, TableState>;

export interface TableProps extends Omit<HTMLAttributes<HTMLTableElement>, "style" | "children">, BaseProps {
	children?: Snippet;
}
