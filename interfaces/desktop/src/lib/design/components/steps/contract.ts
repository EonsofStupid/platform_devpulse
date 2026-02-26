/**
 * @file Steps Component Contract
 * @kind steps
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Steps progression pattern with aria-current="step" on active step.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Steps component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 */
export const contract = {
	kind: "steps",
	description:
		"Step progression indicator for multi-step workflows. Tracks active step with aria-current, supports linear and non-linear navigation.",

	slots: {
		required: ["root"],
		optional: ["step"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "nav",
			aria: {
				role: "navigation",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "steps",
				slot: "root",
				states: ["disabled"],
			},
		},
		step: {
			name: "step",
			element: "div",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-current", valueType: "aria-current" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "steps",
				slot: "step",
				states: ["active", "disabled"],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["active", "disabled"],
		ariaMapping: {
			active: "aria-current",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "steps",
} as const satisfies ComponentContract;
