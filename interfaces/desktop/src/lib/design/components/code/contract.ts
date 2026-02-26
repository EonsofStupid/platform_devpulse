/**
 * @file Code Component Contract
 * @kind code
 * @layer components
 *
 * BUILD-TIME validated via `satisfies ComponentContract`.
 * Code is a semantic code display element — no ARIA complexity.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "code",
	description:
		"Code display component. Renders as inline <code> or block <pre><code>. Provides syntax styling via recipe. Supports language hint via data attribute.",

	slots: {
		required: ["root"],
		optional: [],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "code",
			aria: {
				required: [],
				optional: [],
			},
			data: {
				kind: "code",
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

	primitiveKind: "code",
} as const satisfies ComponentContract;
