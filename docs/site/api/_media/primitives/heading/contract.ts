/**
 * @file primitives/heading/contract.ts
 * @kind heading
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Heading PrimitiveContract — semantic heading with level decoupled from visual scale.
 *
 * WAI-ARIA: Native heading elements (h1-h6) provide implicit heading role.
 * aria-level is set via the HTML tag itself.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { HeadingSlot, HeadingState } from "./types.js";

export const contract = {
	kind: "heading",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "h2",
			children: "snippet",
			aria: {
				role: "heading",
				required: [],
				optional: ["aria-level"],
			},
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [] },
	slotActions: { root: [] },

	aria: {
		role: "heading",
		requiredAttrs: [],
		optionalAttrs: ["aria-level"],
	},

	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"heading", HeadingSlot, HeadingState>;
