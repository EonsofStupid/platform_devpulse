/**
 * @file primitives/list/contract.ts
 * @kind list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * List PrimitiveContract — SSOT declaration for the list primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <ul>/<li> semantics.
 *   2-folder parity enforced by scanner: primitives/list/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ListSlot, ListState } from "./types.js";

export const contract = {
	kind: "list",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["item"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "ul",
			children: "snippet",
			aria: {
				role: "list",
				required: [],
				optional: [],
			},
		},
		item: {
			element: "li",
			children: "snippet",
			aria: {
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
		item: [],
	},

	slotActions: {
		root: [],
		item: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "list",
		requiredAttrs: [],
		optionalAttrs: [],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"list", ListSlot, ListState>;
