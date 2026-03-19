/**
 * @file VisuallyHidden Component Contract
 * @kind visually-hidden
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape — zero runtime overhead.
 *
 * Pure utility: no ARIA requirements. Content is hidden visually but exposed
 * to assistive technologies via CSS (sr-only pattern).
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

/**
 * VisuallyHidden component contract — compile-time enforced.
 *
 * `satisfies ComponentContract` validates shape at compile time.
 * No builder, no transport — pure CSS sr-only utility.
 */
export const contract = {
	kind: "visually-hidden",
	description:
		"Utility component that visually hides content while keeping it accessible to screen readers. Uses the sr-only CSS pattern.",

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
				optional: [],
			},
			data: {
				kind: "visually-hidden",
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

	primitiveKind: "visually-hidden",
} as const satisfies ComponentContract;
