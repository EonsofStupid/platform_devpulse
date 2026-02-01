/**
 * @file Checkbox Taxonomy Contract
 * @description ColdLight SSOT contract for the checkbox primitive.
 *
 * ariaStateProvider: "coldlight" — native <button> with role="checkbox" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="checkbox" supports tri-state (true/false/mixed).
 * aria-checked required. "mixed" = indeterminate state for parent checkboxes.
 * Accessible name required via aria-label or aria-labelledby.
 * Toggle on Space (native button behavior).
 */

import type { PrimitiveContract } from "../../../types.js";
import { checkboxSlotStates, type CheckboxSlot, type CheckboxState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** Checkbox primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"checkbox", CheckboxSlot, CheckboxState> = {
	kind: "checkbox",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: ["indicator"], forbidden: [] },
	slotSpec: {
		root: {
			element: "button",
			children: "snippet",
			aria: {
				role: "checkbox",
				required: ["aria-checked"],
				optional: [
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-disabled",
					"aria-required",
					"aria-invalid",
				],
			},
		},
		indicator: {
			element: "span",
			children: "snippet",
			aria: { role: "presentation", required: [], optional: [] },
		},
	},
	states: {
		shared: ["hover", "active", "focused", "focus-visible", "disabled"],
		specific: ["checked", "indeterminate"],
	},
	slotStates: checkboxSlotStates,
	slotActions: { root: ["check", "uncheck", "toggle"], indicator: [] },
	aria: {
		role: "checkbox",
		requiredAttrs: ["aria-checked"],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-disabled",
			"aria-required",
			"aria-invalid",
		],
	},
	keyboard: ["Space"],
	focusStrategy: "none",
	compound: true,
};
