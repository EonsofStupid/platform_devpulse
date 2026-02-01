/**
 * @file Alert Taxonomy Contract
 * @description ColdLight SSOT contract for the alert primitive.
 *
 * ariaStateProvider: "coldlight" — native live region, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="alert" is an assertive live region.
 * Implicit aria-live="assertive", aria-atomic="true".
 * No focus management. For dynamic content only.
 */

import type { PrimitiveContract } from "../../../types.js";
import { alertSlotStates, type AlertSlot, type AlertState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Alert primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"alert", AlertSlot, AlertState> = {
	kind: "alert",
	ariaStateProvider: "coldlight",
	slots: {
		required: ["root"],
		optional: ["title", "description"],
		forbidden: [],
	},
	states: {
		shared: ["hover", "active"],
		specific: ["visible", "hidden"],
	},
	slotStates: alertSlotStates,
	slotActions: { root: ["dismiss"], title: [], description: [] },
	aria: {
		role: "alert",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-live",
			"aria-atomic",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
		],
	},
	keyboard: ["Escape"],
};
