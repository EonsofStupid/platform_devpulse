/**
 * @file Divider Component Contract
 * @kind divider
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Alias for separator. <hr> element.
 * role="separator" with aria-orientation, or role="none" when decorative.
 *
 * Reference: W3C WAI-ARIA separator role
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Divider component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Visual divider using <hr> with separator or none role.
 */
export const contract = {
	kind: "divider",
	description:
		"Visual divider element using <hr>. Uses role='separator' with aria-orientation for semantic dividers, or role='none' with aria-hidden for purely decorative dividers. Alias for separator with identical behavior.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "hr",
			aria: {
				role: "separator",
				required: [],
				optional: [
					{ attr: "aria-orientation", valueType: "aria-orientation" },
					{ attr: "aria-hidden", valueType: "aria-hidden" },
				],
			},
			data: {
				kind: "divider",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: [],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "divider",
} as const satisfies ComponentContract;
