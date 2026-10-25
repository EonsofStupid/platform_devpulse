/**
 * @file Button Component Contract
 * @kind button
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the button PrimitiveContract for slot derivation.
 *
 * Pattern: Zag-style anatomy definition + React Spectrum layered contracts.
 * The component contract declares what the styled component MUST render.
 * Build scripts validate via Zod. App code pays zero cost.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Button component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Slot contracts are inlined (not derived at runtime) for full static analysis.
 */
export const contract = {
	kind: "button",
	description:
		"Interactive button element for triggering actions. Supports toggle (aria-pressed), loading (aria-busy), and disabled states.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",

	slots: {
		required: ["root"],
		optional: ["icon", "label"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "button",
			aria: {
				role: "button",
				required: [],
				optional: [
					{ attr: "aria-pressed", valueType: "aria-pressed" },
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-busy", valueType: "aria-busy" },
					{ attr: "aria-expanded", valueType: "aria-expanded" },
					{ attr: "aria-haspopup", valueType: "aria-haspopup" },
					{ attr: "aria-controls", valueType: "aria-controls" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
					{ attr: "aria-describedby", valueType: "aria-describedby" },
				],
			},
			data: {
				kind: "button",
				slot: "root",
				states: [
					"focused",
					"focus-visible",
					"hover",
					"active",
					"disabled",
					"pressed",
					"loading",
					"busy",
				],
			},
			keyboard: [
				{ key: "Enter", action: "activate", description: "Activate button" },
				{ key: "Space", action: "activate", description: "Activate button" },
			],
		},
		icon: {
			name: "icon",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "button",
				slot: "icon",
				states: [],
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
				kind: "button",
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
		global: [
			{ key: "Enter", action: "activate", description: "Activate button" },
			{ key: "Space", action: "activate", description: "Activate button" },
		],
	},

	states: {
		all: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
		ariaMapping: {
			pressed: "aria-pressed",
			disabled: "aria-disabled",
			loading: "aria-busy",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "button",
} as const satisfies ComponentContract;
