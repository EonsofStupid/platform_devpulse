/**
 * @file Center Component Contract
 * @kind center
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Center is a centering container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "center",
	description:
		"Centering container using flexbox. Centers children both horizontally and vertically. Supports inline variant.",

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
				kind: "center",
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

	primitiveKind: "center",
} as const satisfies ComponentContract;
