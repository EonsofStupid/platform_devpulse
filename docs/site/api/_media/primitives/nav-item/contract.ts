/**
 * @file primitives/nav-item/contract.ts
 * @kind nav-item
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Nav-item PrimitiveContract — SSOT declaration for the nav-item primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <a> semantics.
 *   2-folder parity enforced by scanner: primitives/nav-item/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { NavItemSlot, NavItemState } from "./types.js";

export const contract = {
	kind: "nav-item",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: [],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "a",
			children: "snippet",
			aria: {
				role: "link",
				required: [],
				optional: ["aria-current", "aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["active"],
	},

	slotStates: {
		root: ["active", "focused", "focus-visible", "hover", "disabled"],
	},

	slotActions: {
		root: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "link",
		requiredAttrs: [],
		optionalAttrs: ["aria-current", "aria-disabled"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: ["Enter"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"nav-item", NavItemSlot, NavItemState>;
