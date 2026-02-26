/**
 * @file Container Component Contract
 * @kind container
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Container is a max-width wrapper — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "container",
	description:
		"Max-width responsive container. Centers content horizontally with responsive max-width breakpoints. No ARIA semantics.",

	slots: {
		required: ["root"],
		optional: [],
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
				kind: "container",
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

	primitiveKind: "container",
} as const satisfies ComponentContract;
