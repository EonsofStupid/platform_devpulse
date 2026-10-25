/**
 * @file primitives/avatar/contract.ts
 * @kind avatar
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Avatar PrimitiveContract — SSOT declaration for the avatar primitive.
 * Lives WITH the implementation per ColdLight architecture (locked 2026-02-21).
 *
 * ariaStateProvider: "meltui"
 *   MeltUI adapter handles ARIA via transport chain, 3-folder parity enforced.
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { AvatarSlot, AvatarState } from "./types.js";

export const contract = {
	kind: "avatar",
	ariaStateProvider: "meltui",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["image", "fallback"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: {
				role: "img",
				required: [],
				optional: ["aria-label"],
			},
		},
		image: {
			element: "img",
			children: "self-closing",
			aria: {
				required: [],
				optional: ["aria-hidden"],
			},
		},
		fallback: {
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
		specific: ["loading", "pending"],
	},

	slotStates: {
		root: [],
		image: ["loading"],
		fallback: [],
	},

	slotActions: {
		root: [],
		image: [],
		fallback: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "img",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},

	// ─── Keyboard (Avatar: no keyboard interaction) ───────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"avatar", AvatarSlot, AvatarState>;
