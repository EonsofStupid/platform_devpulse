/**
 * @file Box Component Contract
 * @kind box
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Box is a generic layout container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "box",
	description:
		"Generic layout container. Provides padding and border-radius via recipe. No ARIA semantics — purely structural.",

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
				kind: "box",
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

	primitiveKind: "box",
} as const satisfies ComponentContract;
