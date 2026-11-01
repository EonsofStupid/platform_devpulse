/**
 * @file primitives/code/contract.ts
 * @kind code
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Code PrimitiveContract — SSOT declaration for the code primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <code> semantics.
 *   2-folder parity enforced by scanner: primitives/code/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CodeSlot, CodeState } from "./types.js";

export const contract = {
	kind: "code",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "span",
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
} as const satisfies PrimitiveContract<"code", CodeSlot, CodeState>;
