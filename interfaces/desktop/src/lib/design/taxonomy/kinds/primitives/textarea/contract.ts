/**
 * @file Textarea Taxonomy Contract
 * @description ColdLight SSOT contract for the textarea primitive.
 *
 * ariaStateProvider: "coldlight" — native <textarea> handles semantics.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { textareaSlotStates, type TextareaSlot, type TextareaState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Textarea primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"textarea", TextareaSlot, TextareaState> = {
	kind: "textarea",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: {
		shared: ["focused", "focus-visible", "hover", "active", "disabled"],
		specific: ["readonly", "invalid", "valid", "required"],
	},
	slotStates: textareaSlotStates,
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
			"aria-multiline",
		],
	},
	keyboard: [],
};
