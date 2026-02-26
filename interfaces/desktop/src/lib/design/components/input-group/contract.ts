/**
 * @file Input Group Component Contract
 * @kind input-group
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: WAI-ARIA role="group" for associated controls.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * InputGroup component contract — compile-time enforced.
 */
export const contract = {
	kind: "input-group",
	description:
		"Container grouping for an input element with optional prefix and suffix addons. Uses role='group' to associate addons with input.",

	slots: {
		required: ["root"],
		optional: ["prefix", "input", "suffix"],
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
				kind: "input-group",
				slot: "root",
				states: ["focused", "focus-visible", "disabled"],
			},
		},
		prefix: {
			name: "prefix",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "input-group",
				slot: "prefix",
				states: [],
			},
		},
		input: {
			name: "input",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "input-group",
				slot: "input",
				states: ["focused", "focus-visible", "disabled"],
			},
		},
		suffix: {
			name: "suffix",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "input-group",
				slot: "suffix",
				states: [],
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
		all: ["focused", "focus-visible", "disabled"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "input-group",
} as const satisfies ComponentContract;
