/**
 * @file Input Taxonomy Contract
 * @description ColdLight SSOT contract for the input primitive.
 *
 * ariaStateProvider: "coldlight" — native <input> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { inputSlotStates, type InputSlot, type InputState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Input primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"input", InputSlot, InputState> = {
	kind: "input",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["readonly", "invalid", "valid", "required"],
	},
	slotStates: inputSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "textbox",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-describedby",
			"aria-invalid",
			"aria-required",
			"aria-disabled",
			"aria-placeholder",
			"aria-readonly",
		],
	},
	keyboard: [],
};
