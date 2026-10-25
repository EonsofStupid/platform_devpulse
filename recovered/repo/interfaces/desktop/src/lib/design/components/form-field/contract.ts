/**
 * @file Form Field Component Contract
 * @kind form-field
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: WAI-ARIA labelling and description patterns.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * FormField component contract — compile-time enforced.
 */
export const contract = {
	kind: "form-field",
	description:
		"Compound form field wrapper providing label, control, description, and error slots with automatic aria-describedby, aria-invalid, and aria-required linking.",

	slots: {
		required: ["root", "control"],
		optional: ["label", "description", "error"],
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
				kind: "form-field",
				slot: "root",
				states: ["invalid", "required", "disabled"],
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
				kind: "form-field",
				slot: "label",
				states: ["required", "disabled"],
			},
		},
		control: {
			name: "control",
			element: "div",
			aria: {
				required: [],
				optional: [
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-invalid", valueType: "aria-invalid" },
					{ attr: "aria-required", valueType: "aria-required" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
				],
			},
			data: {
				kind: "form-field",
				slot: "control",
				states: ["invalid", "required", "disabled"],
			},
		},
		description: {
			name: "description",
			element: "p",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "form-field",
				slot: "description",
				states: [],
			},
		},
		error: {
			name: "error",
			element: "p",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "form-field",
				slot: "error",
				states: ["invalid"],
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
		all: ["invalid", "valid", "required", "disabled"],
		ariaMapping: {
			invalid: "aria-invalid",
			required: "aria-required",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "form-field",
} as const satisfies ComponentContract;
