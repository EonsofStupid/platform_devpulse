/**
 * @file primitives/aspect-ratio/contract.ts
 * @kind aspect-ratio
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * AspectRatio PrimitiveContract — Fixed aspect ratio container for media/content.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Native <div> semantics.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { AspectRatioSlot, AspectRatioState } from "./types.js";

export const contract = {
	kind: "aspect-ratio",
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
} as const satisfies PrimitiveContract<"aspect-ratio", AspectRatioSlot, AspectRatioState>;
