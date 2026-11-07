/**
 * @file Kbd Component Contract
 * @kind kbd
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Kbd uses semantic <kbd> HTML — no ARIA needed.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "kbd",
	description:
		"Keyboard shortcut indicator using semantic <kbd> HTML. Displays keyboard keys with keycap styling. No ARIA needed.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "kbd",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "kbd",
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

	primitiveKind: "kbd",
} as const satisfies ComponentContract;
