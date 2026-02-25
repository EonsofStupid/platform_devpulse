/**
 * @file primitives/stat/contract.ts
 * @kind stat
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Stat PrimitiveContract — SSOT declaration for the stat primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Group semantic primitive.
 *   2-folder parity enforced by scanner: primitives/stat/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { StatSlot, StatState } from "./types.js";

export const contract = {
	kind: "stat",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["label", "value", "delta", "icon"],
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
		label: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		value: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		delta: {
			element: "span",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
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
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: [],
		specific: [],
	},

	slotStates: {
		root: [],
		label: [],
		value: [],
		delta: [],
		icon: [],
	},

	slotActions: {
		root: [],
		label: [],
		value: [],
		delta: [],
		icon: [],
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
	compound: false,
} as const satisfies PrimitiveContract<"stat", StatSlot, StatState>;
