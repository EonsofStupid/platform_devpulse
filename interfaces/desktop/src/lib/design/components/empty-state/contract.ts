/**
 * @file EmptyState Component Contract
 * @kind empty-state
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * EmptyState uses role="status" — polite live region for empty content areas.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "empty-state",
	description:
		"Empty content placeholder with role='status'. Displays icon, title, description, and action CTA when content areas have no data.",

	slots: {
		required: ["root"],
		optional: ["icon", "title", "description", "action"],
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
				],
			},
			data: {
				kind: "empty-state",
				slot: "root",
				states: [],
			},
		},
		icon: {
			name: "icon",
			element: "div",
			aria: {
				role: "presentation",
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "empty-state",
				slot: "icon",
				states: [],
			},
		},
		title: {
			name: "title",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "empty-state",
				slot: "title",
				states: [],
			},
		},
		description: {
			name: "description",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "empty-state",
				slot: "description",
				states: [],
			},
		},
		action: {
			name: "action",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "empty-state",
				slot: "action",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
		defaultSlot: "title",
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

	primitiveKind: "empty-state",
} as const satisfies ComponentContract;
