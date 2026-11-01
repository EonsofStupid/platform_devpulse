/**
 * @file primitives/stack/contract.ts
 * @kind stack
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Stack PrimitiveContract — vertical flex shorthand.
 * Gap tokenized via SD5 space scale.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { StackSlot, StackState } from "./types.js";

export const contract = {
	kind: "stack",
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
} as const satisfies PrimitiveContract<"stack", StackSlot, StackState>;
