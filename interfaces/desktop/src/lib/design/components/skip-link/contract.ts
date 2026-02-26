/**
 * @file SkipLink Component Contract
 * @kind skip-link
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * TypeScript compiler enforces the shape -- zero runtime overhead.
 *
 * Skip-to-content accessibility link. Visually hidden until focused.
 * Manages focus to the target element on activation.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "skip-link",
	description:
		"Accessibility skip-to-content link. Visually hidden until focused. Moves focus to the target element on activation.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "a",
			aria: {
				role: "link",
				required: [],
				optional: [
					{ attr: "aria-label", valueType: "aria-label" },
				],
			},
			data: {
				kind: "skip-link",
				slot: "root",
				states: ["focused", "focus-visible"],
			},
			keyboard: [
				{ key: "Enter", action: "skip", description: "Skip to target content" },
			],
		},
	},

	accessibleName: {
		required: true,
		sources: ["content", "aria-label"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [
			{ key: "Enter", action: "skip", description: "Skip to target content" },
		],
	},

	states: {
		all: ["focused", "focus-visible"],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "skip-link",
} as const satisfies ComponentContract;
