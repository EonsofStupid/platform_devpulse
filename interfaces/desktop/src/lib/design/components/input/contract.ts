/**
 * @file Input Component Contract
 * @kind input
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the input PrimitiveContract for slot derivation.
 *
 * Pattern: Zag-style anatomy definition + React Spectrum layered contracts.
 * The component contract declares what the styled component MUST render.
 * Build scripts validate via Zod. App code pays zero cost.
 *
 * Note: Input uses implicit textbox role from native <input> element.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Input component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined (not derived at runtime) for full static analysis.
 */
export const contract = {
	kind: "input",
	description:
		"Text input field with validation states. Uses native <input> with implicit textbox role. Supports invalid, required, readonly, and disabled states via ARIA.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "input",
			aria: {
				role: "textbox",
				required: [],
				optional: [
					{ attr: "aria-invalid", valueType: "aria-invalid" },
					{ attr: "aria-required", valueType: "aria-required" },
					{ attr: "aria-readonly", valueType: "aria-readonly" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
					{ attr: "aria-errormessage", valueType: "aria-errormessage" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-placeholder", valueType: "aria-placeholder" },
				],
			},
			data: {
				kind: "input",
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
			keyboard: [{ key: "Enter", action: "submit", description: "Submit form (in form context)" }],
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
		global: [{ key: "Enter", action: "submit", description: "Submit form (in form context)" }],
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
			disabled: "aria-disabled",
			readonly: "aria-readonly",
			required: "aria-required",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: true,
		expandable: false,
	},

	primitiveKind: "input",
} as const satisfies ComponentContract;
