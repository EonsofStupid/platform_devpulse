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
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["pressed", "loading", "busy"],
	},
	slotStates: buttonSlotStates,
	slotActions: {
		root: [],
		icon: [],
		label: [],
	},
	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: ["aria-pressed", "aria-disabled", "aria-busy"],
	},
	keyboard: ["Enter", "Space"],
};
