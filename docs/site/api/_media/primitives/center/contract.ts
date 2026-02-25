/**
 * @file primitives/center/contract.ts
 * @kind center
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Center PrimitiveContract — SSOT declaration for the center primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Presentational layout primitive.
 *   2-folder parity enforced by scanner: primitives/center/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CenterSlot, CenterState } from "./types.js";

export const contract = {
	kind: "center",
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
} as const satisfies PrimitiveContract<"center", CenterSlot, CenterState>;
