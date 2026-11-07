/**
 * @file primitives/box/contract.ts
 * @kind box
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Box PrimitiveContract — base layout container.
 * Polymorphic via `as` prop. Token-driven spacing/sizing.
 * No ARIA complexity — native HTML semantics.
 *
 * ariaStateProvider: "coldlight"
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { BoxSlot, BoxState } from "./types.js";

export const contract = {
	kind: "box",
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
} as const satisfies PrimitiveContract<"box", BoxSlot, BoxState>;
