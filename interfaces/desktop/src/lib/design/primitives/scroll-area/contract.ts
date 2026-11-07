/**
 * @file primitives/scroll-area/contract.ts
 * @kind scroll-area
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * ScrollArea PrimitiveContract — custom scrollbar container with viewport.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ScrollAreaSlot, ScrollAreaState } from "./types.js";

export const contract = {
	kind: "scroll-area",
	ariaStateProvider: "coldlight",

	slots: { required: ["root", "viewport", "scrollbar", "thumb"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		viewport: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		scrollbar: {
			element: "div",
			children: "snippet",
			aria: {
				role: "scrollbar",
				required: ["aria-controls", "aria-orientation"],
				optional: ["aria-valuemin", "aria-valuemax", "aria-valuenow"],
			},
		},
		thumb: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
	},

	states: { shared: ["hover", "active"], specific: [] },

	slotStates: {
		root: [],
		viewport: [],
		scrollbar: ["hover", "active"],
		thumb: ["hover", "active"],
	},

	slotActions: {
		root: [],
		viewport: [],
		scrollbar: [],
		thumb: [],
	},

	aria: { role: "none", requiredAttrs: [], optionalAttrs: [] },
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"scroll-area", ScrollAreaSlot, ScrollAreaState>;
