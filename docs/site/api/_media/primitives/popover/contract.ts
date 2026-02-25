/**
 * @file primitives/popover/contract.ts
 * @kind popover
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Popover PrimitiveContract — SSOT declaration for the popover primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain. 3-folder parity enforced.
 *
 * WAI-ARIA APG: Non-modal dialog pattern
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { PopoverSlot, PopoverState } from "./types.js";

export const contract = {
	kind: "popover",
	ariaStateProvider: "meltui",

	// --- Slots ----------------------------------------------------------------
	slots: {
		required: ["trigger", "content"],
		optional: ["arrow"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-haspopup", "aria-expanded", "aria-controls"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-label", "aria-labelledby"],
			},
		},
		arrow: {
			element: "div",
			children: "self-closing",
			aria: {
				required: [],
				optional: [],
			},
		},
	},

	// --- State ----------------------------------------------------------------
	states: {
		shared: ["focused", "focus-visible"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["focused", "focus-visible"],
		content: ["open", "closed"],
		arrow: [],
	},

	slotActions: {
		trigger: ["toggle"],
		content: [],
		arrow: [],
	},

	// --- ARIA -----------------------------------------------------------------
	aria: {
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	// --- Keyboard (WAI-ARIA APG: Non-modal dialog) ----------------------------
	// Escape: closes the popover
	// Tab: moves focus within the popover
	keyboard: ["Escape", "Tab"],

	// --- Behavior -------------------------------------------------------------
	focusStrategy: "redirect",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: true },
} as const satisfies PrimitiveContract<"popover", PopoverSlot, PopoverState>;
