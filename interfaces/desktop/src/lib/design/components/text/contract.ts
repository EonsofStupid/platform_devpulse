/**
 * @file Text Component Contract
 * @kind text
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Text is a typography component — semantic HTML with no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "text",
	description:
		"Typography text component. Renders as <span>, <p>, or other inline/block elements. Provides size, weight, and color via recipe.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "text",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
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

	primitiveKind: "text",
} as const satisfies ComponentContract;
