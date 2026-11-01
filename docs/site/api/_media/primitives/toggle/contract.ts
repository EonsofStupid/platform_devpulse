/**
 * @file primitives/toggle/contract.ts
 * @kind toggle
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toggle PrimitiveContract — SSOT declaration for the toggle primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain. 3-folder parity enforced.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ToggleSlot, ToggleState } from "./types.js";

export const contract = {
	kind: "toggle",
	ariaStateProvider: "meltui",

	// --- Slots ----------------------------------------------------------------
	slots: {
		required: ["trigger"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: ["aria-pressed"],
				optional: ["aria-label", "aria-disabled"],
			},
		},
	},

	// --- State ----------------------------------------------------------------
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["pressed"],
	},

	slotStates: {
		trigger: ["pressed", "focused", "focus-visible", "hover", "disabled"],
	},

	slotActions: {
		trigger: ["toggle"],
	},

	// --- ARIA -----------------------------------------------------------------
	aria: {
		role: "button",
		requiredAttrs: ["aria-pressed"],
		optionalAttrs: ["aria-label", "aria-disabled"],
	},

	// --- Keyboard -------------------------------------------------------------
	// Enter: toggles the pressed state
	// Space: toggles the pressed state
	keyboard: ["Enter", "Space"],

	// --- Behavior -------------------------------------------------------------
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"toggle", ToggleSlot, ToggleState>;
