/**
 * @file primitives/hstack/contract.ts
 * @kind hstack
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * HStack PrimitiveContract — horizontal flex shorthand.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { HStackSlot, HStackState } from "./types.js";

export const contract = {
	kind: "hstack",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [] },
	slotActions: { root: [] },

	aria: { role: "none", requiredAttrs: [], optionalAttrs: [] },
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"hstack", HStackSlot, HStackState>;
