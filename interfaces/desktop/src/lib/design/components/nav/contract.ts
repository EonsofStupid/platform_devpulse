/**
 * @file Nav Component Contract
 * @kind nav
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Reference: W3C WAI-ARIA APG Landmarks
 * https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "nav",
	description:
		"Navigation landmark element for grouping navigation links. Provides aria-label for multiple nav landmarks.",
	apgPattern: "https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "nav",
			aria: {
				role: "navigation",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "nav",
				slot: "root",
				states: [],
			},
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

	primitiveKind: "nav",
} as const satisfies ComponentContract;
