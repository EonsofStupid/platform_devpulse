/**
 * @file primitives/alert/contract.ts
 * @kind alert
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Alert PrimitiveContract — static alert banner.
 * role="alert" provides implicit aria-live="assertive".
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { AlertSlot, AlertState } from "./types.js";

export const contract = {
	kind: "alert",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: ["icon", "title", "description", "action"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alert",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-live"],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		title: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		description: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
		action: {
			element: "div",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	states: { shared: [], specific: [] },
	slotStates: { root: [], icon: [], title: [], description: [], action: [] },
	slotActions: { root: ["dismiss"], icon: [], title: [], description: [], action: [] },

	aria: {
		role: "alert",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-live"],
	},

	keyboard: [],
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"alert", AlertSlot, AlertState>;
