/**
 * @file Callout Component Contract
 * @kind callout
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Callout uses role="note" — informational supplementary content.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "callout",
	description:
		"Informational callout box with role='note'. Highlights supplementary content with semantic variants: info, success, warning, error, tip.",

	slots: {
		required: ["root"],
		optional: ["icon", "content"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: {
				role: "note",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "callout",
				slot: "root",
				states: [],
			},
		},
		icon: {
			name: "icon",
			element: "span",
			aria: {
				required: [],
				optional: [{ attr: "aria-hidden", valueType: "aria-hidden" }],
			},
			data: {
				kind: "callout",
				slot: "icon",
				states: [],
			},
		},
		content: {
			name: "content",
			element: "div",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "callout",
				slot: "content",
				states: [],
			},
		},
	},

	accessibleName: {
		required: false,
		sources: ["content", "aria-label"],
		defaultSlot: "content",
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

	primitiveKind: "callout",
} as const satisfies ComponentContract;
