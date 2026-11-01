/**
 * @file primitives/text/contract.ts
 * @kind text
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Text PrimitiveContract — base text rendering.
 * Polymorphic via `as` prop. Token-driven type scale.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TextSlot, TextState } from "./types.js";

export const contract = {
	kind: "text",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "span",
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
} as const satisfies PrimitiveContract<"text", TextSlot, TextState>;
