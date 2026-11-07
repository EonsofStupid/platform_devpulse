/**
 * @file Skeleton Component Contract
 * @kind skeleton
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Skeleton uses role="status" with aria-busy="true" when loading.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "skeleton",
	description:
		"Animated loading placeholder with role='status' and aria-busy. Provides visual feedback while content loads. Variants: text, circular, rectangular.",

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
					{ attr: "aria-busy", valueType: "aria-busy" },
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "skeleton",
				slot: "root",
				states: ["loading", "loaded"],
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
		all: ["loading", "loaded"],
		ariaMapping: {
			loading: "aria-busy",
		},
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "skeleton",
} as const satisfies ComponentContract;
