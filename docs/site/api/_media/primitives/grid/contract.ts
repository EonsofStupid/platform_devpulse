/**
 * @file primitives/grid/contract.ts
 * @kind grid
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Grid PrimitiveContract — CSS Grid container.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { GridSlot, GridState } from "./types.js";

export const contract = {
	kind: "grid",
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
} as const satisfies PrimitiveContract<"grid", GridSlot, GridState>;
