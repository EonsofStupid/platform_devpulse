/**
 * @file Prose Component Contract
 * @kind prose
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Prose is a rich text content container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "prose",
	description:
		"Rich text content container with typographic styling. Markdown-friendly. Applies prose utilities for consistent text rendering.",

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
				kind: "prose",
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

	primitiveKind: "prose",
} as const satisfies ComponentContract;
