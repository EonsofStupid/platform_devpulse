/**
 * @file primitives/loading-overlay/contract.ts
 * @kind loading-overlay
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * LoadingOverlay PrimitiveContract — full-area loading indicator overlay.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { LoadingOverlaySlot, LoadingOverlayState } from "./types.js";

export const contract = {
	kind: "loading-overlay",
	ariaStateProvider: "coldlight",

	slots: { required: ["root"], optional: ["spinner", "label"], forbidden: [] },

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "status",
				required: ["aria-busy"],
				optional: ["aria-label"],
			},
		},
		spinner: {
			element: "div",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: ["aria-hidden"],
			},
		},
		label: {
			element: "span",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
	},

	states: { shared: ["loading"], specific: ["visible", "hidden"] },

	slotStates: {
		root: ["loading", "visible", "hidden"],
		spinner: [],
		label: [],
	},

	slotActions: {
		root: [],
		spinner: [],
		label: [],
	},

	aria: { role: "status", requiredAttrs: ["aria-busy"], optionalAttrs: ["aria-label"] },
	keyboard: [],
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"loading-overlay", LoadingOverlaySlot, LoadingOverlayState>;
