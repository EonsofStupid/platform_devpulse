/**
 * @file Badge Taxonomy Contract
 * @description ColdLight SSOT contract for the badge primitive.
 *
 * ariaStateProvider: "coldlight" — decorative element, minimal ARIA.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { badgeSlotStates, type BadgeSlot, type BadgeState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Badge primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"badge", BadgeSlot, BadgeState> = {
	kind: "badge",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	states: { shared: ["hover", "active"], specific: [] },
	slotStates: badgeSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-label"],
	},
	keyboard: [],
};
