/**
 * @file Card Component Contract
 * @kind card
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Semantic grouping container with header, body, and footer sections.
 * Uses role="group" with aria-labelledby for card title association.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "card",
	description:
		"Semantic content container with header, body, and footer sections. Uses role=group with aria-labelledby for accessible card title association.",

	slots: {
		required: ["root"],
		optional: ["header", "content", "footer"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "card",
				slot: "root",
				states: [],
			},
		},
		header: {
			name: "header",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
			data: {
				kind: "card",
				slot: "header",
				states: [],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
			data: {
				kind: "card",
				slot: "content",
				states: [],
			},
		},
		footer: {
			name: "footer",
			element: "div",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
			data: {
				kind: "card",
				slot: "footer",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
		defaultSlot: "header",
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

	primitiveKind: "card",
} as const satisfies ComponentContract;
