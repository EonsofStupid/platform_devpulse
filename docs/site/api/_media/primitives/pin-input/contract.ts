/**
 * @file primitives/pin-input/contract.ts
 * @kind pin-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Pin-input PrimitiveContract — SSOT declaration for the pin-input primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA + state via transport chain.
 *   3-folder parity enforced by scanner.
 *
 * Builder: new PinInput()
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { PinInputSlot, PinInputState } from "./types.js";

export const contract = {
	kind: "pin-input",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "input"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "textbox",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["disabled"],
		input: ["focused", "focus-visible", "disabled"],
	},

	slotActions: {
		root: [],
		input: ["focus"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby"],
	},

	// ─── Keyboard (ArrowLeft, ArrowRight, Backspace, Delete, Tab) ─────────────
	keyboard: ["ArrowLeft", "ArrowRight", "Backspace", "Delete", "Tab"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
} as const satisfies PrimitiveContract<"pin-input", PinInputSlot, PinInputState>;
