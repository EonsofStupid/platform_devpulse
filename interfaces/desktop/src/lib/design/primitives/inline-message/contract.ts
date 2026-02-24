/**
 * @file primitives/inline-message/contract.ts
 * @kind inline-message
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * InlineMessage PrimitiveContract — inline validation/help text.
 * role="status" with aria-live="polite" for non-intrusive updates.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { InlineMessageSlot, InlineMessageState } from "./types.js";

export const contract = {
	kind: "inline-message",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: ["icon"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-live"],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [], icon: [] },
	slotActions: { root: [], icon: [] },

	aria: { role: "status", requiredAttrs: [], optionalAttrs: ["aria-live"] },
	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"inline-message", InlineMessageSlot, InlineMessageState>;
