/**
 * @file primitives/data-table/contract.ts
 * @kind data-table
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * DataTable PrimitiveContract — enhanced table with sorting, filtering, pagination (wraps tanstack-table).
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DataTableSlot, DataTableState } from "./types.js";

export const contract = {
	kind: "data-table",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root", "table", "header", "body", "row", "cell"],
		optional: ["toolbar", "footer", "head-cell", "caption", "pagination", "empty"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		table: {
			element: "table",
			children: "snippet",
			aria: {
				role: "grid",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-rowcount", "aria-colcount"],
			},
		},
		toolbar: {
			element: "div",
			children: "snippet",
			aria: {
				role: "toolbar",
				required: [],
				optional: ["aria-label"],
			},
		},
		header: {
			element: "thead",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		body: {
			element: "tbody",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		footer: {
			element: "tfoot",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		row: {
			element: "tr",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-selected", "aria-rowindex"],
			},
		},
		"head-cell": {
			element: "th",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-sort", "aria-colindex"],
			},
		},
		cell: {
			element: "td",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-colindex"],
			},
		},
		caption: {
			element: "figcaption",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		pagination: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label"],
			},
		},
		empty: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: [],
			},
		},
	},

	states: { shared: ["selected", "hover", "loading"], specific: [] },

	slotStates: {
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
	},

	slotActions: {
		root: [],
		table: [],
		toolbar: [],
		header: [],
		body: [],
		footer: [],
		row: ["select"],
		"head-cell": [],
		cell: [],
		caption: [],
		pagination: [],
		empty: [],
	},

	aria: {
		role: "grid",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-rowcount", "aria-colcount"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"data-table", DataTableSlot, DataTableState>;
