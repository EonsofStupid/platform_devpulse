/**
 * @file Badge Component Contract
 * @kind badge
 * @layer components
 *
 * Structural presentational label. role="status" or role="presentation" (decorative).
 * No complex ARIA, no keyboard, no focus management.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "badge",
	description:
		"Structural presentational label for status indicators, counts, and notifications. role='status' for live content, role='presentation' when decorative. Variant × fillStyle × size driven.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "span",
			aria: {
				required: [],
				optional: [
					{ attr: "role", valueType: "role" },
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-hidden", valueType: "aria-hidden" },
				],
			},
			data: { kind: "badge", slot: "root", states: [] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
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

	primitiveKind: "badge",
} as const satisfies ComponentContract;
