/**
 * @file PinInput Taxonomy Contract
 * @description ColdLight SSOT contract for the pin-input primitive.
 *
 * ariaStateProvider: "meltui" — createPinInput provides auto-advance, backspace navigation, and paste handling.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: Group of individual text inputs for one-time passwords or PIN codes.
 * role="group" on root container with aria-label for accessible name.
 * Each input accepts a single character with auto-advance behavior.
 * Keyboard: arrow keys for navigation, backspace for deletion + backward nav.
 */

import type { PrimitiveContract } from "../../../types.js";
import { pinInputSlotStates, type PinInputSlot, type PinInputState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** PinInput primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"pin-input", PinInputSlot, PinInputState> = {
	kind: "pin-input",
	ariaStateProvider: "meltui",
	slots: { required: ["root", "input"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "group", required: [], optional: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled"] },
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: { required: [], optional: ["aria-label", "aria-invalid", "aria-disabled"] },
		},
	},
	states: {
		shared: ["focused", "focus-visible", "disabled"],
		specific: ["invalid", "valid"],
	},
	slotStates: pinInputSlotStates,
	slotActions: { root: [], input: ["focus"] },
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-describedby", "aria-disabled", "aria-invalid"],
	},
	keyboard: ["ArrowLeft", "ArrowRight", "Backspace", "Delete"],
	focusStrategy: "none",
	compound: true,
};
