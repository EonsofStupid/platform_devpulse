/**
 * @file RadioGroup Taxonomy Contract
 * @description ColdLight SSOT contract for the radio-group primitive.
 *
 * ariaStateProvider: "coldlight" — native buttons with role="radiogroup"/"radio" + aria-checked at component layer.
 * 2-folder parity: taxonomy + primitive.
 *
 * WAI-ARIA: role="radiogroup" on container, role="radio" on each item.
 * aria-checked required on items (true/false). Only one item checked at a time.
 * Roving tabindex for keyboard navigation (Arrow keys move focus + select).
 * aria-orientation declares navigation axis.
 * Accessible name required on group via aria-label or aria-labelledby.
 */

import type { PrimitiveContract } from "../../../types.js";
import { radioGroupSlotStates, type RadioGroupSlot, type RadioGroupState } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** RadioGroup primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"radio-group", RadioGroupSlot, RadioGroupState> = {
	kind: "radio-group",
	ariaStateProvider: "coldlight",
	slots: { required: ["root", "item"], optional: ["indicator"], forbidden: [] },
	slotSpec: {
		root: {
			element: "div",
			children: "snippet",
			aria: {
				role: "radiogroup",
				required: [],
				optional: [
					"aria-label",
					"aria-labelledby",
					"aria-describedby",
					"aria-orientation",
					"aria-disabled",
					"aria-required",
				],
			},
		},
		item: {
			element: "button",
			children: "snippet",
			aria: {
				role: "radio",
				required: ["aria-checked"],
				optional: ["aria-label", "aria-labelledby", "aria-disabled"],
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
		specific: ["checked"],
	},
	slotStates: radioGroupSlotStates,
	slotActions: { root: [], item: ["select"], indicator: [] },
	aria: {
		role: "radiogroup",
		requiredAttrs: [],
		optionalAttrs: [
			"aria-label",
			"aria-labelledby",
			"aria-describedby",
			"aria-orientation",
			"aria-disabled",
			"aria-required",
		],
	},
	keyboard: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"],
	focusStrategy: "roving",
	compound: true,
	orientation: "vertical",
};
