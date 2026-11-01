/**
 * @file primitives/spacer/contract.ts
 * @kind spacer
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Spacer PrimitiveContract — SSOT declaration for the spacer primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Presentational layout primitive.
 *   2-folder parity enforced by scanner: primitives/spacer/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SpacerSlot, SpacerState } from "./types.js";

export const contract = {
	kind: "spacer",
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
			children: "self-closing",
			aria: {
				role: "none",
				required: [],
				optional: [],
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
		role: "none",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"spacer", SpacerSlot, SpacerState>;
