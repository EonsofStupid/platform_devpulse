/**
 * @file Avatar Component Contract
 * @kind avatar
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Avatar uses role="img" with aria-label for accessible name.
 * Reference: W3C WAI-ARIA APG
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Avatar component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Avatar is a compound-ish component: image + fallback, managed load state.
 */
export const contract = {
	kind: "avatar",
	description:
		"User avatar with image and fallback support. Uses role='img' with aria-label for accessible name. Manages image load/error state internally.",

	slots: {
		required: ["root"],
		optional: ["image", "fallback"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "span",
			aria: {
				role: "img",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "avatar",
				slot: "root",
				states: [],
			},
		},
		image: {
			name: "image",
			element: "img",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "avatar",
				slot: "image",
				states: ["loading"],
			},
		},
		fallback: {
			name: "fallback",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "avatar",
				slot: "fallback",
				states: [],
			},
		},
	},

	accessibleName: {
		required: true,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["loading", "pending"],
		ariaMapping: {},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "avatar",
} as const satisfies ComponentContract;
