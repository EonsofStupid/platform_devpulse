/**
 * @file DescriptionList Component Contract
 * @kind description-list
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Semantic <dl> structure with <dt>/<dd> pairs.
 * Native HTML elements provide implicit term/definition semantics.
 *
 * Reference: W3C WAI-ARIA APG
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * DescriptionList component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Semantic <dl> with <dt>/<dd> pairs for term-detail associations.
 */
export const contract = {
	kind: "description-list",
	description:
		"Semantic description list for term-detail pairs using <dl>, <dt>, and <dd> elements. Supports aria-label for accessible identification. Native HTML provides implicit semantics.",

	slots: {
		required: ["root"],
		optional: ["term", "detail"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "dl",
			aria: {
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "description-list",
				slot: "root",
				states: [],
			},
		},
		term: {
			name: "term",
			element: "dt",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "description-list",
				slot: "term",
				states: [],
			},
		},
		detail: {
			name: "detail",
			element: "dd",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "description-list",
				slot: "detail",
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

	primitiveKind: "description-list",
} as const satisfies ComponentContract;
