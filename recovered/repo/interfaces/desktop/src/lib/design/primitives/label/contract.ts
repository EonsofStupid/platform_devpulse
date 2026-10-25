/**
 * @file primitives/label/contract.ts
 * @kind label
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Label PrimitiveContract — native <label> element.
 * No ARIA role needed — native label provides implicit semantics.
 * Clicking label focuses associated control via `for` attribute.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { LabelSlot, LabelState } from "./types.js";

export const contract = {
	kind: "label",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "label",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	states: {
		shared: ["disabled"],
		specific: [],
	},

	slotStates: { root: ["disabled"] },
	slotActions: { root: [] },

	aria: { role: "none", requiredAttrs: [], optionalAttrs: [] },
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"label", LabelSlot, LabelState>;
