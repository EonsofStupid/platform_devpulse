/**
 * @file AspectRatio Component Contract
 * @kind aspect-ratio
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * AspectRatio is a fixed ratio container — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "aspect-ratio",
	description:
		"Fixed aspect ratio container for media and content. Supports named presets and numeric ratios. No ARIA semantics.",

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
				kind: "aspect-ratio",
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

	primitiveKind: "aspect-ratio",
} as const satisfies ComponentContract;
