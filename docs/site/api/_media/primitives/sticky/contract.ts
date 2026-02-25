/**
 * @file primitives/sticky/contract.ts
 * @kind sticky
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Sticky PrimitiveContract — Sticky positioning wrapper for fixed-scroll elements.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <div> semantics.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { StickySlot, StickyState } from "./types.js";

export const contract = {
	kind: "sticky",
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
} as const satisfies PrimitiveContract<"sticky", StickySlot, StickyState>;
