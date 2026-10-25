/**
 * @file Spinner Component Contract
 * @kind spinner
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Spinner uses role="status" with aria-label="Loading" default.
 * aria-hidden="true" when not active.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "spinner",
	description:
		"Animated loading spinner with role='status'. Provides aria-label='Loading' by default. Becomes aria-hidden when not active.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "status",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-hidden", valueType: "aria-hidden" },
				],
			},
			data: {
				kind: "spinner",
				slot: "root",
				states: ["active", "inactive"],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: ["active", "inactive"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "spinner",
} as const satisfies ComponentContract;
