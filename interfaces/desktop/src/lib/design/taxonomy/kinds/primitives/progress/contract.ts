/**
 * @file Progress Taxonomy Contract
 * @description ColdLight SSOT contract for the progress primitive.
 *
 * ariaStateProvider: "coldlight" — native range widget, direct ARIA application.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: progressbar is a read-only range widget.
 * aria-valuenow required unless indeterminate.
 * aria-valuemin defaults to 0, aria-valuemax defaults to 100.
 * Accessible name required. Children are presentational.
 */

import type { PrimitiveContract } from "../../../types.js";
import { progressSlotStates, type ProgressSlot, type ProgressState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Progress primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"progress", ProgressSlot, ProgressState> = {
	kind: "progress",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "indicator"], optional: [], forbidden: [] },
	states: {
		shared: ["hover", "active", "disabled"],
		specific: ["indeterminate", "loading"],
	},
	slotStates: progressSlotStates,
	slotActions: { root: [], indicator: [] },
	aria: {
		role: "progressbar",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-valuenow",
			"aria-valuemin",
			"aria-valuemax",
			"aria-valuetext",
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-busy",
		],
	},
	keyboard: [],
};
