/**
 * @file Sticky Component Contract
 * @kind sticky
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Sticky is a position-sticky wrapper — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "sticky",
	description:
		"Position sticky wrapper for fixed-scroll elements. Provides top offset and z-index via recipe. No ARIA semantics.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "sticky",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
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

	primitiveKind: "sticky",
} as const satisfies ComponentContract;
