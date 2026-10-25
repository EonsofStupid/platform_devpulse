/**
 * @file Table Component Contract
 * @kind table
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Semantic HTML table — native <table> elements provide implicit ARIA roles.
 * aria-label on root for accessible name.
 *
 * Reference: W3C WAI-ARIA APG Table Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/table/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Table component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Semantic HTML table with optional aria-label for identification.
 */
export const contract = {
	kind: "table",
	description:
		"Semantic HTML table for tabular data display. Supports aria-label for accessible identification, aria-describedby for additional context, and aria-sort on head cells for sortable columns.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/table/",

	slots: {
		required: ["root"],
		optional: ["header", "body", "row", "cell", "caption"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "table",
			aria: {
				role: "table",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "table",
				slot: "root",
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
				kind: "table",
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
				kind: "table",
				slot: "body",
				states: [],
			},
		},
		row: {
			name: "row",
			element: "tr",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "table",
				slot: "row",
				states: ["selected", "hover"],
			},
		},
		cell: {
			name: "cell",
			element: "td",
			aria: {
				required: [],
				optional: [{ attr: "aria-sort", valueType: "aria-sort" }],
			},
			data: {
				kind: "table",
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
				kind: "table",
				slot: "caption",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
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
		all: ["selected", "hover"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "table",
} as const satisfies ComponentContract;
