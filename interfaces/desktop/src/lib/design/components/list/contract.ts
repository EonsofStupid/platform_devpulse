/**
 * @file List Component Contract
 * @kind list
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Semantic list: role="list" on root, native <li> items.
 *
 * Reference: W3C WAI-ARIA APG
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * List component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Semantic HTML list with role="list" for ARIA identification.
 */
export const contract = {
	kind: "list",
	description:
		"Semantic HTML list for ordered or unordered items. Uses role='list' on root and native <li> items. Supports aria-label for accessible identification.",

	slots: {
		required: ["root"],
		optional: ["item"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "ul",
			aria: {
				role: "list",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "list",
				slot: "root",
				states: [],
			},
		},
		item: {
			name: "item",
			element: "li",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "list",
				slot: "item",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "content"],
		defaultSlot: "root",
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

	primitiveKind: "list",
} as const satisfies ComponentContract;
