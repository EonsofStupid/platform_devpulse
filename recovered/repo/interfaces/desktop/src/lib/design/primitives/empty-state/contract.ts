/**
 * @file primitives/empty-state/contract.ts
 * @kind empty-state
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * EmptyState PrimitiveContract — placeholder for empty content areas.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { EmptyStateSlot, EmptyStateState } from "./types.js";

export const contract = {
	kind: "empty-state",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: ["icon", "title", "description", "action"], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-label"],
			},
		},
		icon: {
			element: "div",
			children: "snippet",
			aria: {
				role: "presentation",
				required: [],
				optional: [],
			},
		},
		title: {
			element: "h3",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		description: {
			element: "p",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		action: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
	},

	states: { shared: [], specific: [] },

	slotStates: {
		root: [],
		icon: [],
		title: [],
		description: [],
		action: [],
	},

	slotActions: {
		root: [],
		icon: [],
		title: [],
		description: [],
		action: [],
	},

	aria: { role: "status", requiredAttrs: [], optionalAttrs: ["aria-label"] },
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"empty-state", EmptyStateSlot, EmptyStateState>;
