/**
 * @file primitives/description-list/contract.ts
 * @kind description-list
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * DescriptionList PrimitiveContract — SSOT declaration for the description-list primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <dl>/<dt>/<dd> semantics.
 *   2-folder parity enforced by scanner: primitives/description-list/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { DescriptionListSlot, DescriptionListState } from "./types.js";

export const contract = {
	kind: "description-list",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["term", "detail"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "dl",
			children: "snippet",
			aria: {
				role: "none",
				required: [],
				optional: [],
			},
		},
		term: {
			element: "dt",
			children: "snippet",
			aria: {
				required: [],
				optional: [],
			},
		},
		detail: {
			element: "dd",
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
		term: [],
		detail: [],
	},

	slotActions: {
		root: [],
		term: [],
		detail: [],
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
} as const satisfies PrimitiveContract<"description-list", DescriptionListSlot, DescriptionListState>;
