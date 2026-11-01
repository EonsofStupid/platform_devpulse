/**
 * @file primitives/divider/contract.ts
 * @kind divider
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Divider PrimitiveContract — SSOT declaration for the divider primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <hr> semantics.
 *   2-folder parity enforced by scanner: primitives/divider/ (colocated contract + implementation)
 *
 * WAI-ARIA APG: separator role
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DividerSlot, DividerState } from "./types.js";

export const contract = {
	kind: "divider",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "hr",
			children: "self-closing",
			aria: {
				role: "separator",
				required: [],
				optional: ["aria-orientation"],
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
		role: "separator",
		requiredAttrs: [],
		optionalAttrs: ["aria-orientation"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"divider", DividerSlot, DividerState>;
