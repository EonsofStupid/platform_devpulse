/**
 * @file primitives/form/contract.ts
 * @kind form
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Form PrimitiveContract — native <form> element.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { FormSlot, FormState } from "./types.js";

export const contract = {
	kind: "form",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "form",
			children: "snippet",
			aria: {
				role: "form",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-describedby"],
			},
		},
	},

	states: {
		shared: ["disabled"],
		specific: ["pending"],
	},

	slotStates: { root: ["pending", "disabled"] },
	slotActions: { root: ["submit", "reset"] },

	aria: {
		role: "form",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby"],
	},

	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"form", FormSlot, FormState>;
