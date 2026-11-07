/**
 * @file Flex Component Contract
 * @kind flex
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Flex is a flexbox layout container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "flex",
	description:
		"Flexbox layout container. Provides direction, wrap, gap, align, justify via recipe. No ARIA semantics — purely structural.",

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
				kind: "flex",
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

	primitiveKind: "flex",
} as const satisfies ComponentContract;
