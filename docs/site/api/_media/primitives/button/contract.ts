/**
 * @file primitives/button/contract.ts
 * @kind button
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Button PrimitiveContract — SSOT declaration for the button primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <button> semantics.
 *   2-folder parity enforced by scanner: primitives/button/ (colocated contract + implementation)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { ButtonSlot, ButtonState } from "./types.js";

export const contract = {
	kind: "button",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["icon", "label"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-describedby", "aria-pressed", "aria-disabled", "aria-busy"],
			},
		},
		icon: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
		},
		label: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: ["pressed", "loading", "busy", "active"],
	},

	slotStates: {
		root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
		icon: [],
		label: [],
	},

	slotActions: {
		root: ["submit"],
		icon: [],
		label: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "button",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-describedby", "aria-pressed", "aria-disabled", "aria-busy"],
	},

	// ─── Keyboard (WAI-ARIA APG: Button) ──────────────────────────────────────
	// Enter: activates the button
	// Space: activates the button
	keyboard: ["Enter", "Space"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"button", ButtonSlot, ButtonState>;
