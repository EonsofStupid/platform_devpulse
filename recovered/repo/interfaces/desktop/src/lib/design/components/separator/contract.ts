/**
 * @file Separator Component Contract
 * @kind separator
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * <hr> element with role="separator" and aria-orientation.
 * Decorative mode: role="none" + aria-hidden="true".
 *
 * Reference: W3C WAI-ARIA separator role
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Separator component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Semantic separator using <hr> with orientation support.
 */
export const contract = {
	kind: "separator",
	description:
		"Semantic separator element using <hr>. Uses role='separator' with aria-orientation for content separation. Supports decorative mode with role='none' and aria-hidden='true'. Canonical separator primitive.",

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
				kind: "separator",
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

	primitiveKind: "separator",
} as const satisfies ComponentContract;
