/**
 * @file Textarea Component Contract
 * @kind textarea
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG — no specific pattern (native textarea semantics)
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Textarea component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Native `<textarea>` provides implicit textbox role with aria-multiline.
 */
export const contract = {
	kind: "textarea",
	description:
		"Multi-line text input field. Supports validation (aria-invalid), required (aria-required), readonly (aria-readonly), and disabled states. Always aria-multiline=true.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "textarea",
			aria: {
				role: "textbox",
				required: [],
				optional: [
					{ attr: "aria-invalid", valueType: "aria-invalid" },
					{ attr: "aria-required", valueType: "aria-required" },
					{ attr: "aria-readonly", valueType: "aria-readonly" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-multiline", valueType: "aria-multiline" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-errormessage", valueType: "aria-errormessage" },
				],
			},
			data: {
				kind: "textarea",
				slot: "root",
				states: [
					"focused",
					"focus-visible",
					"hover",
					"disabled",
					"readonly",
					"required",
					"invalid",
					"valid",
				],
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
		all: [
			"focused",
			"focus-visible",
			"hover",
			"disabled",
			"readonly",
			"required",
			"invalid",
			"valid",
		],
		ariaMapping: {
			invalid: "aria-invalid",
			required: "aria-required",
			readonly: "aria-readonly",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "textarea",
} as const satisfies ComponentContract;
