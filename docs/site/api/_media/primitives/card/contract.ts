/**
 * @file primitives/card/contract.ts
 * @kind card
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Card PrimitiveContract — content container with header/body/footer sections.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CardSlot, CardState } from "./types.js";

export const contract = {
	kind: "card",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: ["header", "body", "footer"], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		header: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		body: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		footer: {
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
		header: [],
		body: [],
		footer: [],
	},

	slotActions: {
		root: [],
		header: [],
		body: [],
		footer: [],
	},

	aria: { role: "group", requiredAttrs: [], optionalAttrs: ["aria-label", "aria-labelledby"] },
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"card", CardSlot, CardState>;
