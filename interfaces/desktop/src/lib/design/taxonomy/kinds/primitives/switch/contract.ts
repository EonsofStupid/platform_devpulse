/**
 * @file Switch Taxonomy Contract
 * @description ColdLight SSOT contract for the switch primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> with role="switch" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="switch" is a type of checkbox that represents on/off.
 * aria-checked is required (true/false, never "mixed" unlike checkbox).
 * Accessible name required via aria-label or aria-labelledby.
 * Toggle on Space (native button behavior).
 */

import type { PrimitiveContract } from "../../../types.js";
import { switchSlotStates, type SwitchSlot, type SwitchState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Switch primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"switch", SwitchSlot, SwitchState> = {
	kind: "switch",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "thumb"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "switch",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
			},
		},
		thumb: {
			element: "span",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked"],
	},
	slotStates: switchSlotStates,
	slotActions: { root: ["check", "uncheck", "toggle"], thumb: [] },
	aria: {
		role: "switch",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},
	keyboard: ["Space"],
	focusStrategy: "none",
	compound: true,
};
