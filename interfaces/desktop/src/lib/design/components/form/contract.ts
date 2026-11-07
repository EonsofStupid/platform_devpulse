/**
 * @file Form Component Contract
 * @kind form
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: Native <form> element with implicit form role.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Form component contract — compile-time enforced.
 */
export const contract = {
	kind: "form",
	description:
		"Native form container with submit/reset handling, pending state tracking, and disabled propagation. Implicit form role via <form> element.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "form",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-busy", valueType: "aria-busy" },
				],
			},
			data: {
				kind: "form",
				slot: "root",
				states: ["pending", "disabled"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["pending", "disabled"],
		ariaMapping: {
			pending: "aria-busy",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "form",
} as const satisfies ComponentContract;
