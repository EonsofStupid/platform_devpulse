/**
 * @file Toggle Taxonomy Contract
 * @description ColdLight SSOT contract for the toggle primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> + aria-pressed at component layer.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { toggleSlotStates, type ToggleSlot, type ToggleState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Toggle primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"toggle", ToggleSlot, ToggleState> = {
	kind: "toggle",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: { role: "button", required: ["aria-pressed"], optional: ["aria-disabled", "aria-label", "aria-labelledby", "aria-describedby"] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed"],
	},
	slotStates: toggleSlotStates,
	slotActions: { root: ["toggle"] },
	aria: {
		role: "button",
		requiredAttrs: ["aria-pressed"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"],
	},
	keyboard: ["Enter", "Space"],
	focusStrategy: "none",
	compound: true,
};
