/**
 * @file Skeleton Taxonomy Contract
 * @description ColdLight SSOT contract for the skeleton primitive.
 *
 * ariaStateProvider: "coldlight" — presentational placeholder, no complex state machine.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { skeletonSlotStates, type SkeletonSlot, type SkeletonState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Skeleton primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"skeleton", SkeletonSlot, SkeletonState> = {
	kind: "skeleton",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: { role: "status", required: [], optional: ["aria-busy", "aria-label", "aria-hidden"] },
		},
	},
	states: {
		shared: [],
		specific: ["loading", "busy", "visible", "hidden"],
	},
	slotStates: skeletonSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-busy", "aria-label", "aria-hidden"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
};
