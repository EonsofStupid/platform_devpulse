/**
 * @file Checkbox Component Contract
 * @kind checkbox
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the checkbox PrimitiveContract for slot derivation.
 *
 * Pattern: Zag-style anatomy definition + React Spectrum layered contracts.
 * The component contract declares what the styled component MUST render.
 * Build scripts validate via Zod. App code pays zero cost.
 *
 * Reference: W3C WAI-ARIA APG Checkbox Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Checkbox component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined (not derived at runtime) for full static analysis.
 */
export const contract = {
	kind: "checkbox",
	description:
		"Toggle control with tri-state support (checked, unchecked, indeterminate). Uses role='checkbox' with aria-checked for state.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/",

	slots: {
		required: ["root"],
		optional: ["indicator", "label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "button",
			aria: {
				role: "checkbox",
				required: [{ attr: "aria-checked", valueType: "aria-checked" }],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "checkbox",
				slot: "root",
				states: ["checked", "indeterminate", "focused", "focus-visible", "hover", "disabled"],
			},
			keyboard: [{ key: "Space", action: "toggle", description: "Toggle checked state" }],
		},
		indicator: {
			name: "indicator",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "checkbox",
				slot: "indicator",
				states: ["checked", "indeterminate"],
			},
		},
		label: {
			name: "label",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "checkbox",
				slot: "label",
				states: ["disabled"],
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
		global: [{ key: "Space", action: "toggle", description: "Toggle checked state" }],
	},

	states: {
		all: ["checked", "indeterminate", "focused", "focus-visible", "hover", "disabled"],
		ariaMapping: {
			checked: "aria-checked",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "checkbox",
} as const satisfies ComponentContract;
