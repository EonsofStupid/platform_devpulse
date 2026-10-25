/**
 * @file Button Taxonomy Contract
 * @description ColdLight SSOT contract for the button primitive.
 *
 * ariaStateProvider: "coldlight" — native HTML button, 2-folder parity.
 * ColdLight owns all ARIA. No behavior adapter needed.
 *
 * BUILD-TIME validated via `satisfies PrimitiveContract`.
 * Scanner calls Zod .parse() separately for deep validation.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { PrimitiveContract } from "../types.js";
import { buttonSlotStates } from "./types.js";
import type { ButtonSlot, ButtonState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Button primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"button", ButtonSlot, ButtonState> = {
	kind: "button",
	ariaStateProvider: "coldlight",

	slots: {
		required: ["root"],
		optional: ["icon", "label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: [
					"aria-pressed",
					"aria-disabled",
					"aria-busy",
					"aria-expanded",
					"aria-haspopup",
					"aria-controls",
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
				],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: ["aria-hidden"] },
		},
		label: {
			element: "span",
			children: "snippet",
			aria: { required: [], optional: [] },
		},
	},

	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed", "loading", "busy"],
	},

	slotStates: buttonSlotStates,

	slotActions: {
		root: ["submit", "reset", "toggle"],
		icon: [],
		label: [],
	},

	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-pressed",
			"aria-disabled",
			"aria-busy",
			"aria-expanded",
			"aria-haspopup",
			"aria-controls",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
		],
	},

	keyboard: ["Enter", "Space"],

	focusStrategy: "none",
	compound: false,
};
