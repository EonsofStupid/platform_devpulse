/**
 * @file Stack Component Contract
 * @kind stack
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Stack is a vertical flex layout shorthand — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "stack",
	description:
		"Vertical flex layout shorthand. Provides gap and alignment via recipe. No ARIA semantics — purely structural.",

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
				kind: "stack",
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

	primitiveKind: "stack",
} as const satisfies ComponentContract;
