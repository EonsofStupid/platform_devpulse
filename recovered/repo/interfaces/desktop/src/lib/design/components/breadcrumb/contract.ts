/**
 * @file Breadcrumb Component Contract
 * @kind breadcrumb
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Breadcrumb Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "breadcrumb",
	description:
		"Breadcrumb navigation showing the current page location in a hierarchy. Uses nav + ol with aria-current=page on the last item.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/",

	slots: {
		required: ["root"],
		optional: ["item", "separator", "link"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "nav",
			aria: {
				role: "navigation",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "breadcrumb",
				slot: "root",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "li",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "breadcrumb",
				slot: "item",
				states: [],
			},
		},
		separator: {
			name: "separator",
			element: "span",
			aria: {
				role: "presentation",
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "breadcrumb",
				slot: "separator",
				states: [],
			},
		},
		link: {
			name: "link",
			element: "a",
			aria: {
				role: "link",
				required: [],
				optional: [{ attr: "aria-current", valueType: "aria-current" }],
			},
			data: {
				kind: "breadcrumb",
				slot: "link",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
		defaultSlot: "root",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "breadcrumb",
} as const satisfies ComponentContract;
