/**
 * @file primitives/table/contract.ts
 * @kind table
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Table PrimitiveContract — semantic HTML table with proper structure.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TableSlot, TableState } from "./types.js";

export const contract = {
	kind: "table",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root", "header", "body", "row", "cell"],
		optional: ["footer", "head-cell", "caption"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "table",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
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
				optional: [],
			},
		},
		"head-cell": {
			element: "th",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-sort"],
			},
		},
		cell: {
			element: "td",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
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
	},

	states: { shared: ["selected", "hover"], specific: [] },

	slotStates: {
		root: [],
		header: [],
		body: [],
		footer: [],
		row: ["selected", "hover"],
		"head-cell": [],
		cell: [],
		caption: [],
	},

	slotActions: {
		root: [],
		header: [],
		body: [],
		footer: [],
		row: ["select"],
		"head-cell": [],
		cell: [],
		caption: [],
	},

	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-rowcount", "aria-colcount"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"table", TableSlot, TableState>;
