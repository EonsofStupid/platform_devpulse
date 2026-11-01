/**
 * @file primitives/container/contract.ts
 * @kind container
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Container PrimitiveContract — max-width wrapper.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ContainerSlot, ContainerState } from "./types.js";

export const contract = {
	kind: "container",
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
} as const satisfies PrimitiveContract<"container", ContainerSlot, ContainerState>;
