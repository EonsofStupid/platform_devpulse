import type { A11ySpec } from "../../schema/a11y.schema.js";

export const tableA11y: A11ySpec = {
	roles: {
		root: "grid",
		header: "rowgroup",
		body: "rowgroup",
		row: "row",
		cell: "gridcell",
		"column-header": "columnheader",
	},
	requiredAttrs: {
		root: ["aria-label", "aria-rowcount", "aria-colcount"],
		"column-header": ["aria-sort"],
	},
	keyboard: [
		{ key: "ArrowDown", action: "next-row" },
		{ key: "ArrowUp", action: "prev-row" },
		{ key: "ArrowRight", action: "next-cell" },
		{ key: "ArrowLeft", action: "prev-cell" },
		{ key: "Home", action: "first-cell-in-row" },
		{ key: "End", action: "last-cell-in-row" },
		{ key: "Space", action: "select-row", condition: "selectable" },
	],
	focusStrategy: "roving",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",
};
