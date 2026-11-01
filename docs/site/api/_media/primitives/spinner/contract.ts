/**
 * @file primitives/spinner/contract.ts
 * @kind spinner
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Spinner PrimitiveContract — loading spinner.
 * role="status" with aria-label="Loading" for screen readers.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SpinnerSlot, SpinnerState } from "./types.js";

export const contract = {
	kind: "spinner",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "self-closing",
			aria: {
				role: "status",
				required: ["aria-label"],
				optional: ["aria-busy"],
			},
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [] },
	slotActions: { root: [] },

	aria: { role: "status", requiredAttrs: ["aria-label"], optionalAttrs: ["aria-busy"] },
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"spinner", SpinnerSlot, SpinnerState>;
