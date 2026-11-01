/**
 * @file primitives/flex/contract.ts
 * @kind flex
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Flex PrimitiveContract — flexbox container.
 * gap/align/justify driven by tokens.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { FlexSlot, FlexState } from "./types.js";

export const contract = {
	kind: "flex",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

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
} as const satisfies PrimitiveContract<"flex", FlexSlot, FlexState>;
