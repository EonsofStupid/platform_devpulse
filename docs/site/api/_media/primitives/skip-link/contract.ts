/**
 * @file primitives/skip-link/contract.ts
 * @kind skip-link
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * SkipLink PrimitiveContract — skip-to-content accessibility link.
 * Native <a> provides implicit link role. No extra ARIA needed.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SkipLinkSlot, SkipLinkState } from "./types.js";

export const contract = {
	kind: "skip-link",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: [], forbidden: [] },

	slotSpec: {
		root: {
			element: "a",
			children: "snippet",
			aria: { role: "link", required: [], optional: [] },
		},
	},

	states: {
		shared: ["focused", "focus-visible"],
		specific: [],
	},

	slotStates: { root: ["focused", "focus-visible"] },
	slotActions: { root: [] },

	aria: { role: "link", requiredAttrs: [], optionalAttrs: [] },
	keyboard: ["Enter"],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"skip-link", SkipLinkSlot, SkipLinkState>;
