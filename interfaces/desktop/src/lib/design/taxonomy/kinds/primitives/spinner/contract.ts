/**
 * @file Spinner Taxonomy Contract
 * @description ColdLight SSOT contract for the spinner primitive.
 *
 * ariaStateProvider: "coldlight" — polite live region announcing loading state to assistive technology.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="status" with implicit aria-live="polite", aria-atomic="true".
 * Accessible name required via aria-label (e.g., "Loading").
 * No keyboard interaction. No focus management. Purely informational.
 */

import type { PrimitiveContract } from "../../../types.js";
import { spinnerSlotStates, type SpinnerSlot, type SpinnerState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Spinner primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"spinner", SpinnerSlot, SpinnerState> = {
	kind: "spinner",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: {
			element: "span",
			children: "snippet",
			aria: {
				role: "status",
				required: [],
				optional: ["aria-label", "aria-hidden", "aria-busy", "aria-live"],
			},
		},
	},
	states: { shared: [], specific: ["loading", "visible", "hidden"] },
	slotStates: spinnerSlotStates,
	slotActions: { root: [] },
	aria: {
		role: "status",
		requiredAttrs: [],
		optionalAttrs: ["aria-label", "aria-hidden", "aria-busy", "aria-live"],
	},
	keyboard: [],
	focusStrategy: "none",
	compound: false,
};
