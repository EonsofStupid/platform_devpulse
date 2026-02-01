/**
 * @file Label Taxonomy Contract
 * @description ColdLight SSOT contract for the label primitive.
 *
 * ariaStateProvider: "coldlight" — native <label> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { labelSlotStates, type LabelSlot, type LabelState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Label primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"label", LabelSlot, LabelState> = {
	kind: "label",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: [],
	},
	slotStates: labelSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},
	keyboard: [],
};
