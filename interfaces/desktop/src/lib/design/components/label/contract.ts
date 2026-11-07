/**
 * @file Label Component Contract
 * @kind label
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: Native <label> element — no ARIA role needed.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Label component contract — compile-time enforced.
 */
export const contract = {
	kind: "label",
	description:
		"Native label element with for= attribute for associating with form controls. Provides disabled state styling hook.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "label",
				slot: "root",
				states: ["disabled"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
		defaultSlot: "root",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["disabled"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "label",
} as const satisfies ComponentContract;
