/**
 * @file Turso Types — re-exported from the relational bindings facade, plus
 * the devtool's view helpers.
 * @module @devpulse/domains/infra/turso/util/turso.types
 */

import type { Affinity, Cell } from "$lib/sys/bindings/sys/relational/index.js";

export type {
	Affinity,
	Cell,
	CellChange,
	Column,
	MigrationStatus,
	Row,
	RowPage,
	SqlOutcome,
	TableSummary,
	TursoDatabase,
	TursoHealth,
} from "$lib/sys/bindings/sys/relational/index.js";

/** Rows shown per page in the table editor. */
export const PAGE_SIZE = 50;

/** What each column type holds, in plain words. */
export const AFFINITY_LABEL: Record<Affinity, string> = {
	integer: "Whole number",
	real: "Decimal number",
	numeric: "Number",
	text: "Text",
	blob: "Any value",
};

/** A cell as one line of text for the rows grid. */
export function cellText(cell: Cell): string {
	switch (cell.kind) {
		case "null":
			return "—";
		case "integer":
		case "real":
			return String(cell.value);
		case "text":
			return cell.value;
		case "blob":
			return `binary · ${cell.value} bytes`;
	}
}
