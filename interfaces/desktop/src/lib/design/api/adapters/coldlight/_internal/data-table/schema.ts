/**
 * @file DataTable Schema — SSOT for dsAdapter resolution
 * @package @devpulse/coldlight
 *
 * The schema's engine field tells the resolver which adapter to load.
 * DataTable is ColdLight-owned — engine: "coldlight".
 *
 * Slots: root, table, header, body, row, cell, caption.
 * States: (none — state is per-row/per-cell via helper methods).
 * ARIA: role="grid", aria-label, aria-labelledby, aria-rowcount,
 *       aria-colcount, aria-selected, aria-rowindex, aria-colindex, aria-sort.
 * Interactions: (none — interactions delegated to TanStack Table integration).
 */

import type { ComponentSchema } from "../../../_schema/engine.js";

export const DataTableSchema = {
	kind: "data-table",
	engine: "coldlight",
	slots: ["root", "table", "header", "body", "row", "cell", "caption"],
	states: [],
	aria: [
		"role=grid",
		"aria-label",
		"aria-labelledby",
		"aria-rowcount",
		"aria-colcount",
		"aria-selected",
		"aria-rowindex",
		"aria-colindex",
		"aria-sort",
	],
	interactions: [],
} as const satisfies ComponentSchema;
