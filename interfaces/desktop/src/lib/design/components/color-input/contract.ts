/**
 * @file Color Input Component Contract
 * @kind color-input
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: Native <input type="color"> semantics.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * ColorInput component contract — compile-time enforced.
 */
export const contract = {
	kind: "color-input",
	description:
		"Color picker input with swatch preview and optional label. Uses native <input type='color'> for color selection.",

	slots: {
		required: ["root", "input"],
		optional: ["swatch", "label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [{ attr: "aria-labelledby", valueType: "aria-labelledby" }],
			},
			data: {
				kind: "color-input",
				slot: "root",
				states: ["disabled", "invalid"],
			},
		},
		swatch: {
			name: "swatch",
			element: "div",
			aria: {
				role: "presentation",
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "color-input",
				slot: "swatch",
				states: [],
			},
		},
		input: {
			name: "input",
			element: "input",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-invalid", valueType: "aria-invalid" },
					{ attr: "aria-required", valueType: "aria-required" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "color-input",
				slot: "input",
				states: ["focused", "focus-visible", "disabled", "invalid"],
			},
		},
		label: {
			name: "label",
			element: "label",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "color-input",
				slot: "label",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["content", "aria-label", "aria-labelledby"],
		defaultSlot: "label",
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["focused", "focus-visible", "disabled", "invalid"],
		ariaMapping: {
			disabled: "aria-disabled",
			invalid: "aria-invalid",
		},
	},

	interactions: {
		modal: false,
		selectable: true,
		editable: false,
		expandable: false,
	},

	primitiveKind: "color-input",
} as const satisfies ComponentContract;
