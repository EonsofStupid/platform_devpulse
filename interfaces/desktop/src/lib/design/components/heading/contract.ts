/**
 * @file Heading Component Contract
 * @kind heading
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Heading renders h1-h6 with role="heading" and aria-level.
 *
 * Reference: W3C WAI-ARIA heading role
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "heading",
	description:
		"Semantic heading component (h1-h6). Builder sets role='heading' and aria-level. Visual size decoupled from semantic level.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "h2",
			aria: {
				role: "heading",
				required: [
					{ attr: "aria-level", valueType: "aria-level" },
				],
				optional: [],
			},
			data: {
				kind: "heading",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
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

	primitiveKind: "heading",
} as const satisfies ComponentContract;
