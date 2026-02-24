/**
 * @file primitives/number-input/contract.ts
 * @kind number-input
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Number-input PrimitiveContract — SSOT declaration for the number-input primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/number-input/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { NumberInputSlot, NumberInputState } from "./types.js";

export const contract = {
	kind: "number-input",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "input"],
		optional: ["increment", "decrement"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "group",
				required: [],
				optional: ["aria-label"],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				role: "spinbutton",
				required: ["aria-valuenow", "aria-valuemin", "aria-valuemax"],
				optional: ["aria-label", "aria-valuetext", "aria-disabled"],
			},
		},
		increment: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
		decrement: {
			element: "button",
			children: "snippet",
			aria: {
				role: "button",
				required: [],
				optional: ["aria-label", "aria-disabled"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["focused", "focus-visible", "hover", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["disabled"],
		input: ["focused", "focus-visible", "disabled"],
		increment: ["hover", "disabled"],
		decrement: ["hover", "disabled"],
	},

	slotActions: {
		root: [],
		input: ["focus", "blur"],
		increment: ["increment"],
		decrement: ["decrement"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard (WAI-ARIA APG: Spinbutton) ──────────────────────────────────
	keyboard: ["ArrowUp", "ArrowDown", "Home", "End"],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"number-input", NumberInputSlot, NumberInputState>;
