/**
 * @file primitives/skeleton/contract.ts
 * @kind skeleton
 * @layer primitives
 * @package @devpulse/coldlight
 *
 * Skeleton PrimitiveContract — SSOT declaration for the skeleton primitive.
 * Lives WITH the implementation per ColdLight architecture.
 *
 * ariaStateProvider: "coldlight"
 *   ColdLight owns ARIA directly. No adapter. Loading placeholder primitive.
 *   2-folder parity enforced by scanner: primitives/skeleton/ (colocated contract + implementation)
 */

import type { PrimitiveContract } from "../_schema/types.js";
import type { SkeletonSlot, SkeletonState } from "./types.js";

export const contract = {
	kind: "skeleton",
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
			children: "self-closing",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-busy", "aria-label"],
			},
		},
	},

	// ─── State ───────────────────────────────────────────────────────────────
	states: {
		shared: ["loading"],
		specific: [],
	},

	slotStates: {
		root: ["loading"],
	},

	slotActions: {
		root: [],
	},

	// ─── ARIA ─────────────────────────────────────────────────────────────────
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-busy", "aria-label"],
	},

	// ─── Keyboard ─────────────────────────────────────────────────────────────
	keyboard: [],

	// ─── Behavior ─────────────────────────────────────────────────────────────
	focusStrategy: "none",
	compound: false,
} as const satisfies PrimitiveContract<"skeleton", SkeletonSlot, SkeletonState>;
