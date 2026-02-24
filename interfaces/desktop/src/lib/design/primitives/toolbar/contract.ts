/**
 * @file primitives/toolbar/contract.ts
 * @kind toolbar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Toolbar PrimitiveContract — SSOT declaration for the toolbar primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Roving tabindex for keyboard nav.
 *   2-folder parity enforced by scanner: primitives/toolbar/ (colocated contract + implementation)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ToolbarSlot, ToolbarState } from "./types.js";

export const contract = {
	kind: "toolbar",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "toolbar",
				required: [],
				optional: ["aria-label", "aria-labelledby", "aria-orientation"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: [],
		specific: [],
	},

	slotStates: {
		root: [],
	},

	slotActions: {
		root: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "toolbar",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-labelledby", "aria-orientation"],
	},

	// ─── Keyboard (WAI-ARIA APG: Toolbar) ──────────────────────────────────────
	keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Tab"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "roving",
	compound: true,
	orientation: "horizontal",
} as const satisfies PrimitiveContract<"toolbar", ToolbarSlot, ToolbarState>;
