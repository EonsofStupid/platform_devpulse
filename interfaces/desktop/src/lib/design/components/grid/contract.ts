/**
 * @file Grid Component Contract
 * @kind grid
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Grid is a CSS Grid layout container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "grid",
	description:
		"CSS Grid layout container. Provides columns, gap, rows via recipe. No ARIA semantics — purely structural.",

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
				kind: "grid",
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

	primitiveKind: "grid",
} as const satisfies ComponentContract;
