/**
 * @file Badge Component Contract
 * @kind badge
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Badge uses role="status" for live-region semantics.
 * Reference: W3C WAI-ARIA APG
 * https://www.w3.org/WAI/ARIA/apg/
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * Badge component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * Badge is a presentational status indicator with optional ARIA label.
 */
export const contract = {
	kind: "badge",
	description:
		"Status indicator badge for labels, counts, and notifications. Uses role='status' for live-region semantics. Supports intent-driven coloring.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "span",
			aria: {
				role: "status",
				required: [],
				optional: [{ attr: "aria-label", valueType: "aria-label" }],
			},
			data: {
				kind: "badge",
				slot: "root",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
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

	primitiveKind: "badge",
} as const satisfies ComponentContract;
