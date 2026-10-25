/**
 * @file primitives/steps/contract.ts
 * @kind steps
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Steps PrimitiveContract — SSOT declaration for the steps primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/steps/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { StepsSlot, StepsState } from "./types.js";

export const contract = {
	kind: "steps",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["step"],
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
		step: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-current"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["disabled"],
		specific: ["active"],
	},

	slotStates: {
		root: [],
		step: ["active", "disabled"],
	},

	slotActions: {
		root: [],
		step: ["select"],
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
} as const satisfies PrimitiveContract<"steps", StepsSlot, StepsState>;
