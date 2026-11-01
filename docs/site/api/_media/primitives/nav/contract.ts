/**
 * @file primitives/nav/contract.ts
 * @kind nav
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav PrimitiveContract — SSOT declaration for the nav primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/nav/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { NavSlot, NavState } from "./types.js";

export const contract = {
	kind: "nav",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "nav",
			children: "snippet",
			aria: {
				role: "navigation",
				required: [],
				optional: ["aria-label"],
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
		role: "navigation",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"nav", NavSlot, NavState>;
