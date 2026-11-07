/**
 * @file DataTable Component Contract
 * @kind data-table
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Enhanced data grid: role="grid", aria-rowcount, aria-colcount.
 * Sorting via aria-sort on head cells.
 * Selection via aria-selected on rows.
 *
 * Reference: W3C WAI-ARIA APG Grid Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * DataTable component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Enhanced data table with grid semantics for sorting, filtering, selection.
 */
export const contract = {
	kind: "data-table",
	description:
		"Enhanced data table with grid semantics for sorting, filtering, and selection. Uses role='grid' with aria-rowcount, aria-colcount for virtualized data sets. Supports aria-sort on column headers and aria-selected on rows.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/grid/",

	slots: {
		required: ["root"],
		optional: ["table", "header", "body", "row", "cell", "caption"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "data-table",
				slot: "root",
				states: ["loading"],
			},
		},
		table: {
			name: "table",
			element: "table",
			aria: {
				role: "grid",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-rowcount", valueType: "aria-rowcount" },
					{ attr: "aria-colcount", valueType: "aria-colcount" },
				],
			},
			data: {
				kind: "data-table",
				slot: "table",
				states: [],
			},
		},
		header: {
			name: "header",
			element: "thead",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "data-table",
				slot: "header",
				states: [],
			},
		},
		body: {
			name: "body",
			element: "tbody",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "data-table",
				slot: "body",
				states: [],
			},
		},
		row: {
			name: "row",
			element: "tr",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-selected", valueType: "aria-selected" },
					{ attr: "aria-rowindex", valueType: "aria-rowindex" },
				],
			},
			data: {
				kind: "data-table",
				slot: "row",
				states: ["selected", "hover"],
			},
		},
		cell: {
			name: "cell",
			element: "td",
			aria: {
				required: [],
				optional: [{ attr: "aria-colindex", valueType: "aria-colindex" }],
			},
			data: {
				kind: "data-table",
				slot: "cell",
				states: [],
			},
		},
		caption: {
			name: "caption",
			element: "caption",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "data-table",
				slot: "caption",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby", "content"],
		defaultSlot: "caption",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["selected", "hover", "loading"],
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "data-table",
} as const satisfies ComponentContract;
