/**
 * @file Spacer Component Contract
 * @kind spacer
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Spacer is a presentational flex spacer — aria-hidden="true".
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "spacer",
	description:
		"Presentational flex spacer element. Purely decorative — aria-hidden='true'. No children. Grows to fill available space by default.",

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
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "spacer",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: [],
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

	primitiveKind: "spacer",
} as const satisfies ComponentContract;
