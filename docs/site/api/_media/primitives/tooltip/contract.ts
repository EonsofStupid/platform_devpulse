/**
 * @file primitives/tooltip/contract.ts
 * @kind tooltip
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Tooltip PrimitiveContract — SSOT declaration for the tooltip primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain. 3-folder parity enforced.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { TooltipSlot, TooltipState } from "./types.js";

export const contract = {
	kind: "tooltip",
	ariaStateProvider: "meltui",

	// --- Slots ----------------------------------------------------------------
	slots: {
		required: ["trigger", "content"],
		optional: ["arrow"],
		forbidden: [],
	},

	slotSpec: {
		trigger: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-describedby"],
			},
		},
		content: {
			element: "div",
			children: "snippet",
			aria: {
				role: "tooltip",
				required: [],
				optional: [],
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
		shared: ["focused", "focus-visible", "hover"],
		specific: ["open", "closed"],
	},

	slotStates: {
		trigger: ["focused", "focus-visible", "hover"],
		content: ["open", "closed"],
		arrow: [],
	},

	slotActions: {
		trigger: ["open", "close"],
		content: [],
		arrow: [],
	},

	// --- ARIA -----------------------------------------------------------------
	aria: {
		role: "tooltip",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	// --- Keyboard (WAI-ARIA APG: Tooltip) -------------------------------------
	// Escape: dismisses the tooltip
	keyboard: ["Escape"],

	// --- Behavior -------------------------------------------------------------
	focusStrategy: "none",
	compound: true,
	dismissBehavior: { escape: true, outsideClick: false },
} as const satisfies PrimitiveContract<"tooltip", TooltipSlot, TooltipState>;
