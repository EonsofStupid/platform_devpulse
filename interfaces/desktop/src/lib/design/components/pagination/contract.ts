/**
 * @file Pagination Component Contract
 * @kind pagination
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the pagination PrimitiveContract for slot derivation.
 *
 * ColdLight-owned: no external builder. Simple page navigation.
 *
 * Reference: W3C WAI-ARIA APG
 * https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Pagination component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * ColdLight-owned — renders nav with page buttons, aria-current for active.
 */
export const contract = {
	kind: "pagination",
	description:
		"Page navigation component. Renders a nav landmark with page buttons, previous/next controls, and ellipsis indicators. Uses aria-current='page' for the active page.",

	slots: {
		required: ["root", "previous", "next", "page"],
		optional: ["ellipsis"],
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
				kind: "pagination",
				slot: "root",
				states: [],
			},
		},
		previous: {
			name: "previous",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "pagination",
				slot: "previous",
				states: ["focused", "focus-visible", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "previous-page", description: "Go to previous page" },
				{ key: "Space", action: "previous-page", description: "Go to previous page" },
			],
		},
		next: {
			name: "next",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "pagination",
				slot: "next",
				states: ["focused", "focus-visible", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "next-page", description: "Go to next page" },
				{ key: "Space", action: "next-page", description: "Go to next page" },
			],
		},
		page: {
			name: "page",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-current", valueType: "aria-current" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "pagination",
				slot: "page",
				states: ["selected", "focused", "focus-visible", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "select-page", description: "Go to this page" },
				{ key: "Space", action: "select-page", description: "Go to this page" },
			],
		},
		ellipsis: {
			name: "ellipsis",
			element: "span",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
			data: {
				kind: "pagination",
				slot: "ellipsis",
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
		strategy: "roving",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "select-page", description: "Activate focused page button" },
			{ key: "Space", action: "select-page", description: "Activate focused page button" },
		],
	},

	states: {
		all: ["focused", "focus-visible", "disabled", "selected"],
		ariaMapping: {
			selected: "aria-current",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "pagination",
} as const satisfies ComponentContract;
