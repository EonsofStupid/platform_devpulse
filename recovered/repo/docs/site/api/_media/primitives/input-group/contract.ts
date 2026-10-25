/**
 * @file primitives/input-group/contract.ts
 * @kind input-group
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Input-group PrimitiveContract — SSOT declaration for the input-group primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/input-group/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { InputGroupSlot, InputGroupState } from "./types.js";

export const contract = {
	kind: "input-group",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root", "input"],
		optional: ["prefix", "suffix"],
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
		prefix: {
			element: "div",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		input: {
			element: "input",
			children: "self-closing",
			aria: {
				required: [],
				optional: ["aria-label", "aria-describedby"],
			},
		},
		suffix: {
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
		shared: ["focused", "focus-visible", "disabled"],
		specific: [],
	},

	slotStates: {
		root: ["focused", "focus-visible", "disabled"],
		prefix: [],
		input: ["focused", "focus-visible", "disabled"],
		suffix: [],
	},

	slotActions: {
		root: [],
		prefix: [],
		input: ["focus", "blur"],
		suffix: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "group",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: true,
} as const satisfies PrimitiveContract<"input-group", InputGroupSlot, InputGroupState>;
