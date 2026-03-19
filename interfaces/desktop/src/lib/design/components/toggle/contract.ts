/**
 * @file Toggle Component Contract
 * @kind toggle
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 * Cross-references the toggle PrimitiveContract for slot derivation.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern (Toggle)
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Toggle component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * MeltUI transport provides aria-pressed via createToggleTransport.
 */
export const contract = {
	kind: "toggle",
	description:
		"A two-state toggle button. Uses role='button' with aria-pressed for binary on/off state.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",

	slots: {
		required: ["trigger"],
		optional: [],
	},

	slotContracts: {
		trigger: {
			name: "trigger",
			element: "button",
			aria: {
				role: "button",
				required: [{ attr: "aria-pressed", valueType: "aria-pressed" }],
				optional: [
					{ attr: "aria-disabled", valueType: "aria-disabled" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "toggle",
				slot: "trigger",
				states: ["pressed", "focused", "focus-visible", "hover", "disabled"],
			},
			keyboard: [
				{ key: "Enter", action: "toggle", description: "Toggle pressed state" },
				{ key: "Space", action: "toggle", description: "Toggle pressed state" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["content", "aria-label", "aria-labelledby"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "toggle", description: "Toggle pressed state" },
			{ key: "Space", action: "toggle", description: "Toggle pressed state" },
		],
	},

	states: {
		all: ["pressed", "focused", "focus-visible", "hover", "disabled"],
		ariaMapping: {
			pressed: "aria-pressed",
			disabled: "aria-disabled",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "toggle",
} as const satisfies ComponentContract;
