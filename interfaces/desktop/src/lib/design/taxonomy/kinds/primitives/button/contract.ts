/**
 * @file Button Taxonomy Contract
 * @description ColdLight SSOT contract for the button primitive.
 *
 * ariaStateProvider: "coldlight" — Native <button> handles ARIA.
 * No dsAdapter factory required. 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { buttonSlotStates, type ButtonSlot, type ButtonState } from "./types.js";

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
			aria: { role: "button", required: [], optional: ["aria-pressed", "aria-disabled", "aria-busy", "aria-expanded", "aria-haspopup", "aria-controls", "aria-label", "aria-labelledby", "aria-describedby"] },
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
