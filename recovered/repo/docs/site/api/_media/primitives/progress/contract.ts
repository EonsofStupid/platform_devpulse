/**
 * @file primitives/progress/contract.ts
 * @kind progress
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Progress PrimitiveContract — SSOT declaration for the progress primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain. 3-folder parity enforced.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ProgressSlot, ProgressState } from "./types.js";

export const contract = {
	kind: "progress",
	ariaStateProvider: "meltui",

	// --- Slots ----------------------------------------------------------------
	slots: {
		required: ["root"],
		optional: ["indicator"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "progressbar",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-label", "aria-labelledby", "aria-valuetext"],
			},
		},
		indicator: {
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
		shared: [],
		specific: ["loading", "pending"],
	},

	slotStates: {
		root: [],
		indicator: [],
	},

	slotActions: {
		root: [],
		indicator: [],
	},

	// --- ARIA -----------------------------------------------------------------
	aria: {
		role: "progressbar",
		requiredAttrs: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-valuetext"],
	},

	// --- Keyboard -------------------------------------------------------------
	// No keyboard interaction for progress bars
	keyboard: [],

	// --- Behavior -------------------------------------------------------------
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"progress", ProgressSlot, ProgressState>;
