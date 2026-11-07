/**
 * @file primitives/callout/contract.ts
 * @kind callout
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Callout PrimitiveContract — SSOT declaration for the callout primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/callout/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { CalloutSlot, CalloutState } from "./types.js";

export const contract = {
	kind: "callout",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["icon", "content"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "note",
				required: [],
				optional: ["aria-label"],
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
		content: {
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
		icon: [],
		content: [],
	},

	slotActions: {
		root: [],
		icon: [],
		content: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "note",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"callout", CalloutSlot, CalloutState>;
