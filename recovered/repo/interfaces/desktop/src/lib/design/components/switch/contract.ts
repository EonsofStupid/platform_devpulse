/**
 * @file Switch Component Contract
 * @kind switch
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the switch PrimitiveContract for slot derivation.
 *
 * Pattern: Zag-style anatomy definition + React Spectrum layered contracts.
 * The component contract declares what the styled component MUST render.
 * Build scripts validate via Zod. App code pays zero cost.
 *
 * Reference: W3C WAI-ARIA APG Switch Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Switch component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined (not derived at runtime) for full static analysis.
 */
export const contract = {
	kind: "switch",
	description: "On/off toggle switch. Uses role='switch' with aria-checked for binary state.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/switch/",

	slots: {
		required: ["root"],
		optional: ["thumb", "label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "button",
			aria: {
				role: "switch",
				required: [{ attr: "aria-checked", valueType: "aria-checked" }],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "switch",
				slot: "root",
				states: ["checked", "focused", "focus-visible", "hover", "disabled"],
			},
			keyboard: [
				{ key: "Space", action: "toggle", description: "Toggle switch state" },
				{ key: "Enter", action: "toggle", description: "Toggle switch state" },
			],
		},
		thumb: {
			name: "thumb",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "switch",
				slot: "thumb",
				states: ["checked"],
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
				kind: "switch",
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
		global: [
			{ key: "Space", action: "toggle", description: "Toggle switch state" },
			{ key: "Enter", action: "toggle", description: "Toggle switch state" },
		],
	},

	states: {
		all: ["checked", "focused", "focus-visible", "hover", "disabled"],
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

	primitiveKind: "switch",
} as const satisfies ComponentContract;
