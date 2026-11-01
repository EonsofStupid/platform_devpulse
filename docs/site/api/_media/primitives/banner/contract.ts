/**
 * @file primitives/banner/contract.ts
 * @kind banner
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Banner PrimitiveContract — SSOT declaration for the banner primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter.
 *   2-folder parity enforced by scanner: primitives/banner/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { BannerSlot, BannerState } from "./types.js";

export const contract = {
	kind: "banner",
	ariaStateProvider: "coldlight",

	// ─── Slots ───────────────────────────────────────────────────────────────
	slots: {
		required: ["root"],
		optional: ["icon", "content", "action"],
		forbidden: [],
	},

	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "alert",
				required: [],
				optional: ["aria-label", "aria-live"],
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
		action: {
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
		action: [],
	},

	slotActions: {
		root: [],
		icon: [],
		content: [],
		action: ["dismiss"],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "alert",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-live"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"banner", BannerSlot, BannerState>;
