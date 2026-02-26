/**
 * @file Grid Recipe
 * @kind grid
 * @layer components
 *
 * CSS Grid layout recipe — columns, gap, rows via Tailwind classes.
 */

import type { GridColumns, GridGap, GridRows } from "./types.js";

const columnStyles: Record<GridColumns, string> = {
	"1": "grid-cols-1",
	"2": "grid-cols-2",
	"3": "grid-cols-3",
	"4": "grid-cols-4",
	"5": "grid-cols-5",
	"6": "grid-cols-6",
	"12": "grid-cols-12",
	none: "grid-cols-none",
};

const gapStyles: Record<GridGap, string> = {
	"0": "gap-0",
	"1": "gap-1",
	"2": "gap-2",
	"3": "gap-3",
	"4": "gap-4",
	"6": "gap-6",
	"8": "gap-8",
	"10": "gap-10",
	"12": "gap-12",
};

const rowStyles: Record<GridRows, string> = {
	"1": "grid-rows-1",
	"2": "grid-rows-2",
	"3": "grid-rows-3",
	"4": "grid-rows-4",
	"5": "grid-rows-5",
	"6": "grid-rows-6",
	none: "grid-rows-none",
};

export function gridRecipe(opts: {
	columns?: GridColumns;
	gap?: GridGap;
	rows?: GridRows;
}): string {
	const parts: string[] = ["grid"];
	if (opts.columns) parts.push(columnStyles[opts.columns]);
	if (opts.gap) parts.push(gapStyles[opts.gap]);
	if (opts.rows) parts.push(rowStyles[opts.rows]);
	return parts.join(" ");
}
