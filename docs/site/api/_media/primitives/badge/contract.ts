/**
 * @file primitives/badge/contract.ts
 * @kind badge
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Badge PrimitiveContract — status/label indicator.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { BadgeSlot, BadgeState } from "./types.js";

export const contract = {
	kind: "badge",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-label"],
			},
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [] },
	slotActions: { root: [] },

	aria: { role: "status", requiredAttrs: [], optionalAttrs: ["aria-label"] },
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"badge", BadgeSlot, BadgeState>;
