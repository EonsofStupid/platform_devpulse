/**
 * @file Stat Component Contract
 * @kind stat
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Stat uses role="group" with aria-label or aria-labelledby.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "stat",
	description:
		"Display statistic with role='group'. Contains label, value, and optional helptext slots. Grouped semantically via aria-label or aria-labelledby.",

	slots: {
		required: ["root"],
		optional: ["label", "value", "helptext"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "group",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
					{ attr: "aria-labelledby", valueType: "aria-labelledby" },
				],
			},
			data: {
				kind: "stat",
				slot: "root",
				states: [],
			},
		},
		label: {
			name: "label",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "stat",
				slot: "label",
				states: [],
			},
		},
		value: {
			name: "value",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "stat",
				slot: "value",
				states: [],
			},
		},
		helptext: {
			name: "helptext",
			element: "span",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "stat",
				slot: "helptext",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["aria-label", "aria-labelledby", "content"],
		defaultSlot: "label",
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

	primitiveKind: "stat",
} as const satisfies ComponentContract;
